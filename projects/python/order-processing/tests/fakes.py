from app.domain import DuplicateOrderError, Message, Order, OrderStatus, OutboxEvent


class FakeRepo:
    def __init__(self):
        self.orders: dict[str, Order] = {}
        self.events: list[OutboxEvent] = []
        self.published: set[str] = set()

    async def create_with_outbox(self, order, event):
        if order.idempotency_key and any(
            o.idempotency_key == order.idempotency_key for o in self.orders.values()
        ):
            raise DuplicateOrderError()
        self.orders[order.id] = order
        self.events.append(event)

    async def get_order(self, order_id):
        return self.orders.get(order_id)

    async def get_by_idempotency_key(self, key):
        return next((o for o in self.orders.values() if o.idempotency_key == key), None)

    async def set_status(self, order_id, status: OrderStatus):
        self.orders[order_id].status = status

    async def fetch_unpublished(self, limit):
        return [e for e in self.events if e.id not in self.published][:limit]

    async def mark_published(self, event_ids):
        self.published.update(event_ids)


class FakeKeyStore:
    def __init__(self):
        self.keys: set[str] = set()

    async def set_if_absent(self, key, ttl_seconds):
        if key in self.keys:
            return False
        self.keys.add(key)
        return True

    async def delete(self, key):
        self.keys.discard(key)


class FakeBus:
    def __init__(self):
        self.retries: list[tuple[Message, int]] = []
        self.dlq: list[tuple[Message, str]] = []

    async def send_retry(self, msg, delay_ms):
        self.retries.append((msg, delay_ms))

    async def send_dlq(self, msg, reason):
        self.dlq.append((msg, reason))


class FakePublisher:
    def __init__(self, fail_on: int | None = None):
        self.sent: list[OutboxEvent] = []
        self.fail_on = fail_on  # index of the event that fails

    async def publish(self, event):
        if self.fail_on is not None and len(self.sent) == self.fail_on:
            raise ConnectionError("broker down")
        self.sent.append(event)
