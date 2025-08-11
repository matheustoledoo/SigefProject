import os
from dotenv import load_dotenv

# carrega .env quando rodando localmente
here = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(here, "..", ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

raw_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or os.getenv("POSTGRESQL_URL")
if not raw_url:
    raise RuntimeError("DATABASE_URL não encontrada. Configure no Railway ou no .env.")

# Railway geralmente fornece "postgres://..." ou "postgresql://..."
# Para async precisamos "postgresql+asyncpg://..."
def to_asyncpg(url: str) -> str:
    if "+asyncpg" in url:
        return url
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url  # já está ok

DATABASE_URL = to_asyncpg(raw_url)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_session():
    async with AsyncSessionLocal() as session:
        yield session
