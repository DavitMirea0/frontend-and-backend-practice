# --- frontend: build stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Сначала только зависимости (кэш слоёв)
COPY package.json package-lock.json ./
RUN npm config set registry https://registry.npmmirror.com && \
    npm ci

# Затем исходный код
COPY index.html vite.config.js ./
COPY src ./src

# Сборка production-бандла
RUN npm run build

# --- frontend: serve stage ---
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
