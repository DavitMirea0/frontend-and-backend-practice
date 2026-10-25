import asyncio
import logging

import asyncpg

from app.config import settings
from app.messaging import RabbitBus
from app.outbox import OutboxRelay
from app.pg import PgRepository


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    pool = await asyncpg.create_pool(settings.database_url)
    bus = RabbitBus(settings.rabbitmq_url)
    await bus.connect()
    relay = OutboxRelay(PgRepository(pool), bus)
    await relay.run_forever(settings.relay_interval_seconds)


if __name__ == "__main__":
    asyncio.run(main())
