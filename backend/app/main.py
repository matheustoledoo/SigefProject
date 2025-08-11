from fastapi import FastAPI
from . import routes
from .database import engine, Base
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.include_router(routes.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # em produção prefira o domínio do seu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"ok": True}

@app.get("/healthz")
async def health():
    return {"status": "healthy"}

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
