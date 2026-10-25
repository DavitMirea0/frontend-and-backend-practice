import asyncio
import json
import logging

import asyncpg
import redis.asyncio as aioredis

from app.config import settings
from app.domain import Message, OrderStatus
from app.handler import MessageHandler
from app.messaging import RabbitBus
from app.pg import PgRepository
from app.redis_store import RedisKeyStore
from app.retry import RetryPolicy

log = logging.getLogger("worker")


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    pool = await asyncpg.create_pool(settings.database_url)
    repo = PgRepository(pool)
    keystore = RedisKeyStore(aioredis.from_url(settings.redis_url))
    bus = RabbitBus(settings.rabbitmq_url)
    await bus.connect()

    async def process_order(body: dict) -> None:
        # Real business logic (payment, stock reservation...) goes here.
        await repo.set_status(body["order_id"], OrderStatus.PROCESSED)

    handler = MessageHandler(
        keystore=keystore,
        bus=bus,
        policy=RetryPolicy(settings.max_attempts, settings.base_delay_ms, 2, settings.max_delay_ms),
        processor=process_order,
        dedup_ttl_seconds=settings.dedup_ttl_seconds,
    )

    async with bus.main_queue.iterator() as it:
        async for raw in it:
            msg = Message(
                id=raw.message_id,
                body=json.loads(raw.body),
                attempt=int((raw.headers or {}).get("x-attempt", 0)),
            )
            result = await handler.handle(msg)
            log.info("message %s -> %s", msg.id, result)
            # The handler already re-published on retry/DLQ, so the original is always acked.
            await raw.ack()


if __name__ == "__main__":
    asyncio.run(main())
