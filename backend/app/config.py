"""
Central configuration for SkillGap-AI backend.
All secrets are read from environment variables (.env file locally,
real environment variables in production). Never hardcode keys.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- App ---
    APP_NAME: str = "SkillGap-AI"
    ENVIRONMENT: str = "development"  # development | production
    SECRET_KEY: str = "change-this-to-a-long-random-string-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # --- Database ---
    # Default: local SQLite file. For production, set e.g.
    # postgresql+asyncpg://user:pass@host:5432/skillgap
    DATABASE_URL: str = "sqlite+aiosqlite:///./skillgap.db"

    # --- Gemini API ---
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash"

    # --- GitHub API ---
    # Optional but strongly recommended: a personal access token raises
    # the GitHub API rate limit from 60/hr to 5000/hr per token.
    GITHUB_TOKEN: str = ""

    # --- CORS ---
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
