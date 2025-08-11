# backend/app/main.py
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from .database import engine, Base
from . import routes

app = FastAPI()

# Prefixo da API (o Docker do frontend usa /api)
API_PREFIX = os.getenv("API_PREFIX", "/api")
app.include_router(routes.router, prefix=API_PREFIX)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # ajuste depois para seu domínio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cria tabelas (dev); em produção, prefira migrations
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Monta o React (apenas se existir)
STATIC_DIR = Path(__file__).parent / "static"  # <- sem "/static" extra
if STATIC_DIR.exists():
    # html=True = serve index.html para rotas desconhecidas (SPA)
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
