from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter

from app.schemas.chat import (
    ConversationCreate,
    ConversationResponse,
)


router = APIRouter(
    prefix="/conversations",
)


conversations = {}


@router.post(
    "",
    response_model=ConversationResponse,
)
async def create_conversation(
    request: ConversationCreate,
):

    conversation_id = str(uuid4())

    now = datetime.utcnow().isoformat()

    conversation = {
        "id": conversation_id,
        "title": request.title,
        "language": request.language,
        "created_at": now,
        "updated_at": now,
    }

    conversations[conversation_id] = conversation

    return conversation


@router.get("")
async def get_conversations():

    return list(conversations.values())


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: str,
):

    conversation = conversations.get(
        conversation_id
    )

    if not conversation:
        return {
            "error": "Conversation not found."
        }

    return conversation


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
):

    if conversation_id not in conversations:
        return {
            "success": False,
            "message": "Conversation not found.",
        }

    del conversations[conversation_id]

    return {
        "success": True,
        "message": "Conversation deleted.",
    }