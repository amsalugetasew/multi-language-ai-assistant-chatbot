from pydantic import BaseModel, Field


class DataQuestion(BaseModel):
    question: str = Field(min_length=3, max_length=2000)


class ConfirmQuery(BaseModel):
    proposal_id: str = Field(min_length=20, max_length=48)