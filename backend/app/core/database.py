from collections.abc import Generator

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session

from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine = (
    create_engine(settings.DATABASE_URL, pool_pre_ping=True)
    if settings.DATABASE_URL
    else None
)


def get_db() -> Generator[Session, None, None]:
    if engine is None:
        raise HTTPException(
            status_code=503,
            detail="Database is not configured. Set DATABASE_URL in backend/.env.",
        )

    with Session(engine) as session:
        yield session