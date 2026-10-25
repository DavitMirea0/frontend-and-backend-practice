import json

import aio_pika

from app.domain import Message, OutboxEvent

EXCHANGE = "orders"
MAIN_QUEUE = "orders.created"
ROUTING_KEY = "order.created"
DLQ = "orders.dlq"


class RabbitBus:
    def __init__(self, url: str):
        self.url = url
        self.connection = None
        self.channel = None
        self.exchange = None
        self.main_queue = None
        self._retry_queues: set[int] = set()

    async def connect(self) -> None:
        self.connection = await aio_pika.connect_robust(self.url)
        self.channel = await self.connection.channel()
        await self.channel.set_qos(prefetch_count=10)
        self.exchange = await self.channel.declare_exchange(
            EXCHANGE, aio_pika.ExchangeType.DIRECT, durable=True
        )
        self.main_queue = await self.channel.declare_queue(MAIN_QUEUE, durable=True)
        await self.main_queue.bind(self.exchange, ROUTING_KEY)
        await self.channel.declare_queue(DLQ, durable=True)

    async def close(self) -> None:
        if self.connection:
            await self.connection.close()

    # --- producer side (outbox relay) ---
    async def publish(self, event: OutboxEvent) -> None:
        await self.exchange.publish(
            aio_pika.Message(
                body=json.dumps(event.payload).encode(),
                message_id=event.id,
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                content_type="application/json",
                headers={"x-attempt": 0},
            ),
            routing_key=ROUTING_KEY,
        )

    # --- retry / DLQ ---
    async def _retry_queue_name(self, delay_ms: int) -> str:
        """One queue per delay tier. A per-message TTL on a shared queue would let a
        long delay block shorter ones behind it, so each tier gets its own x-message-ttl."""
        name = f"orders.retry.{delay_ms}"
        if delay_ms not in self._retry_queues:
            await self.channel.declare_queue(
                name,
                durable=True,
                arguments={
                    "x-message-ttl": delay_ms,
                    "x-dead-letter-exchange": EXCHANGE,
                    "x-dead-letter-routing-key": ROUTING_KEY,
                },
            )
            self._retry_queues.add(delay_ms)
        return name

    async def send_retry(self, msg: Message, delay_ms: int) -> None:
        queue_name = await self._retry_queue_name(delay_ms)
        await self.channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps(msg.body).encode(),
                message_id=msg.id,
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                content_type="application/json",
                headers={"x-attempt": msg.attempt},
            ),
            routing_key=queue_name,
        )

    async def send_dlq(self, msg: Message, reason: str) -> None:
        await self.channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps(msg.body).encode(),
                message_id=msg.id,
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                content_type="application/json",
                headers={"x-attempt": msg.attempt, "x-dlq-reason": reason},
            ),
            routing_key=DLQ,
        )
