FROM node:18-alpine

WORKDIR /app

# Сначала копируем только манифест зависимостей —
# Docker закэширует слой npm install и не будет
# переустанавливать пакеты при изменении только кода
COPY package*.json ./
RUN npm install

# Копируем остальной код
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
