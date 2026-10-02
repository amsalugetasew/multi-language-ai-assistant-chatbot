from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.models.identity import User

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
    _user: User = Depends(get_current_user),
):

    conversation_id = str(uuid4())

    now = datetime.utcnow().isoformat()

    conversation = {
        "id": conversation_id,
        "user_id": _user.id,
        "title": request.title,
        "language": request.language,
        "created_at": now,
        "updated_at": now,
    }

    conversations[conversation_id] = conversation

    return conversation


@router.get("")
async def get_conversations(
    _user: User = Depends(get_current_user),
):

    return [
        conversation
        for conversation in conversations.values()
        if conversation["user_id"] == _user.id
    ]


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    _user: User = Depends(get_current_user),
):

    conversation = conversations.get(conversation_id)

    if not conversation or conversation["user_id"] != _user.id:
        return {
            "error": "Conversation not found."
        }

    return conversation


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    _user: User = Depends(get_current_user),
):

    conversation = conversations.get(conversation_id)
    if not conversation or conversation["user_id"] != _user.id:
        return {
            "success": False,
            "message": "Conversation not found.",
        }

    del conversations[conversation_id]

    return {
        "success": True,
        "message": "Conversation deleted.",
    }