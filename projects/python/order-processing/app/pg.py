import json

import asyncpg

from app.domain import DuplicateOrderError, Order, OrderStatus, OutboxEvent


def _row_to_order(row) -> Order:
    items = row["items"]
    return Order(
        id=str(row["id"]),
        customer_id=row["customer_id"],
        items=json.loads(items) if isinstance(items, str) else items,
        total_cents=row["total_cents"],
        status=OrderStatus(row["status"]),
        idempotency_key=row["idempotency_key"],
    )


class PgRepository:
    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    async def create_with_outbox(self, order: Order, event: OutboxEvent) -> None:
        try:
            async with self.pool.acquire() as conn:
                async with conn.transaction():
                    await conn.execute(
                        """INSERT INTO orders (id, customer_id, items, total_cents, status, idempotency_key)
                           VALUES ($1::uuid, $2, $3::jsonb, $4, $5, $6)""",
                        order.id, order.customer_id, json.dumps(order.items),
                        order.total_cents, order.status.value, order.idempotency_key,
                    )
                    await conn.execute(
                        """INSERT INTO outbox (id, aggregate_id, event_type, payload)
                           VALUES ($1::uuid, $2::uuid, $3, $4::jsonb)""",
                        event.id, event.aggregate_id, event.event_type, json.dumps(event.payload),
                    )
        except asyncpg.UniqueViolationError as exc:
            raise DuplicateOrderError() from exc

    async def get_order(self, order_id: str) -> Order | None:
        row = await self.pool.fetchrow("SELECT * FROM orders WHERE id = $1::uuid", order_id)
        return _row_to_order(row) if row else None

    async def get_by_idempotency_key(self, key: str) -> Order | None:
        row = await self.pool.fetchrow("SELECT * FROM orders WHERE idempotency_key = $1", key)
        return _row_to_order(row) if row else None

    async def set_status(self, order_id: str, status: OrderStatus) -> None:
        await self.pool.execute(
            "UPDATE orders SET status = $2 WHERE id = $1::uuid", order_id, status.value
        )

    async def fetch_unpublished(self, limit: int) -> list[OutboxEvent]:
        rows = await self.pool.fetch(
            """SELECT id, aggregate_id, event_type, payload FROM outbox
               WHERE published_at IS NULL ORDER BY created_at LIMIT $1""",
            limit,
        )
        out = []
        for r in rows:
            payload = r["payload"]
            out.append(OutboxEvent(
                id=str(r["id"]),
                aggregate_id=str(r["aggregate_id"]),
                event_type=r["event_type"],
                payload=json.loads(payload) if isinstance(payload, str) else payload,
            ))
        return out

    async def mark_published(self, event_ids: list[str]) -> None:
        await self.pool.execute(
            "UPDATE outbox SET published_at = now() WHERE id = ANY($1::uuid[])", event_ids
        )
