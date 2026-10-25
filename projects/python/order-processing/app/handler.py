import logging
from typing import Awaitable, Callable

from app.domain import Message, PermanentError, TransientError
from app.ports import KeyStore, RetryBus
from app.retry import RetryPolicy

log = logging.getLogger("handler")

Processor = Callable[[dict], Awaitable[None]]


class MessageHandler:
    def __init__(
        self,
        keystore: KeyStore,
        bus: RetryBus,
        policy: RetryPolicy,
        processor: Processor,
        dedup_ttl_seconds: int = 86400,
    ):
        self.keystore = keystore
        self.bus = bus
        self.policy = policy
        self.processor = processor
        self.dedup_ttl = dedup_ttl_seconds

    async def handle(self, msg: Message) -> str:
        key = f"msg:{msg.id}"
        # Idempotency guard: the first consumer to claim the id processes it.
        if not await self.keystore.set_if_absent(key, self.dedup_ttl):
            return "duplicate"
        try:
            await self.processor(msg.body)
            return "processed"
        except PermanentError as exc:
            await self.keystore.delete(key)
            await self.bus.send_dlq(msg, f"permanent: {exc}")
            return "dlq"
        except TransientError as exc:
            # Release the claim so the retried copy can be processed.
            await self.keystore.delete(key)
            failures = msg.attempt + 1
            decision = self.policy.decide(failures)
            if decision.retry:
                await self.bus.send_retry(
                    Message(id=msg.id, body=msg.body, attempt=failures), decision.delay_ms
                )
                return "retry"
            await self.bus.send_dlq(msg, f"retries exhausted: {exc}")
            return "dlq"
