
# This is useful for checking whether the backend is running.

from datetime import datetime


from fastapi import APIRouter

from app.utils.language import LANGUAGES


router = APIRouter(
    prefix="/health",
)


@router.get("")
async def health_check():

    return {
        "status": "healthy",
        "service": "multi-language-ai-assistant",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/languages")
async def get_languages():
    return {
        "languages": [
            {"name": name, **details}
            for name, details in LANGUAGES.items()
        ]
    }