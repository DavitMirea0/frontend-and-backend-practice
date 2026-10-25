#!/bin/sh
set -e

echo ">>> Запуск fix-admin.js..."
node fix-admin.js && echo ">>> Админ создан/обновлён успешно" \
                  || echo ">>> fix-admin.js завершился с ошибкой (возможно, админ уже существует — продолжаем)"

echo ">>> Запуск сервера..."
exec node index.js
