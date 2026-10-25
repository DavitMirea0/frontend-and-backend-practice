import redis.asyncio as aioredis


class RedisKeyStore:
    def __init__(self, client: aioredis.Redis):
        self.client = client

    async def set_if_absent(self, key: str, ttl_seconds: int) -> bool:
        return bool(await self.client.set(key, "1", nx=True, ex=ttl_seconds))

    async def delete(self, key: str) -> None:
        await self.client.delete(key)
