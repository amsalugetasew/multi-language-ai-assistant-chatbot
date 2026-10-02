from getpass import getpass

from sqlalchemy import select

import app.models  # noqa: F401
from app.core.database import engine
from app.core.security import hash_password
from app.models.identity import User
from app.schemas.access import validate_email
from sqlalchemy.orm import Session


def main() -> None:
    if engine is None:
        raise SystemExit("Set DATABASE_URL in backend/.env and run setup_database first.")

    with Session(engine) as db:
        if db.scalar(select(User.id).where(User.role == "admin", User.status == "active")):
            raise SystemExit("An active administrator already exists.")

        full_name = input("Administrator name: ").strip()
        email = validate_email(input("Administrator email: "))
        if db.scalar(select(User.id).where(User.email == email)):
            raise SystemExit("That email is already registered.")

        password = getpass("Administrator password (12+ characters): ")
        confirmation = getpass("Confirm password: ")
        if len(password) < 12 or password != confirmation:
            raise SystemExit("Passwords must match and contain at least 12 characters.")

        db.add(User(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            role="admin",
            status="active",
        ))
        db.commit()
        print("Administrator created. No password was printed or stored in plaintext.")


if __name__ == "__main__":
    main()