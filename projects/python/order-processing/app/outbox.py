import asyncio
import logging

from app.ports import EventPublisher, Repository

log = logging.getLogger("outbox")


class OutboxRelay:
    """Moves events from the outbox table to the broker. At-least-once delivery."""

    def __init__(self, repo: Repository, publisher: EventPublisher):
        self.repo = repo
        self.publisher = publisher

    async def run_once(self, limit: int = 100) -> int:
        events = await self.repo.fetch_unpublished(limit)
        published: list[str] = []
        for event in events:
            try:
                await self.publisher.publish(event)
            except Exception:
                log.exception("publish failed for %s, will retry next tick", event.id)
                break  # keep ordering: stop at first failure
            published.append(event.id)
        if published:
            await self.repo.mark_published(published)
        return len(published)

    async def run_forever(self, interval_seconds: float) -> None:
        while True:
            try:
                await self.run_once()
            except Exception:
                log.exception("relay tick failed")
            await asyncio.sleep(interval_seconds)
