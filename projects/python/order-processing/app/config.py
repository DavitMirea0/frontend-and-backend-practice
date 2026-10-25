import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv("DATABASE_URL", "postgresql://orders:orders@localhost:5433/orders")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    rabbitmq_url: str = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
    max_attempts: int = int(os.getenv("MAX_ATTEMPTS", "5"))
    base_delay_ms: int = int(os.getenv("BASE_DELAY_MS", "1000"))
    max_delay_ms: int = int(os.getenv("MAX_DELAY_MS", "60000"))
    dedup_ttl_seconds: int = int(os.getenv("DEDUP_TTL_SECONDS", "86400"))
    relay_interval_seconds: float = float(os.getenv("RELAY_INTERVAL_SECONDS", "1.0"))


settings = Settings()
