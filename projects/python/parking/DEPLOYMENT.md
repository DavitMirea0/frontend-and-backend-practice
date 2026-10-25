# Развёртывание системы парковки

Учебный стенд: Linux VM, Docker Compose, один контейнер FastAPI, SQLite в томе
`parking_data`. Приложение доступно на loopback сервера. Для внешнего доступа
используется Caddy на хосте с HTTPS. Необходимы доступ по SSH, домен и DNS.

## Подготовка сервера

1. Установить поддерживаемый Linux, обновления безопасности, Docker Engine
   и Compose по инструкции производителя. Создать отдельного пользователя deploy
   с SSH-ключом. Членство в группе docker даёт права, эквивалентные root;
   доступ к Docker предоставляется только администратору.
2. До включения брандмауэра разрешить действующий SSH-порт. Разрешить TCP 80/443,
   закрыть внешний доступ к 8000. Проверить второй SSH-сеанс и лишь затем
   отключить вход root и пароли SSH.
3. Скопировать проект в `/opt/parking`, ограничить права каталога и резервных копий.
4. Выполнить из каталога проекта:

```sh
docker compose config --quiet
docker compose up --build -d
docker compose exec parking python manage.py account admin@example.org --role admin
docker compose exec parking python manage.py account guard@example.org --role operator
curl --fail http://127.0.0.1:8000/health/ready
```

Пароли вводятся интерактивно. Общего пароля по умолчанию нет. Команда account
также позволяет назначить доступ существующему пользователю из seed и отозвать
старые сессии при смене пароля. Поле users.role описывает категорию посетителя;
права определяются только accounts.access_role.

## HTTPS

Установить Caddy как системную службу на хосте. В `deploy/Caddyfile` заменить
домен на свой, проверить DNS и доступность портов 80/443 для получения сертификата.
Проверить конфигурацию `caddy validate --config deploy/Caddyfile`, установить её
в конфигурацию службы и перезагрузить Caddy. Проверить HTTPS, сертификат и
недоступность порта 8000 извне. До настройки HTTPS использовать только localhost
или SSH-туннель: Bearer-токен передаётся с каждым защищённым запросом.

## Мониторинг и управление

```sh
docker compose ps
docker compose logs --tail=100 parking
docker stats --no-stream
curl --fail http://127.0.0.1:8000/health/live
curl --fail http://127.0.0.1:8000/health/ready
```

Liveness проверяет процесс, readiness выполняет SELECT 1 и при ошибке БД
возвращает 503 без подробностей. Docker проверяет readiness каждые 30 секунд;
после трёх ошибок контейнер помечается unhealthy. Политика unless-stopped
перезапускает завершившийся процесс; статус unhealthy сам по себе перезапуск
не вызывает. Для уведомлений подключить внешнюю HTTP-проверку readiness и
контроль диска/памяти. При 503 проверить свободное место, права тома и журнал,
после устранения причины выполнить `docker compose restart parking`.

Приложение работает под appuser без дополнительных capabilities, с read-only
корнем и временным /tmp. Запись разрешена в том данных. Логи ротируются
(3 файла по 10 МБ), не содержат тел запросов или токенов. Один процесс Uvicorn
соответствует SQLite и локальному кэшу прогноза (TTL 30 секунд, максимум 128 ключей).
Кэш может показывать историю с задержкой до 30 секунд.

## Копирование и восстановление

```sh
docker compose exec parking python manage.py backup /data/backup-2026-10-21.db
docker compose cp parking:/data/backup-2026-10-21.db ./backups/backup-2026-10-21.db
```

Команда использует SQLite Backup API, поэтому согласованно копирует работающую
БД. Хранить копии вне сервера в защищённом каталоге. Регулярно проверять восстановление.
Для восстановления остановить приложение, сохранить текущую БД отдельной копией,
затем выполнить:

```sh
docker compose stop parking
docker compose run --rm --no-deps -v "$PWD/backups:/backups:ro" parking python -c "import sqlite3; s=sqlite3.connect('file:/backups/backup-2026-10-21.db?mode=ro', uri=True); d=sqlite3.connect('/data/parking.db'); s.backup(d); d.close(); s.close()"
docker compose up -d
curl --fail http://127.0.0.1:8000/health/ready
```

Проверить пользователей, машины и брони. Перед обновлением делать копию БД,
сохранять предыдущий образ. Обновление: `docker compose up --build -d`, затем
readiness и основные сценарии. Для отката вернуть прежний код/образ; при
несовместимой схеме восстановить соответствующую копию БД. create_all добавляет
новые таблицы accounts/login_sessions к старой базе; изменение существующих
столбцов требует отдельной миграции.

## Проверки и ограничения

```sh
python -m pytest -v
python tools/load_test.py --requests 200 --workers 10
```

Нагрузочный скрипт проверяет HTTP-чтение четырёх маршрутов и сохраняет число
ошибок, RPS, p50 и p95. Это учебный тест одного стенда, а не оценка максимальной
производительности. Для высокой доступности нужны PostgreSQL, несколько узлов,
общий кэш, балансировщик и проверенный план аварийного восстановления.
Один контейнер и резервные копии не обеспечивают отказоустойчивость между узлами.

Документация: https://docs.docker.com/reference/compose-file/services/
и https://fastapi.tiangolo.com/tutorial/security/ .
