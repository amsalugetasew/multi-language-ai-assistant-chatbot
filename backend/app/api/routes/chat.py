import logging

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi import Depends

from app.core.config import settings
from app.api.dependencies import get_current_user
from app.models.identity import User
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
)
from app.services.chat_service import chat_service


router = APIRouter(
    prefix="/chat",
)

logger = logging.getLogger(__name__)


def _provider_error(error: Exception, task: str) -> HTTPException:
    error_name = type(error).__name__
    provider_status = getattr(error, "status_code", None)

    if "Authentication" in error_name or provider_status == 401:
        status_code = 503
        code = "invalid_api_key"
        message = "The Groq API key was rejected. Check LLM_API_KEY in backend/.env and restart the backend."
    elif "RateLimit" in error_name or provider_status == 429:
        status_code = 429
        code = "provider_rate_limit"
        message = "The Groq usage limit was reached. Check your Groq plan and limits, or try again later."
    elif "NotFound" in error_name or provider_status == 404:
        status_code = 503
        code = "model_unavailable"
        message = "The configured Groq model is unavailable to this account. Check the model ID and account access."
    elif "Connection" in error_name or "Timeout" in error_name:
        status_code = 503
        code = "provider_unavailable"
        message = "Could not reach Groq. Check your internet connection and try again."
    elif "BadRequest" in error_name or provider_status == 400:
        status_code = 422
        code = "provider_rejected_request"
        message = "Groq rejected this request. Check the message and image format, then try again."
    elif isinstance(error, ValueError) and "LLM_API_KEY" in str(error):
        status_code = 503
        code = "missing_api_key"
        message = "Groq is not configured yet. Add LLM_API_KEY to backend/.env and restart the backend."
    else:
        status_code = 502
        code = "provider_error"
        message = f"Groq could not complete the {task}. Try again shortly."

    logger.error("%s failed (%s): %s", task, code, error, exc_info=error)
    return HTTPException(
        status_code=status_code,
        detail={"code": code, "message": message},
    )


@router.post(
    "",
    response_model=ChatResponse,
)
async def chat(
    request: ChatRequest,
    _user: User = Depends(get_current_user),
):

    try:
        result = await chat_service.process_message(
            message=request.message,
            language=request.language,
            conversation_id=request.conversation_id,
            images=request.images,
        )

        return result

    except Exception as error:
        raise _provider_error(error, "response") from error


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    _user: User = Depends(get_current_user),
):
    if not settings.LLM_API_KEY:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "missing_api_key",
                "message": "Voice transcription is not configured. Add LLM_API_KEY to backend/.env and restart the backend.",
            },
        )

    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=415,
            detail="Upload a supported audio recording.",
        )

    audio = await file.read(25 * 1024 * 1024 + 1)
    if len(audio) > 25 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Audio recordings must be 25 MB or smaller.",
        )
    if not audio:
        raise HTTPException(status_code=400, detail="The audio recording is empty.")

    try:
        from groq import AsyncGroq

        client = AsyncGroq(api_key=settings.LLM_API_KEY)
        transcription = await client.audio.transcriptions.create(
            model=settings.LLM_TRANSCRIPTION_MODEL,
            file=(
                file.filename or "voice.webm",
                audio,
                file.content_type.split(";")[0],
            ),
            response_format="json",
        )
        return {"text": transcription.text}
    except Exception as error:
        raise _provider_error(error, "audio transcription") from error
    finally:
        await file.close()