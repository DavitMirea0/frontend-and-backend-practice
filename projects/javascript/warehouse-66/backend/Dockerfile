FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Зеркало npm на случай проблем с реестром
RUN npm config set registry https://registry.npmmirror.com && \
    npm install --omit=dev

COPY src ./src

EXPOSE 4000

CMD ["node", "src/server.js"]
