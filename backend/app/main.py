from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.api.routes.invoices import router as invoices_router
from app.api.routes.auth import router as auth_router
from app.api.routes.buyers import router as buyers_router
from app.api.routes.subscriptions import router as subscriptions_router

settings = get_settings()

app = FastAPI(
    title="Creative Invoice - GST Invoice Extractor",
    description="Extract structured data from Indian GST invoices using OCR + AI",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(invoices_router)
app.include_router(buyers_router)
app.include_router(subscriptions_router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "environment": settings.environment}
