from app.core.config import settings
from app.utils.language import get_language_instruction


class LLMService:
    """
    Handles communication with the selected LLM provider.
    """

    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.model = settings.LLM_MODEL

    async def generate_response(
        self,
        message: str,
        language: str,
    ) -> str:

        # -------------------------------------------------
        # Temporary development response
        # -------------------------------------------------

        if self.provider == "mock":
            return self._mock_response(
                message,
                language,
            )

        # -------------------------------------------------
        # Future providers
        # -------------------------------------------------

        if self.provider == "openai":
            return await self._generate_openai_response(
                message,
                language,
            )

        if self.provider == "ollama":
            return await self._generate_ollama_response(
                message,
                language,
            )

        if self.provider == "groq":
            return await self._generate_groq_response(
                message,
                language,
            )

        raise ValueError(
            f"Unsupported LLM provider: {self.provider}"
        )

    # -----------------------------------------------------
    # Mock response
    # -----------------------------------------------------

    def _mock_response(
        self,
        message: str,
        language: str,
    ) -> str:

        responses = {
            "English": (
                f"I understand your question: "
                f'"{message}". '
                "This is a simulated AI response. "
                "Connect the application to a real LLM "
                "provider to generate intelligent responses."
            ),

            "Amharic": (
                f'ጥያቄዎን ተረድቻለሁ፦ "{message}"። '
                "ይህ ለጊዜው የተመሰለ የAI ምላሽ ነው።"
            ),

            "Afaan Oromo": (
                f'Gaaffii kee nan hubadhe: "{message}". '
                "Kun deebii AI fakkeeffame dha."
            ),

            "Arabic": (
                f'لقد فهمت سؤالك: "{message}". '
                "هذه إجابة تجريبية للذكاء الاصطناعي."
            ),

            "French": (
                f'J’ai compris votre question : "{message}". '
                "Ceci est une réponse AI simulée."
            ),

            "Spanish": (
                f'Entiendo tu pregunta: "{message}". '
                "Esta es una respuesta de IA simulada."
            ),

            "Chinese": (
                f'我理解你的问题：“{message}”。'
                "这是目前的模拟 AI 回复。"
            ),
        }

        return responses.get(
            language,
            responses["English"],
        )

    # -----------------------------------------------------
    # OpenAI
    # -----------------------------------------------------

    async def _generate_openai_response(
        self,
        message: str,
        language: str,
    ) -> str:

        # Implement actual provider integration here.
        raise NotImplementedError(
            "OpenAI integration has not been configured yet."
        )

    # -----------------------------------------------------
    # Ollama / Local LLM
    # -----------------------------------------------------

    async def _generate_ollama_response(
        self,
        message: str,
        language: str,
    ) -> str:

        # Implement local LLM integration here.
        raise NotImplementedError(
            "Ollama integration has not been configured yet."
        )

    # -----------------------------------------------------
    # Groq
    # -----------------------------------------------------

    async def _generate_groq_response(
        self,
        message: str,
        language: str,
    ) -> str:

        if not settings.LLM_API_KEY:
            raise ValueError("LLM_API_KEY is required when using Groq.")

        from groq import AsyncGroq

        client = AsyncGroq(api_key=settings.LLM_API_KEY)
        completion = await client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": get_language_instruction(language),
                },
                {"role": "user", "content": message},
            ],
        )
        response = completion.choices[0].message.content
        if not response:
            raise ValueError("Groq returned an empty response.")
        return response


llm_service = LLMService()