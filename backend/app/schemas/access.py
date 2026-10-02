from pydantic import BaseModel, Field, field_validator

from app.core.security import ROLES


def validate_email(value: str) -> str:
    email = value.strip().lower()
    if len(email) > 254 or email.count("@") != 1 or "." not in email.rsplit("@", 1)[-1]:
        raise ValueError("Enter a valid email address.")
    return email


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: str = Field(max_length=254)
    password: str = Field(min_length=12, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return validate_email(value)


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return validate_email(value)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=12, max_length=128)


class ProfileUpdateRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: str = Field(max_length=254)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return validate_email(value)


class UserCreateRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: str = Field(max_length=254)
    role: str = "viewer"

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return validate_email(value)

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        if value not in ROLES:
            raise ValueError("Choose a supported role.")
        return value


class UserUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=160)
    email: str | None = Field(default=None, max_length=254)
    role: str | None = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        return validate_email(value) if value is not None else None

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str | None) -> str | None:
        if value is not None and value not in ROLES:
            raise ValueError("Choose a supported role.")
        return value