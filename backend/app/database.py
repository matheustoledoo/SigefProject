# backend/app/database.py
import os
from dotenv import load_dotenv

# carrega .env localmente (no Railway ignora e usa env vars do serviço)
here = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(here, "..", ".env")
load_dotenv(env_path)

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL não encontrada. Verifique o .env/variáveis do Railway.")

# >>> CONVERSÃO PARA O DIALETO ASSÍNCRONO <<<
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    future=True,
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_session():
    async with AsyncSessionLocal() as session:
        yield session
