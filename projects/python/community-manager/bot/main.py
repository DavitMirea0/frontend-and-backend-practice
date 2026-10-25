import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.redis import RedisStorage

from bot.handlers import community, event, publication, start
from bot.middlewares.db import DbSessionMiddleware
from db.config import settings

logging.basicConfig(level=logging.INFO)


async def main():
    storage = RedisStorage.from_url(f"redis://{settings.redis_host}:{settings.redis_port}/0")
    bot = Bot(token=settings.bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher(storage=storage)

    dp.update.middleware(DbSessionMiddleware())

    dp.include_router(start.router)
    dp.include_router(community.router)
    dp.include_router(publication.router)
    dp.include_router(event.router)

    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
