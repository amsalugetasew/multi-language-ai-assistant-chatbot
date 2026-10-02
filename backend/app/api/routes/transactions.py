import secrets
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_permission
from app.core.database import get_db
from app.models.banking import AuditEvent, BankTransaction
from app.models.identity import User
from app.schemas.transactions import TransactionCreate, TransactionDecision


router = APIRouter(prefix="/transactions")


def serialize_transaction(transaction: BankTransaction) -> dict:
    return {
        "id": transaction.id,
        "reference": transaction.reference,
        "account_masked": transaction.account_masked,
        "counterparty": transaction.counterparty,
        "direction": transaction.direction,
        "amount": str(transaction.amount),
        "currency": transaction.currency,
        "status": transaction.status,
        "description": transaction.description,
        "occurred_at": transaction.occurred_at,
        "created_at": transaction.created_at,
    }


def add_audit(
    db: Session,
    actor_id: int,
    action: str,
    transaction_id: int,
    detail: str = "",
) -> None:
    db.add(AuditEvent(
        actor_id=actor_id,
        action=action,
        entity_type="bank_transaction",
        entity_id=str(transaction_id),
        detail=detail,
    ))


@router.get("")
def list_transactions(
    status_filter: str | None = Query(default=None, alias="status"),
    search: str = Query(default="", max_length=160),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _user: User = Depends(require_permission("transactions.read")),
    db: Session = Depends(get_db),
):
    query = select(BankTransaction)
    if status_filter:
        if status_filter not in {"pending", "approved", "rejected", "posted"}:
            raise HTTPException(status_code=422, detail="Choose a valid transaction status.")
        query = query.where(BankTransaction.status == status_filter)
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.where(
            BankTransaction.reference.ilike(term)
            | BankTransaction.counterparty.ilike(term)
            | BankTransaction.account_masked.ilike(term)
        )
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.scalars(
        query.order_by(BankTransaction.occurred_at.desc(), BankTransaction.id.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return {"items": [serialize_transaction(row) for row in rows], "total": total}


@router.post("", status_code=201)
def create_transaction(
    request: TransactionCreate,
    user: User = Depends(require_permission("transactions.write")),
    db: Session = Depends(get_db),
):
    transaction = BankTransaction(
        reference=f"SYN-{secrets.token_hex(6).upper()}",
        account_masked=request.account_masked,
        counterparty=request.counterparty.strip(),
        direction=request.direction,
        amount=request.amount,
        currency=request.currency,
        status="pending",
        description=request.description.strip(),
        occurred_at=request.occurred_at or datetime.now(timezone.utc),
        created_by_id=user.id,
    )
    db.add(transaction)
    db.flush()
    add_audit(db, user.id, "transaction.created", transaction.id, transaction.reference)
    db.commit()
    db.refresh(transaction)
    return {"item": serialize_transaction(transaction)}


def decide_transaction(
    transaction_id: int,
    decision: str,
    request: TransactionDecision,
    user: User,
    db: Session,
) -> dict:
    transaction = db.get(BankTransaction, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    if transaction.status != "pending":
        raise HTTPException(status_code=409, detail="Only pending transactions can be approved or rejected.")
    transaction.status = decision
    transaction.approved_by_id = user.id
    add_audit(db, user.id, f"transaction.{decision}", transaction.id, request.note.strip())
    db.commit()
    db.refresh(transaction)
    return {"item": serialize_transaction(transaction)}


@router.post("/{transaction_id}/approve")
def approve_transaction(
    transaction_id: int,
    request: TransactionDecision,
    user: User = Depends(require_permission("transactions.approve")),
    db: Session = Depends(get_db),
):
    return decide_transaction(transaction_id, "approved", request, user, db)


@router.post("/{transaction_id}/reject")
def reject_transaction(
    transaction_id: int,
    request: TransactionDecision,
    user: User = Depends(require_permission("transactions.approve")),
    db: Session = Depends(get_db),
):
    return decide_transaction(transaction_id, "rejected", request, user, db)


@router.get("/summary")
def transaction_summary(
    _user: User = Depends(require_permission("dashboard.read")),
    db: Session = Depends(get_db),
):
    total = db.scalar(select(func.count(BankTransaction.id))) or 0
    pending = db.scalar(
        select(func.count(BankTransaction.id)).where(BankTransaction.status == "pending")
    ) or 0
    volume_by_currency = db.execute(
        select(
            BankTransaction.currency,
            func.coalesce(func.sum(BankTransaction.amount), 0),
        )
        .where(BankTransaction.status == "approved")
        .group_by(BankTransaction.currency)
    ).all()
    by_status = db.execute(
        select(BankTransaction.status, func.count(BankTransaction.id))
        .group_by(BankTransaction.status)
    ).all()
    by_direction = db.execute(
        select(BankTransaction.direction, func.count(BankTransaction.id))
        .group_by(BankTransaction.direction)
    ).all()
    return {
        "total_transactions": total,
        "pending_approval": pending,
        "approved_volume_by_currency": {
            currency: str(amount)
            for currency, amount in volume_by_currency
        },
        "by_status": {status: count for status, count in by_status},
        "by_direction": {direction: count for direction, count in by_direction},
    }