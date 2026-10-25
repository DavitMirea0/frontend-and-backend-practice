import uuid

from app.domain import DuplicateOrderError, Order, OutboxEvent
from app.ports import Repository
from app.schemas import CreateOrderRequest


class OrderService:
    def __init__(self, repo: Repository):
        self.repo = repo

    async def create_order(
        self, req: CreateOrderRequest, idempotency_key: str | None = None
    ) -> tuple[Order, bool]:
        """Returns (order, created). created=False means an existing order was returned."""
        if idempotency_key:
            existing = await self.repo.get_by_idempotency_key(idempotency_key)
            if existing:
                return existing, False

        order = Order(
            id=str(uuid.uuid4()),
            customer_id=req.customer_id,
            items=[i.model_dump() for i in req.items],
            total_cents=sum(i.price_cents * i.quantity for i in req.items),
            idempotency_key=idempotency_key,
        )
        event = OutboxEvent(
            id=str(uuid.uuid4()),
            aggregate_id=order.id,
            event_type="order.created",
            payload={"order_id": order.id, "total_cents": order.total_cents},
        )
        try:
            # Order row and outbox row are written in ONE transaction.
            await self.repo.create_with_outbox(order, event)
        except DuplicateOrderError:
            # Two concurrent requests with the same key: the unique index decided.
            existing = await self.repo.get_by_idempotency_key(idempotency_key)
            return existing, False
        return order, True
