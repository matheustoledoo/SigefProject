from fastapi import FastAPI
from . import routes
from .database import engine, Base
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI()

# API sob /api
app.include_router(routes.router, prefix="/api")

# CORS (ajuste depois o domínio do frontend, se quiser)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static SPA (build do React)
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
# arquivos gerados pelo CRA ficam em static/{css,js,media} + index.html na raiz
app.mount("/static", StaticFiles(directory=os.path.join(STATIC_DIR, "static")), name="static")

@app.get("/")
@app.get("/{full_path:path}")
async def spa(full_path: str = ""):
    # fallback do SPA
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
