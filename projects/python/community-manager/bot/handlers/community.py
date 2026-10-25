from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from bot.keyboards.inline import communities_list_keyboard, community_menu_keyboard, main_menu_keyboard
from bot.states.forms import CreateCommunity
from db.repository import (
    create_community,
    get_community,
    get_or_create_user,
    is_member,
    join_community,
    list_communities,
    list_user_communities,
)

router = Router()


@router.callback_query(F.data == "all_communities")
async def show_all_communities(callback: CallbackQuery, session: AsyncSession):
    communities = await list_communities(session)
    if not communities:
        await callback.message.edit_text("Пока нет ни одного сообщества.", reply_markup=main_menu_keyboard())
        await callback.answer()
        return
    await callback.message.edit_text(
        "Все сообщества:", reply_markup=communities_list_keyboard(communities, action="view_community")
    )
    await callback.answer()


@router.callback_query(F.data == "my_communities")
async def show_my_communities(callback: CallbackQuery, session: AsyncSession):
    user = await get_or_create_user(
        session,
        telegram_id=callback.from_user.id,
        username=callback.from_user.username,
        full_name=callback.from_user.full_name,
    )
    communities = await list_user_communities(session, user.id)
    if not communities:
        await callback.message.edit_text(
            "Ты пока не состоишь ни в одном сообществе.", reply_markup=main_menu_keyboard()
        )
        await callback.answer()
        return
    await callback.message.edit_text(
        "Мои сообщества:", reply_markup=communities_list_keyboard(communities, action="view_community")
    )
    await callback.answer()


@router.callback_query(F.data.startswith("view_community:"))
async def view_community(callback: CallbackQuery, session: AsyncSession):
    community_id = int(callback.data.split(":")[1])
    community = await get_community(session, community_id)
    if not community:
        await callback.answer("Сообщество не найдено", show_alert=True)
        return
    user = await get_or_create_user(
        session,
        telegram_id=callback.from_user.id,
        username=callback.from_user.username,
        full_name=callback.from_user.full_name,
    )
    member = await is_member(session, community_id, user.id)
    text = f"<b>{community.name}</b>\n\n{community.description or 'Без описания'}\n\nУчастников: {len(community.members)}"
    await callback.message.edit_text(
        text, reply_markup=community_menu_keyboard(community_id, member), parse_mode="HTML"
    )
    await callback.answer()


@router.callback_query(F.data.startswith("join:"))
async def join_community_handler(callback: CallbackQuery, session: AsyncSession):
    community_id = int(callback.data.split(":")[1])
    user = await get_or_create_user(
        session,
        telegram_id=callback.from_user.id,
        username=callback.from_user.username,
        full_name=callback.from_user.full_name,
    )
    result = await join_community(session, community_id, user.id)
    if result is None:
        await callback.answer("Ты уже состоишь в этом сообществе", show_alert=True)
        return
    await callback.answer("Ты вступил в сообщество!")
    community = await get_community(session, community_id)
    text = f"<b>{community.name}</b>\n\n{community.description or 'Без описания'}\n\nУчастников: {len(community.members)}"
    await callback.message.edit_text(text, reply_markup=community_menu_keyboard(community_id, True), parse_mode="HTML")


@router.callback_query(F.data == "create_community")
async def start_create_community(callback: CallbackQuery, state: FSMContext):
    await state.set_state(CreateCommunity.name)
    await callback.message.edit_text("Введи название нового сообщества:")
    await callback.answer()


@router.message(CreateCommunity.name)
async def create_community_name(message: Message, state: FSMContext):
    await state.update_data(name=message.text)
    await state.set_state(CreateCommunity.description)
    await message.answer("Теперь введи описание (или отправь «-», чтобы пропустить):")


@router.message(CreateCommunity.description)
async def create_community_description(message: Message, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    description = None if message.text.strip() == "-" else message.text
    user = await get_or_create_user(
        session,
        telegram_id=message.from_user.id,
        username=message.from_user.username,
        full_name=message.from_user.full_name,
    )
    community = await create_community(session, name=data["name"], description=description, owner=user)
    await state.clear()
    await message.answer(f"Сообщество «{community.name}» создано! Ты — его владелец.", reply_markup=main_menu_keyboard())
