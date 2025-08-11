from fastapi import FastAPI
from . import routes
from .database import engine, Base
from fastapi.middleware.cors import CORSMiddleware  # <<< adicione

app = FastAPI()
app.include_router(routes.router)

# CORS (ajusta origin conforme deploy)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # em produção troque para o domínio do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# criar tabelas automaticamente (para dev; em produção use migrations)
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
