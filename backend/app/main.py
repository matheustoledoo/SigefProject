from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from pathlib import Path
from sqlalchemy import text

from . import routes
from .database import engine, Base

app = FastAPI()

# --- API (com prefixo /api) ---
app.include_router(routes.router, prefix="/api")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # em produção, troque pelo domínio do seu front
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- cria tabelas (dev; em produção use migrations) ---
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        await conn.execute(text("""
                    ALTER TABLE points
                    ADD COLUMN IF NOT EXISTS certificate_certification_id VARCHAR
                """))

        # índice (idempotente)
        await conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS ix_points_certificate_certification_id
                    ON points (certificate_certification_id)
                """))

        # backfill: copia certification_id para os points existentes
        await conn.execute(text("""
                    UPDATE points p
                    SET certificate_certification_id = c.certification_id
                    FROM certificates c
                    WHERE p.certificate_id = c.id
                      AND (p.certificate_certification_id IS NULL OR p.certificate_certification_id = '')
                """))

# --- Servir o build do React (se existir) ---
# No Dockerfile copiamos o build para backend/app/static
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

if STATIC_DIR.exists():
    # html=True faz fallback do SPA para index.html
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
