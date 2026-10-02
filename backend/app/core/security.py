from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from app.core.config import settings


password_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
ROLES = ("admin", "manager", "analyst", "operator", "viewer")
ROLE_PERMISSIONS = {
    "admin": {"users.manage", "transactions.read", "transactions.write", "transactions.approve", "queries.read", "queries.write", "dashboard.read", "chat.use"},
    "manager": {"transactions.read", "transactions.write", "transactions.approve", "queries.read", "queries.write", "dashboard.read", "chat.use"},
    "analyst": {"transactions.read", "queries.read", "dashboard.read", "chat.use"},
    "operator": {"transactions.read", "transactions.write", "dashboard.read", "chat.use"},
    "viewer": {"transactions.read", "dashboard.read", "chat.use"},
}


def hash_password(password: str) -> str:
    return password_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return password_context.verify(password, password_hash)


def create_access_token(user_id: int) -> str:
    if not settings.AUTH_JWT_SECRET:
        raise RuntimeError("AUTH_JWT_SECRET is not configured.")

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.AUTH_TOKEN_TTL_MINUTES
    )
    return jwt.encode(
        {"sub": str(user_id), "exp": expires_at},
        settings.AUTH_JWT_SECRET,
        algorithm="HS256",
    )