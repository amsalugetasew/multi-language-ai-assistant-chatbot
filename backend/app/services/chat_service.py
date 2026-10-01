from app.services.llm_service import llm_service


class ChatService:

    async def process_message(
        self,
        message: str,
        language: str,
        conversation_id: str | None = None,
    ):

        # Generate AI response
        response = await llm_service.generate_response(
            message=message,
            language=language,
        )

        return {
            "success": True,
            "message": response,
            "language": language,
            "conversation_id": conversation_id,
        }


chat_service = ChatService()