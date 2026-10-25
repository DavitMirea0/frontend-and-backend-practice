# ── Stage 1: Build React ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# ARG пробрасывается из docker-compose build args
ARG REACT_APP_API_URL=http://localhost:5000
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# ── Stage 2: Serve via nginx ───────────────────────────────────────────────────
FROM nginx:1.25-alpine

# Кастомный nginx конфиг — поддержка React Router (SPA fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранные файлы React
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
