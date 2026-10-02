import secrets

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import require_permission
from app.core.database import get_db
from app.core.security import hash_password, ROLES
from app.models.banking import AuditEvent
from app.models.identity import User
from app.schemas.access import UserCreateRequest, UserUpdateRequest


router = APIRouter(prefix="/users")


def audit_user_action(db: Session, admin: User, action: str, user: User, detail: str = "") -> None:
    db.add(AuditEvent(
        actor_id=admin.id,
        action=action,
        entity_type="user",
        entity_id=str(user.id),
        detail=detail,
    ))


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "must_change_password": user.must_change_password,
        "created_at": user.created_at,
    }


@router.get("")
def list_users(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    _admin: User = Depends(require_permission("users.manage")),
    db: Session = Depends(get_db),
):
    total = db.scalar(select(func.count(User.id))) or 0
    users = db.scalars(
        select(User).order_by(User.id).offset(offset).limit(limit)
    ).all()
    return {
        "users": [serialize_user(user) for user in users],
        "total": total,
        "offset": offset,
        "limit": limit,
    }


@router.get("/roles")
def list_roles(_admin: User = Depends(require_permission("users.manage"))):
    return {"roles": list(ROLES)}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_user(
    request: UserCreateRequest,
    _admin: User = Depends(require_permission("users.manage")),
    db: Session = Depends(get_db),
):
    if db.scalar(select(User.id).where(User.email == request.email)):
        raise HTTPException(status_code=409, detail="An account with that email already exists.")

    temporary_password = secrets.token_urlsafe(15)
    user = User(
        full_name=request.full_name.strip(),
        email=request.email,
        password_hash=hash_password(temporary_password),
        role=request.role,
        status="active",
        must_change_password=True,
    )
    db.add(user)
    db.flush()
    audit_user_action(db, _admin, "user.created", user, f"role={user.role}")
    db.commit()
    db.refresh(user)
    return {"user": serialize_user(user), "temporary_password": temporary_password}


@router.patch("/{user_id}")
def update_user(
    user_id: int,
    request: UserUpdateRequest,
    admin: User = Depends(require_permission("users.manage")),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    values = request.model_dump(exclude_unset=True)
    if user.id == admin.id and values.get("role", user.role) != "admin":
        raise HTTPException(status_code=400, detail="You cannot remove your own administrator role.")
    if user.status == "active" and user.role == "admin" and values.get("role", user.role) != "admin":
        active_admins = db.scalar(
            select(func.count(User.id)).where(
                User.role == "admin",
                User.status == "active",
            )
        ) or 0
        if active_admins <= 1:
            raise HTTPException(status_code=409, detail="The last active administrator cannot be demoted.")
    for field, value in values.items():
        if value is not None:
            setattr(user, field, value)
    audit_user_action(db, admin, "user.updated", user, f"fields={','.join(values)}")
    db.commit()
    db.refresh(user)
    return {"user": serialize_user(user)}


@router.post("/{user_id}/activate")
def activate_user(
    user_id: int,
    _admin: User = Depends(require_permission("users.manage")),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    user.status = "active"
    audit_user_action(db, _admin, "user.activated", user)
    db.commit()
    return {"user": serialize_user(user)}


@router.post("/{user_id}/suspend")
def suspend_user(
    user_id: int,
    admin: User = Depends(require_permission("users.manage")),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot suspend your own account.")
    if user.role == "admin" and user.status == "active":
        active_admins = db.scalar(
            select(func.count(User.id)).where(
                User.role == "admin",
                User.status == "active",
            )
        ) or 0
        if active_admins <= 1:
            raise HTTPException(status_code=409, detail="The last active administrator cannot be suspended.")
    user.status = "suspended"
    audit_user_action(db, admin, "user.suspended", user)
    db.commit()
    return {"user": serialize_user(user)}


@router.post("/{user_id}/reset-password")
def reset_password(
    user_id: int,
    _admin: User = Depends(require_permission("users.manage")),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    temporary_password = secrets.token_urlsafe(15)
    user.password_hash = hash_password(temporary_password)
    user.must_change_password = True
    audit_user_action(db, _admin, "user.password_reset", user)
    db.commit()
    return {"temporary_password": temporary_password, "message": "Password reset. Share this temporary password securely."}