from app.domain import Message, PermanentError, TransientError
from app.handler import MessageHandler
from app.retry import RetryPolicy
from tests.fakes import FakeBus, FakeKeyStore

POLICY = RetryPolicy(max_attempts=3, base_delay_ms=1000, factor=2, max_delay_ms=60000)


def make_handler(processor):
    bus, keys = FakeBus(), FakeKeyStore()
    return MessageHandler(keys, bus, POLICY, processor), bus, keys


async def test_successful_message_is_processed():
    seen = []

    async def ok(body):
        seen.append(body)

    h, bus, _ = make_handler(ok)
    assert await h.handle(Message("m1", {"order_id": "o1"})) == "processed"
    assert seen == [{"order_id": "o1"}]
    assert not bus.retries and not bus.dlq


async def test_duplicate_message_is_skipped():
    calls = []

    async def ok(body):
        calls.append(1)

    h, _, _ = make_handler(ok)
    await h.handle(Message("m1", {}))
    assert await h.handle(Message("m1", {})) == "duplicate"
    assert len(calls) == 1


async def test_transient_failure_schedules_retry_with_backoff():
    async def boom(body):
        raise TransientError("db timeout")

    h, bus, keys = make_handler(boom)
    assert await h.handle(Message("m1", {}, attempt=0)) == "retry"
    msg, delay = bus.retries[0]
    assert (msg.attempt, delay) == (1, 1000)
    assert "msg:m1" not in keys.keys  # claim released so the retry can run


async def test_exhausted_retries_go_to_dlq():
    async def boom(body):
        raise TransientError("still down")

    h, bus, _ = make_handler(boom)
    assert await h.handle(Message("m1", {}, attempt=2)) == "dlq"
    assert not bus.retries
    assert "retries exhausted" in bus.dlq[0][1]


async def test_permanent_error_goes_straight_to_dlq():
    async def bad(body):
        raise PermanentError("unknown sku")

    h, bus, _ = make_handler(bad)
    assert await h.handle(Message("m1", {}, attempt=0)) == "dlq"
    assert not bus.retries
