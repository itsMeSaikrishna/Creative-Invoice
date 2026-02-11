import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Google Document AI
    google_project_id: str = ""
    google_location: str = "us"
    google_processor_id: str = ""
    google_application_credentials: str = ""  # file path (local dev)
    google_credentials_json: str = ""  # JSON string (cloud deployment)

    # Groq LLM
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_temperature: float = 0.1
    groq_max_tokens: int = 2000

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_service_key: str = ""

    # Application
    secret_key: str = "dev-secret-key"
    environment: str = "development"
    allowed_origins: str = "http://localhost:3000"
    max_file_size_mb: int = 10
    cache_ttl_seconds: int = 3600

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if settings.google_credentials_json:
        # Cloud deployment: write JSON string to a temp file
        import tempfile
        credentials_path = os.path.join(tempfile.gettempdir(), "gcp-credentials.json")
        with open(credentials_path, "w") as f:
            f.write(settings.google_credentials_json)
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path
    elif settings.google_application_credentials:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.google_application_credentials
    return settings
