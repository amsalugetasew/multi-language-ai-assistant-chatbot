from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    account_masked: str = Field(min_length=4, max_length=32)
    counterparty: str = Field(min_length=2, max_length=160)
    direction: Literal["credit", "debit"]
    amount: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    currency: str = Field(default="USD", pattern=r"^[A-Z]{3}$")
    description: str = Field(default="", max_length=2000)
    occurred_at: datetime | None = None


class TransactionDecision(BaseModel):
    note: str = Field(default="", max_length=500)