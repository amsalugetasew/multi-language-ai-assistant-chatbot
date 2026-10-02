import os

from dotenv import load_dotenv


load_dotenv()


class Settings:
    APP_NAME: str = os.getenv(
        "APP_NAME",
        "Multi-Language AI Assistant",
    )

    ENVIRONMENT: str = os.getenv(
        "ENVIRONMENT",
        "development",
    )

    API_HOST: str = os.getenv(
        "API_HOST",
        "0.0.0.0",
    )

    API_PORT: int = int(
        os.getenv(
            "API_PORT",
            "8000",
        )
    )

    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    ]

    # LLM configuration
    LLM_PROVIDER: str = os.getenv(
        "LLM_PROVIDER",
        "groq",
    )

    LLM_API_KEY: str = os.getenv(
        "LLM_API_KEY",
        "",
    )

    LLM_MODEL: str = os.getenv(
        "LLM_MODEL",
        "openai/gpt-oss-20b",
    )

    LLM_VISION_MODEL: str = os.getenv(
        "LLM_VISION_MODEL",
        "qwen/qwen3.8-27b",
    )

    LLM_TRANSCRIPTION_MODEL: str = os.getenv(
        "LLM_TRANSCRIPTION_MODEL",
        "whisper-large-v3-turbo",
    )

    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    AUTH_JWT_SECRET: str = os.getenv("AUTH_JWT_SECRET", "")

    AUTH_TOKEN_TTL_MINUTES: int = int(
        os.getenv("AUTH_TOKEN_TTL_MINUTES", "480")
    )

    AUTH_COOKIE_SECURE: bool = os.getenv(
        "AUTH_COOKIE_SECURE",
        "false",
    ).lower() == "true"


settings = Settings()