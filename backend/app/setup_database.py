import sys

import app.models  # noqa: F401
from app.core.database import Base, engine


def main() -> None:
    if engine is None:
        raise SystemExit("Set DATABASE_URL in backend/.env before creating the schema.")
    Base.metadata.create_all(engine)
    print("Application tables created or already present.")


if __name__ == "__main__":
    main()