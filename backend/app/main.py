from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.chat import router as chat_router
from app.api.routes.conversations import router as conversations_router
from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.transactions import router as transactions_router
from app.api.routes.data import router as data_router
from app.core.config import settings


app = FastAPI(
    title=settings.APP_NAME,
    description="Multi-Language AI Assistant Chatbot API",
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------
# Allows the Next.js frontend to communicate with FastAPI.
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# API Routes
# ---------------------------------------------------------

app.include_router(
    health_router,
    prefix="/api",
    tags=["Health"],
)

app.include_router(
    chat_router,
    prefix="/api",
    tags=["Chat"],
)

app.include_router(
    conversations_router,
    prefix="/api",
    tags=["Conversations"],
)

app.include_router(auth_router, prefix="/api", tags=["Authentication"])
app.include_router(users_router, prefix="/api", tags=["Users"])
app.include_router(transactions_router, prefix="/api", tags=["Transactions"])
app.include_router(data_router, prefix="/api", tags=["AI Data Query"])


@app.get("/")
async def root():
    return {
        "message": "Multi-Language AI Assistant API is running.",
        "version": "1.0.0",
    }