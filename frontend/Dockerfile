# -------- build stage --------
FROM node:18-alpine AS build
WORKDIR /app

# deps
COPY package*.json ./
RUN npm ci

# fonte
COPY . .

# injeta a URL do backend no build (passada via variável no Railway)
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# build do CRA
RUN npm run build

# -------- runtime stage --------
FROM nginx:1.25-alpine

# copia template do nginx com porta vinda do $PORT
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# copia artefatos do build
COPY --from=build /app/build /usr/share/nginx/html

# por padrão a Railway fornece $PORT; se não houver, usa 8080
ENV PORT=8080

# gera o conf com envsubst e inicia nginx
CMD sh -c "envsubst '\$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"
