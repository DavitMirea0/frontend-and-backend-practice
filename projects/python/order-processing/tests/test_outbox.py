from app.domain import OutboxEvent
from app.outbox import OutboxRelay
from tests.fakes import FakePublisher, FakeRepo


def seed(repo, n):
    for i in range(n):
        repo.events.append(OutboxEvent(id=f"e{i}", aggregate_id=f"o{i}", event_type="order.created"))


async def test_relay_publishes_pending_events_and_marks_them():
    repo, pub = FakeRepo(), FakePublisher()
    seed(repo, 3)
    assert await OutboxRelay(repo, pub).run_once() == 3
    assert [e.id for e in pub.sent] == ["e0", "e1", "e2"]
    assert await repo.fetch_unpublished(10) == []


async def test_failed_publish_leaves_event_unpublished_for_next_tick():
    repo, pub = FakeRepo(), FakePublisher(fail_on=1)
    seed(repo, 3)
    relay = OutboxRelay(repo, pub)
    assert await relay.run_once() == 1
    assert [e.id for e in await repo.fetch_unpublished(10)] == ["e1", "e2"]
    pub.fail_on = None
    assert await relay.run_once() == 2


async def test_relay_respects_batch_limit():
    repo, pub = FakeRepo(), FakePublisher()
    seed(repo, 5)
    relay = OutboxRelay(repo, pub)
    assert await relay.run_once(limit=2) == 2
    assert len(await repo.fetch_unpublished(10)) == 3
