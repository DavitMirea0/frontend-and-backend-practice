CREATE TABLE orders (
    id              UUID PRIMARY KEY,
    customer_id     TEXT        NOT NULL,
    items           JSONB       NOT NULL,
    total_cents     BIGINT      NOT NULL,
    status          TEXT        NOT NULL DEFAULT 'NEW',
    idempotency_key TEXT        UNIQUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE outbox (
    id           UUID PRIMARY KEY,
    aggregate_id UUID        NOT NULL,
    event_type   TEXT        NOT NULL,
    payload      JSONB       NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ
);

CREATE INDEX outbox_unpublished_idx ON outbox (created_at) WHERE published_at IS NULL;
