# ======= 1) Build do frontend =======
FROM node:18-alpine AS frontend
WORKDIR /app/frontend

# cache mais eficiente
COPY frontend/package*.json ./
RUN npm ci

# copie o resto e build
COPY frontend/ ./
# usamos API relativa (/api) — não precisa setar REACT_APP_API_URL
ENV REACT_APP_API_URL=/api
RUN npm run build

# ======= 2) Backend (FastAPI) =======
FROM python:3.12-slim AS backend
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# dependências do sistema (se algo do pdf/asyncpg precisar)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# requirements
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install -r /app/backend/requirements.txt

# código do backend
COPY backend/ /app/backend/

# copia o build do React para uma pasta estática do backend
COPY --from=frontend /app/frontend/build /app/backend/app/static

# porta do Railway
ENV PORT=8080
EXPOSE 8080

# subir uvicorn ouvindo em 0.0.0.0:$PORT
CMD ["bash", "-lc", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT}"]
