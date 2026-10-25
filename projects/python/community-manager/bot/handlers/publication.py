from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from bot.keyboards.inline import back_keyboard
from bot.states.forms import CreatePublication
from db.repository import create_publication, get_or_create_user, is_member, list_publications

router = Router()


@router.callback_query(F.data.startswith("publications:"))
async def show_publications(callback: CallbackQuery, session: AsyncSession):
    community_id = int(callback.data.split(":")[1])
    publications = await list_publications(session, community_id)
    if not publications:
        text = "В этом сообществе пока нет публикаций."
    else:
        lines = []
        for pub in publications:
            date_str = pub.created_at.strftime("%d.%m.%Y %H:%M")
            lines.append(f"<b>{date_str}</b>\n{pub.text}")
        text = "\n\n---\n\n".join(lines)
    await callback.message.edit_text(
        text, reply_markup=back_keyboard(f"view_community:{community_id}"), parse_mode="HTML"
    )
    await callback.answer()


@router.callback_query(F.data.startswith("new_publication:"))
async def start_new_publication(callback: CallbackQuery, state: FSMContext, session: AsyncSession):
    community_id = int(callback.data.split(":")[1])
    user = await get_or_create_user(
        session,
        telegram_id=callback.from_user.id,
        username=callback.from_user.username,
        full_name=callback.from_user.full_name,
    )
    if not await is_member(session, community_id, user.id):
        await callback.answer("Нужно вступить в сообщество, чтобы публиковать посты", show_alert=True)
        return
    await state.update_data(community_id=community_id)
    await state.set_state(CreatePublication.text)
    await callback.message.edit_text("Отправь текст публикации:")
    await callback.answer()


@router.message(CreatePublication.text)
async def save_publication(message: Message, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    user = await get_or_create_user(
        session,
        telegram_id=message.from_user.id,
        username=message.from_user.username,
        full_name=message.from_user.full_name,
    )
    photo_file_id = message.photo[-1].file_id if message.photo else None
    text = message.caption if message.photo else message.text
    await create_publication(
        session, community_id=data["community_id"], author_id=user.id, text=text or "", photo_file_id=photo_file_id
    )
    await state.clear()
    await message.answer("Публикация добавлена!")
