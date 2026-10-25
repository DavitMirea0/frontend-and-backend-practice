# Order Processing Service

Event-driven order processing: FastAPI, PostgreSQL, RabbitMQ, Redis.

## Architecture

    client -> API -> Postgres (orders + outbox, one transaction)
                          |
                    outbox relay -> RabbitMQ -> worker -> Postgres (status)
                                       |  ^
                         retry queues -+  | (TTL expires, dead-letters back)
                                       v
                                      DLQ

- **Transactional outbox**: the order and its event are written in one DB transaction,
  so an order is never saved without its event (and vice versa). A separate relay
  publishes pending events: at-least-once delivery.
- **Idempotency (API)**: `Idempotency-Key` header + unique index. Repeating a request
  returns the same order (200 instead of 201).
- **Idempotency (consumer)**: Redis `SET NX` on the message id, because the broker
  can deliver a message more than once.
- **Retry with exponential backoff**: 1s, 2s, 4s... capped. One RabbitMQ queue per delay
  tier (`x-message-ttl` + dead-letter back to the main queue).
- **DLQ**: after `MAX_ATTEMPTS` transient failures, or immediately on a permanent error.

## Run

    docker compose up --build
    curl -X POST localhost:8000/orders \
      -H "Content-Type: application/json" -H "Idempotency-Key: demo-1" \
      -d '{"customer_id":"c1","items":[{"sku":"A","quantity":2,"price_cents":500}]}'

RabbitMQ UI: http://localhost:15672 (guest / guest).
If the schema looks wrong after changing `db/init`: `docker compose down -v`.

## Tests

    pip install -r requirements-dev.txt
    pytest

Unit tests use in-memory fakes behind the ports in `app/ports.py`.

## Known limits

- One relay instance. For several, select with `FOR UPDATE SKIP LOCKED`.
- If a worker crashes mid-processing, the Redis claim stays until its TTL expires.
