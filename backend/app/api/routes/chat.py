import logging

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
)
from app.services.chat_service import chat_service


router = APIRouter(
    prefix="/chat",
)

logger = logging.getLogger(__name__)


@router.post(
    "",
    response_model=ChatResponse,
)
async def chat(request: ChatRequest):

    try:
        result = await chat_service.process_message(
            message=request.message,
            language=request.language,
            conversation_id=request.conversation_id,
        )

        return result

    except Exception as error:
        logger.exception("Chat generation failed")

        raise HTTPException(
            status_code=502,
            detail=(
                f"AI provider error: {error}"
                if settings.ENVIRONMENT == "development"
                else "Failed to generate AI response."
            ),
        )