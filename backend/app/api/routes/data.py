import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.dependencies import require_permission
from app.core.database import get_db
from app.core.security import ROLE_PERMISSIONS
from app.models.banking import AuditEvent, QueryProposal
from app.models.identity import User
from app.schemas.data_query import ConfirmQuery, DataQuestion
from app.services.data_query_service import generate_sql, validate_query


router = APIRouter(prefix="/data")


def json_value(value):
    if isinstance(value, (datetime,)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    return value


def execute_select(db: Session, sql: str) -> dict:
    rows = db.execute(text(sql)).mappings().all()
    return {
        "columns": list(rows[0].keys()) if rows else [],
        "rows": [{key: json_value(value) for key, value in row.items()} for row in rows],
        "row_count": len(rows),
    }


@router.post("/query")
async def propose_query(
    request: DataQuestion,
    user: User = Depends(require_permission("queries.read")),
    db: Session = Depends(get_db),
):
    try:
        sql, explanation = await generate_sql(request.question)
        can_write = "queries.write" in ROLE_PERMISSIONS.get(user.role, set())
        validated = validate_query(sql, user.id, allow_write=can_write)

        if not validated.is_write:
            result = execute_select(db, validated.sql)
            return {
                "sql": validated.sql,
                "explanation": explanation,
                "requires_confirmation": False,
                **result,
            }

        proposal = QueryProposal(
            id=secrets.token_urlsafe(24),
            user_id=user.id,
            sql_text=validated.sql,
            explanation=explanation,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
        )
        db.add(proposal)
        db.commit()
        return {
            "sql": validated.sql,
            "explanation": explanation,
            "requires_confirmation": True,
            "proposal_id": proposal.id,
            "expires_in_seconds": 300,
        }
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=502,
            detail="The AI data request could not be completed. Check your access, database connection, and Groq configuration.",
        ) from error


@router.post("/query/confirm")
def confirm_query(
    request: ConfirmQuery,
    user: User = Depends(require_permission("queries.write")),
    db: Session = Depends(get_db),
):
    proposal = db.get(QueryProposal, request.proposal_id)
    if proposal is None or proposal.user_id != user.id:
        raise HTTPException(status_code=404, detail="Query proposal not found.")
    if proposal.executed_at is not None:
        raise HTTPException(status_code=409, detail="This proposal has already been used.")
    expiry = proposal.expires_at
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    if expiry < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="This proposal expired. Ask the AI to generate it again.")

    try:
        validated = validate_query(proposal.sql_text, user.id, allow_write=True)
        if not validated.is_write:
            raise ValueError("This proposal is not a write operation.")
        result = db.execute(text(validated.sql))
        proposal.executed_at = datetime.now(timezone.utc)
        db.add(AuditEvent(
            actor_id=user.id,
            action="ai_query.insert_confirmed",
            entity_type="bank_transaction",
            entity_id="pending",
            detail=proposal.explanation,
        ))
        db.commit()
        return {
            "success": True,
            "message": "Synthetic ledger entry added as pending approval.",
            "affected_rows": result.rowcount,
            "sql": validated.sql,
        }
    except ValueError as error:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(error)) from error
    except Exception as error:
        db.rollback()
        raise HTTPException(status_code=422, detail="The confirmed insert could not be applied to the ledger.") from error