from pydantic import BaseModel, Field, field_validator

from app.utils.language import SUPPORTED_LANGUAGES


SupportedLanguage = str


class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=10000,
    )

    language: SupportedLanguage = "English"

    @field_validator("language")
    @classmethod
    def validate_language(cls, language: str) -> str:
        if language != "Auto-detect" and language not in SUPPORTED_LANGUAGES:
            raise ValueError("Unsupported language.")
        return language

    conversation_id: str | None = None


class ChatResponse(BaseModel):
    success: bool = True

    message: str

    language: str

    conversation_id: str | None = None


class ConversationCreate(BaseModel):
    title: str = "New Chat"

    language: SupportedLanguage = "English"

    @field_validator("language")
    @classmethod
    def validate_language(cls, language: str) -> str:
        if language != "Auto-detect" and language not in SUPPORTED_LANGUAGES:
            raise ValueError("Unsupported language.")
        return language


class ConversationResponse(BaseModel):
    id: str

    title: str

    language: str

    created_at: str

    updated_at: str