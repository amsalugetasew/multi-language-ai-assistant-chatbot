import json
from dataclasses import dataclass
from datetime import datetime, timezone

import sqlglot
from sqlglot import exp

from app.core.config import settings


@dataclass
class ValidatedQuery:
    sql: str
    is_write: bool


def _table_names(statement: exp.Expression) -> set[str]:
    return {table.name.lower() for table in statement.find_all(exp.Table)}


def validate_query(sql: str, user_id: int, allow_write: bool) -> ValidatedQuery:
    try:
        statements = sqlglot.parse(sql, read="mysql")
    except sqlglot.ParseError as error:
        raise ValueError("The generated SQL could not be parsed as MySQL.") from error

    if len(statements) != 1 or statements[0] is None:
        raise ValueError("Only one SQL statement is allowed at a time.")

    statement = statements[0]
    tables = _table_names(statement)
    if not tables or not tables.issubset({"bank_transactions"}):
        raise ValueError("Queries may only access the bank_transactions table.")
    if any(statement.find(node) for node in (exp.Into, exp.Lock, exp.Command)):
        raise ValueError("File access, locking clauses, and database commands are not allowed.")

    if isinstance(statement, exp.Select):
        if statement.args.get("with_") and statement.args["with_"].args.get("recursive"):
            raise ValueError("Recursive queries are not allowed.")
        function_names = {
            function.name.lower()
            for function in statement.find_all(exp.Func)
            if function.name
        }
        if function_names.intersection({"sleep", "benchmark", "load_file", "get_lock"}):
            raise ValueError("That SQL function is not permitted.")
        limit = statement.args.get("limit")
        if limit is None:
            statement = statement.limit(100)
        else:
            try:
                requested_limit = int(limit.expression.this)
            except (AttributeError, TypeError, ValueError):
                requested_limit = 100
            if requested_limit > 100:
                statement = statement.limit(100, copy=False)
        return ValidatedQuery(statement.sql(dialect="mysql"), False)

    if not allow_write:
        raise ValueError("Your role may run read-only queries but cannot propose ledger entries.")
    if not isinstance(statement, exp.Insert):
        raise ValueError("AI-assisted writes may only create a new pending synthetic ledger entry. Use Transactions to approve or reject entries.")
    if statement.args.get("source") or not isinstance(statement.expression, exp.Values):
        raise ValueError("Only a single-row INSERT with explicit values is allowed.")

    schema = statement.this
    if not isinstance(schema, exp.Schema) or not isinstance(schema.this, exp.Table):
        raise ValueError("The insert target is invalid.")
    column_names = [column.name.lower() for column in schema.expressions]
    allowed_columns = {
        "reference", "account_masked", "counterparty", "direction", "amount",
        "currency", "status", "description", "occurred_at", "created_by_id",
    }
    if len(column_names) != len(set(column_names)) or not set(column_names).issubset(allowed_columns):
        raise ValueError("The insert includes duplicate or unsupported transaction columns.")

    values = statement.expression.expressions
    if len(values) != 1 or not isinstance(values[0], exp.Tuple):
        raise ValueError("Only one ledger entry can be created per confirmation.")

    value_expressions = values[0].expressions
    if len(value_expressions) != len(column_names):
        raise ValueError("The generated insert has mismatched columns and values.")
    row = dict(zip(column_names, value_expressions))
    required = {"reference", "account_masked", "counterparty", "direction", "amount", "currency"}
    if not required.issubset(row):
        raise ValueError("The generated entry is missing required ledger fields.")

    reference = row["reference"]
    masked_account = row["account_masked"]
    status = row.get("status")
    direction = row["direction"]
    currency = row["currency"]
    if not isinstance(reference, exp.Literal) or not reference.is_string or not reference.this.upper().startswith("AI-DEMO-"):
        raise ValueError("AI-generated references must use the AI-DEMO- prefix.")
    masked_value = masked_account.this.strip() if isinstance(masked_account, exp.Literal) else ""
    mask_prefix = "••••" if masked_value.startswith("••••") else "****" if masked_value.startswith("****") else ""
    account_digits = masked_value[len(mask_prefix):].strip() if mask_prefix else ""
    if (
        not isinstance(masked_account, exp.Literal)
        or not masked_account.is_string
        or not mask_prefix
        or len(account_digits) > 4
        or (account_digits and not account_digits.isdigit())
    ):
        raise ValueError("Only masked account numbers ending in at most four digits are allowed.")
    if not isinstance(direction, exp.Literal) or direction.this.lower() not in {"credit", "debit"}:
        raise ValueError("Transaction direction must be credit or debit.")
    if (
        not isinstance(currency, exp.Literal)
        or not currency.this.isascii()
        or len(currency.this) != 3
        or not currency.this.isalpha()
        or not currency.this.isupper()
    ):
        raise ValueError("Currency must be a three-letter uppercase code.")
    if status is not None and (not isinstance(status, exp.Literal) or status.this.lower() != "pending"):
        raise ValueError("AI-created transaction entries must start pending approval.")
    amount = row["amount"]
    if not isinstance(amount, exp.Literal):
        raise ValueError("Transaction amount must be a literal number.")
    try:
        if float(amount.this) <= 0:
            raise ValueError("Transaction amount must be greater than zero.")
    except (TypeError, ValueError) as error:
        if isinstance(error, ValueError) and str(error) == "Transaction amount must be greater than zero.":
            raise
        raise ValueError("Transaction amount must be a literal number.") from error

    creator = row.get("created_by_id")
    if creator is not None and (
        not isinstance(creator, exp.Literal)
        or creator.is_string
        or int(creator.this) != user_id
    ):
        raise ValueError("A ledger entry can only be attributed to the signed-in user.")

    timestamp_value = exp.Literal.string(
        datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    )
    defaults = {
        "status": exp.Literal.string("pending"),
        "description": exp.Literal.string("SYNTHETIC: AI-generated ledger entry"),
        "occurred_at": timestamp_value,
    }
    for column, value in defaults.items():
        if column not in row:
            schema.append("expressions", exp.to_identifier(column))
            values[0].append("expressions", value)
    if isinstance(row.get("occurred_at"), exp.CurrentTimestamp):
        column_index = column_names.index("occurred_at")
        values[0].expressions[column_index] = timestamp_value
    if "created_by_id" not in row:
        schema.append("expressions", exp.to_identifier("created_by_id"))
        values[0].append("expressions", exp.Literal.number(user_id))
    if "description" in row and isinstance(row["description"], exp.Literal) and row["description"].is_string:
        if not row["description"].this.startswith("SYNTHETIC:"):
            row["description"].set("this", f"SYNTHETIC: {row['description'].this}")

    return ValidatedQuery(statement.sql(dialect="mysql"), True)


async def generate_sql(question: str) -> tuple[str, str]:
    if not settings.LLM_API_KEY:
        raise ValueError("LLM_API_KEY is required when using Groq.")

    from groq import AsyncGroq

    client = AsyncGroq(api_key=settings.LLM_API_KEY)
    completion = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You create safe MySQL queries for a synthetic banking ledger. "
                    "The only table is bank_transactions with columns: id, reference, "
                    "account_masked, counterparty, direction (credit/debit), amount, "
                    "currency, status (pending/approved/rejected/posted), description, "
                    "occurred_at, created_by_id, approved_by_id, created_at. Never query "
                    "users, credentials, or audit data. For questions return one SELECT. "
                    "For a request to record a transaction, return exactly one INSERT "
                    "with reference beginning AI-DEMO-, account_masked in form '•••• 1234', "
                    "status pending, valid currency, positive amount, and values only. "
                    "Never return UPDATE, DELETE, DDL, multiple statements, or real transfer "
                    "instructions. Respond as JSON: {\"sql\": \"...\", \"explanation\": \"...\"}."
                ),
            },
            {"role": "user", "content": question},
        ],
        response_format={"type": "json_object"},
    )
    content = completion.choices[0].message.content
    if not content:
        raise ValueError("The AI did not produce a SQL proposal.")
    try:
        result = json.loads(content)
        sql = result["sql"]
        explanation = result.get("explanation", "")
    except (json.JSONDecodeError, KeyError, TypeError) as error:
        raise ValueError("The AI returned an invalid query proposal.") from error
    if not isinstance(sql, str) or not isinstance(explanation, str):
        raise ValueError("The AI returned an invalid query proposal.")
    return sql, explanation[:1000]