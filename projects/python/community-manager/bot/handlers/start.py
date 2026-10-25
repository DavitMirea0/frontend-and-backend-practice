from aiogram import F, Router
from aiogram.filters import CommandStart
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from bot.keyboards.inline import main_menu_keyboard
from db.repository import get_or_create_user

router = Router()


@router.message(CommandStart())
async def cmd_start(message: Message, session: AsyncSession):
    user = await get_or_create_user(
        session,
        telegram_id=message.from_user.id,
        username=message.from_user.username,
        full_name=message.from_user.full_name,
    )
    await message.answer(
        f"Привет, {user.full_name}!\n\n"
        "Это бот управления сообществом. Здесь можно создавать сообщества, "
        "публиковать посты и организовывать события.",
        reply_markup=main_menu_keyboard(),
    )


@router.callback_query(F.data == "main_menu")
async def show_main_menu(callback: CallbackQuery):
    await callback.message.edit_text("Главное меню:", reply_markup=main_menu_keyboard())
    await callback.answer()
