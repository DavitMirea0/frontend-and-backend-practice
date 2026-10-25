import pytest
from pydantic import ValidationError

from app.schemas import CreateOrderRequest
from app.service import OrderService
from tests.fakes import FakeRepo


def make_req(**over):
    data = {
        "customer_id": "c1",
        "items": [{"sku": "A", "quantity": 2, "price_cents": 500},
                  {"sku": "B", "quantity": 1, "price_cents": 250}],
    }
    data.update(over)
    return CreateOrderRequest(**data)


async def test_create_order_writes_order_and_outbox_event():
    repo = FakeRepo()
    order, created = await OrderService(repo).create_order(make_req())
    assert created is True
    assert order.total_cents == 1250
    assert len(repo.events) == 1
    assert repo.events[0].aggregate_id == order.id
    assert repo.events[0].event_type == "order.created"


async def test_same_idempotency_key_returns_existing_order():
    repo = FakeRepo()
    svc = OrderService(repo)
    first, c1 = await svc.create_order(make_req(), "key-1")
    second, c2 = await svc.create_order(make_req(), "key-1")
    assert (c1, c2) == (True, False)
    assert first.id == second.id
    assert len(repo.orders) == 1 and len(repo.events) == 1


def test_invalid_quantity_is_rejected():
    with pytest.raises(ValidationError):
        make_req(items=[{"sku": "A", "quantity": 0, "price_cents": 100}])


async def test_concurrent_duplicate_key_falls_back_to_existing_order():
    """Both requests passed the first lookup; the unique index rejects the second insert."""
    repo = FakeRepo()
    svc = OrderService(repo)
    winner, _ = await svc.create_order(make_req(), "race-key")

    real_lookup = repo.get_by_idempotency_key
    calls = {"n": 0}

    async def stale_first_lookup(key):
        calls["n"] += 1
        return None if calls["n"] == 1 else await real_lookup(key)

    repo.get_by_idempotency_key = stale_first_lookup
    order, created = await svc.create_order(make_req(), "race-key")
    assert created is False
    assert order.id == winner.id
    assert len(repo.events) == 1
