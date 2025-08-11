# -------- build stage --------
FROM node:20-bullseye AS build
WORKDIR /app

# Instala deps
COPY package*.json ./
RUN npm ci

# Copia o resto do código
COPY . .

# Injeta URL do backend no build
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# (1) normaliza line endings CRLF -> LF (se houver)
# (2) garante permissão de execução nos bins do npm
# (3) chama o react-scripts via node para não depender do .bin
RUN find node_modules/react-scripts -type f -name "*.js" -print0 | xargs -0 sed -i 's/\r$//' || true \
 && chmod +x node_modules/.bin/* || true \
 && node node_modules/react-scripts/bin/react-scripts.js build

# -------- runtime stage --------
FROM node:20-bullseye
WORKDIR /app

# servidor estático simples
RUN npm i -g serve
COPY --from=build /app/build /app/build

# Railway fornece $PORT; localmente usa 3000
EXPOSE 3000
CMD ["sh", "-c", "serve -s build -l ${PORT:-3000}"]
