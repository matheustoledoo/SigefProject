# -------- build stage --------
FROM node:20-alpine AS build
WORKDIR /app

# instala deps
COPY package*.json ./
RUN npm ci

# copia o restante e builda
COPY . .
# pega a URL do backend no build (Railway passa como build-arg se houver var com o mesmo nome)
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
RUN npm run build

# -------- runtime stage --------
FROM node:20-alpine
WORKDIR /app

# servidor estático
RUN npm i -g serve
COPY --from=build /app/build /app/build

# Railway expõe $PORT; usamos 3000 local como fallback
EXPOSE 3000
CMD ["sh", "-c", "serve -s build -l ${PORT:-3000}"]
