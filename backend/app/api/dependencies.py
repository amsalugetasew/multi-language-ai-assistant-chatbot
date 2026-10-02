from collections.abc import Callable

import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import ROLE_PERMISSIONS
from app.models.identity import User


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    if not settings.AUTH_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured. Set AUTH_JWT_SECRET in backend/.env and restart the backend.",
        )

    token = request.cookies.get("assistant_session")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to continue.",
        )

    try:
        payload = jwt.decode(
            token,
            settings.AUTH_JWT_SECRET,
            algorithms=["HS256"],
        )
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, TypeError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Sign in again.",
        ) from error

    user = db.get(User, user_id)
    if user is None or user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not active. Contact an administrator.",
        )
    return user


def require_permission(permission: str) -> Callable:
    def permission_dependency(
        user: User = Depends(get_current_user),
    ) -> User:
        if permission not in ROLE_PERMISSIONS.get(user.role, set()):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account does not have permission for this action.",
            )
        return user

    return permission_dependency