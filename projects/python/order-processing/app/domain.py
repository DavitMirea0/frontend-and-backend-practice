from dataclasses import dataclass, field
from enum import Enum


class OrderStatus(str, Enum):
    NEW = "NEW"
    PROCESSED = "PROCESSED"
    FAILED = "FAILED"


@dataclass
class Order:
    id: str
    customer_id: str
    items: list[dict]
    total_cents: int
    status: OrderStatus = OrderStatus.NEW
    idempotency_key: str | None = None


@dataclass
class OutboxEvent:
    id: str
    aggregate_id: str
    event_type: str
    payload: dict = field(default_factory=dict)


@dataclass
class Message:
    """A message as the consumer sees it. attempt = failures so far."""
    id: str
    body: dict
    attempt: int = 0


class DuplicateOrderError(Exception):
    pass


class TransientError(Exception):
    """Temporary failure: worth retrying."""


class PermanentError(Exception):
    """Will never succeed: go straight to the DLQ."""
