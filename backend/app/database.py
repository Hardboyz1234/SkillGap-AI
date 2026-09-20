from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)

AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()


async def get_db():
    """FastAPI dependency that yields a DB session per-request."""
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """Create all tables. Call once on startup (dev only — use Alembic
    migrations for production schema changes)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
