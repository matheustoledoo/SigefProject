# ======= 1) Frontend (React) =======
FROM node:18-alpine AS frontend
WORKDIR /app/frontend

# 1. Instala dependências
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund

# 2. Copia o código
COPY frontend/ ./

# 3. (fix) normaliza finais de linha e garante permissão de execução
# 4. (fix) chama o build via 'node' no script JS do react-scripts
RUN find node_modules/react-scripts -type f -name "*.js" -print0 \
      | xargs -0 -r sed -i 's/\r$//' \
 && chmod -R u+x node_modules/.bin \
 && node node_modules/react-scripts/scripts/build.js


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

# subir uvicorn ouvindo em 0.0.0.0:$PORT (sem bash)
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT}"]
