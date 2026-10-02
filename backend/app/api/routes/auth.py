import logging

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.banking import AuditEvent
from app.models.identity import User, UserProfileImage
from app.schemas.access import (
    ChangePasswordRequest,
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
)


router = APIRouter(prefix="/auth")
logger = logging.getLogger(__name__)


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "must_change_password": user.must_change_password,
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    try:
        existing = db.scalar(select(User).where(User.email == request.email))
        if existing:
            raise HTTPException(status_code=409, detail="An account with that email already exists.")

        user = User(
            full_name=request.full_name.strip(),
            email=request.email,
            password_hash=hash_password(request.password),
            role="viewer",
            status="pending",
        )
        db.add(user)
        db.flush()
        db.add(AuditEvent(
            action="user.registered",
            entity_type="user",
            entity_id=str(user.id),
            detail="Public registration is pending administrator activation.",
        ))
        db.commit()
    except HTTPException:
        raise
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with that email already exists.") from error
    except SQLAlchemyError as error:
        db.rollback()
        logger.exception("Registration database operation failed")
        raise HTTPException(
            status_code=503,
            detail="Registration database is unavailable or its tables are missing. Verify DATABASE_URL and run `python -m app.setup_database` from backend.",
        ) from error
    return {"status": "pending", "message": "Registration received. An administrator must activate your account."}


@router.post("/login")
def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    try:
        user = db.scalar(select(User).where(User.email == request.email))
    except SQLAlchemyError as error:
        logger.exception("Login database operation failed")
        raise HTTPException(
            status_code=503,
            detail="Sign-in database is unavailable or its tables are missing. Verify DATABASE_URL and run `python -m app.setup_database` from backend.",
        ) from error
    if user is None or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    if user.status == "pending":
        raise HTTPException(status_code=403, detail="Your account is awaiting administrator activation.")
    if user.status != "active":
        raise HTTPException(status_code=403, detail="Your account is suspended. Contact an administrator.")
    if not settings.AUTH_JWT_SECRET:
        raise HTTPException(status_code=503, detail="Authentication is not configured. Set AUTH_JWT_SECRET.")

    response.set_cookie(
        "assistant_session",
        create_access_token(user.id),
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite="strict",
        max_age=settings.AUTH_TOKEN_TTL_MINUTES * 60,
        path="/",
    )
    return {"user": serialize_user(user)}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("assistant_session", path="/", httponly=True, samesite="strict")
    return {"success": True}


@router.get("/me")
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        has_profile_image = db.get(UserProfileImage, user.id) is not None
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Profile image table is unavailable while checking the session")
        has_profile_image = False

    return {
        "user": serialize_user(user),
        "has_profile_image": has_profile_image,
    }


@router.get("/profile-image")
def get_profile_image(
    response: Response,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        image = db.get(UserProfileImage, user.id)
    except SQLAlchemyError as error:
        logger.exception("Profile image table is unavailable")
        raise HTTPException(
            status_code=503,
            detail="Profile photo storage is not initialized. Run `python -m app.setup_database` from backend.",
        ) from error
    if image is None:
        raise HTTPException(status_code=404, detail="No profile image has been uploaded.")
    response.headers["Cache-Control"] = "private, no-store"
    return Response(content=image.image_data, media_type=image.content_type, headers={"Cache-Control": "private, no-store"})


@router.post("/profile-image", status_code=status.HTTP_200_OK)
async def upload_profile_image(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=415, detail="Upload a JPEG, PNG, or WebP profile image.")

    image_data = await file.read(2 * 1024 * 1024 + 1)
    if len(image_data) > 2 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Profile images must be 2 MB or smaller.")

    signatures = {
        "image/jpeg": lambda data: data.startswith(b"\xff\xd8\xff"),
        "image/png": lambda data: data.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/webp": lambda data: data.startswith(b"RIFF") and data[8:12] == b"WEBP",
    }
    if not signatures[file.content_type](image_data):
        raise HTTPException(status_code=415, detail="The uploaded file is not a valid image of the declared type.")

    try:
        image = db.get(UserProfileImage, user.id)
        if image is None:
            image = UserProfileImage(user_id=user.id, image_data=image_data, content_type=file.content_type)
            db.add(image)
        else:
            image.image_data = image_data
            image.content_type = file.content_type
        db.commit()
    except SQLAlchemyError as error:
        db.rollback()
        logger.exception("Profile image upload could not be saved")
        raise HTTPException(
            status_code=503,
            detail="Profile photo storage is not initialized. Run `python -m app.setup_database` from backend.",
        ) from error
    return {"success": True, "message": "Profile image updated."}


@router.delete("/profile-image")
def delete_profile_image(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        image = db.get(UserProfileImage, user.id)
        if image is not None:
            db.delete(image)
            db.commit()
    except SQLAlchemyError as error:
        db.rollback()
        logger.exception("Profile image could not be removed")
        raise HTTPException(
            status_code=503,
            detail="Profile photo storage is not initialized. Run `python -m app.setup_database` from backend.",
        ) from error
    return {"success": True}


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(request.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    user.password_hash = hash_password(request.new_password)
    user.must_change_password = False
    db.commit()
    return {"success": True, "message": "Password updated."}


@router.patch("/profile")
def update_profile(
    request: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    duplicate = db.scalar(
        select(User.id).where(User.email == request.email, User.id != user.id)
    )
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="An account with that email already exists.")

    user.full_name = request.full_name.strip()
    user.email = request.email
    db.add(AuditEvent(
        actor_id=user.id,
        action="user.profile_updated",
        entity_type="user",
        entity_id=str(user.id),
        detail="User updated their own profile name or email.",
    ))
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with that email already exists.") from error
    except SQLAlchemyError as error:
        db.rollback()
        logger.exception("Profile update database operation failed")
        raise HTTPException(status_code=503, detail="Profile could not be saved. Check the database and try again.") from error

    db.refresh(user)
    return {"user": serialize_user(user)}