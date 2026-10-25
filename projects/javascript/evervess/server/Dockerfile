# ── Stage: production ──────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Сначала только package.json — чтобы слои с зависимостями кешировались
COPY package*.json ./

RUN npm install --omit=dev

# Копируем остальные файлы сервера
COPY . .

# .env НЕ копируется — переменные пробрасываются через docker-compose
RUN rm -f .env

# Даём права на запуск entrypoint
RUN chmod +x entrypoint.sh

EXPOSE 5000

# Сначала fix-admin.js, потом index.js
CMD ["sh", "entrypoint.sh"]
