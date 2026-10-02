from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

import app.models  # noqa: F401
from app.core.database import engine
from app.models.banking import BankTransaction
from app.models.identity import User


SAMPLE_ROWS = [
    ("credit", "Northstar Supplies", "•••• 1042", "1250.00", "Invoice settlement"),
    ("debit", "Harbor Utilities", "•••• 1042", "186.42", "Monthly utilities"),
    ("credit", "Cedar Grove Market", "•••• 2088", "4380.00", "Retail settlement"),
    ("debit", "Meridian Office Co.", "•••• 2088", "742.19", "Office equipment"),
    ("credit", "Aster Wholesale", "•••• 3156", "2630.50", "Supplier refund"),
    ("debit", "Blue Finch Logistics", "•••• 3156", "319.75", "Freight charge"),
    ("credit", "Juniper Consulting", "•••• 1042", "5100.00", "Service payment"),
    ("debit", "Granite Telecom", "•••• 2088", "94.99", "Network service"),
    ("credit", "Redwood Foods", "•••• 3156", "1875.25", "Wholesale settlement"),
    ("debit", "Westlake Insurance", "•••• 1042", "625.00", "Policy premium"),
    ("credit", "Silverline Studio", "•••• 2088", "960.00", "Client payment"),
    ("debit", "Summit Equipment", "•••• 3156", "1480.00", "Equipment lease"),
]


def main() -> None:
    if engine is None:
        raise SystemExit("Set DATABASE_URL in backend/.env and run setup_database first.")

    with Session(engine) as db:
        admin = db.scalar(select(User).where(User.role == "admin", User.status == "active"))
        if admin is None:
            raise SystemExit("Create the first administrator before loading demo transactions.")
        existing = db.scalar(select(BankTransaction.id).where(BankTransaction.reference.like("DEMO-%")).limit(1))
        if existing:
            raise SystemExit("Synthetic demo transactions already exist.")

        now = datetime.now(timezone.utc)
        for index, (direction, counterparty, account, amount, description) in enumerate(SAMPLE_ROWS):
            db.add(BankTransaction(
                reference=f"DEMO-{index + 1:04d}",
                account_masked=account,
                counterparty=counterparty,
                direction=direction,
                amount=Decimal(amount),
                currency="USD",
                status="pending" if index % 4 == 0 else "approved",
                description=f"SYNTHETIC SAMPLE: {description}",
                occurred_at=now - timedelta(days=index * 3),
                created_by_id=admin.id,
                approved_by_id=admin.id if index % 4 else None,
            ))
        db.commit()
        print(f"Loaded {len(SAMPLE_ROWS)} clearly marked synthetic transactions.")


if __name__ == "__main__":
    main()