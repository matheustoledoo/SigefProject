import os
from dotenv import load_dotenv

# força carregar o .env que está na pasta pai desse arquivo (../.env)
here = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(here, "..", ".env")
load_dotenv(env_path)

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL não encontrada. Verifique o .env e o caminho.")

engine = create_async_engine(DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_session():
    async with AsyncSessionLocal() as session:
        yield session
