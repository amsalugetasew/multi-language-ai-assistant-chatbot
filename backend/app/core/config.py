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


settings = Settings()