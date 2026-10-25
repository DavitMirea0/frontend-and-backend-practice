from datetime import datetime

from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from bot.keyboards.inline import back_keyboard, event_participation_keyboard
from bot.states.forms import CreateEvent
from db.models import ParticipationStatus
from db.repository import create_event, get_or_create_user, is_member, list_upcoming_events, set_event_participation

router = Router()

STATUS_LABELS = {
    ParticipationStatus.going: "Пойду ✅",
    ParticipationStatus.maybe: "Возможно 🤔",
    ParticipationStatus.declined: "Не пойду ❌",
}


@router.callback_query(F.data.startswith("events:"))
async def show_events(callback: CallbackQuery, session: AsyncSession):
    community_id = int(callback.data.split(":")[1])
    events = await list_upcoming_events(session, community_id)
    if not events:
        await callback.message.edit_text(
            "Ближайших событий нет.", reply_markup=back_keyboard(f"view_community:{community_id}")
        )
        await callback.answer()
        return
    await callback.message.delete()
    for event in events:
        date_str = event.event_date.strftime("%d.%m.%Y %H:%M")
        text = f"<b>{event.title}</b>\n{date_str}"
        if event.location:
            text += f"\n📍 {event.location}"
        if event.description:
            text += f"\n\n{event.description}"
        await callback.message.answer(text, reply_markup=event_participation_keyboard(event.id), parse_mode="HTML")
    await callback.message.answer("Это все ближайшие события.", reply_markup=back_keyboard(f"view_community:{community_id}"))
    await callback.answer()


@router.callback_query(F.data.startswith("rsvp:"))
async def rsvp_event(callback: CallbackQuery, session: AsyncSession):
    _, event_id, status = callback.data.split(":")
    user = await get_or_create_user(
        session,
        telegram_id=callback.from_user.id,
        username=callback.from_user.username,
        full_name=callback.from_user.full_name,
    )
    await set_event_participation(session, int(event_id), user.id, ParticipationStatus(status))
    await callback.answer(f"Отмечено: {STATUS_LABELS[ParticipationStatus(status)]}")


@router.callback_query(F.data.startswith("new_event:"))
async def start_new_event(callback: CallbackQuery, state: FSMContext, session: AsyncSession):
    community_id = int(callback.data.split(":")[1])
    user = await get_or_create_user(
        session,
        telegram_id=callback.from_user.id,
        username=callback.from_user.username,
        full_name=callback.from_user.full_name,
    )
    if not await is_member(session, community_id, user.id):
        await callback.answer("Нужно вступить в сообщество, чтобы создавать события", show_alert=True)
        return
    await state.update_data(community_id=community_id)
    await state.set_state(CreateEvent.title)
    await callback.message.edit_text("Введи название события:")
    await callback.answer()


@router.message(CreateEvent.title)
async def event_title(message: Message, state: FSMContext):
    await state.update_data(title=message.text)
    await state.set_state(CreateEvent.description)
    await message.answer("Описание события (или «-», чтобы пропустить):")


@router.message(CreateEvent.description)
async def event_description(message: Message, state: FSMContext):
    description = None if message.text.strip() == "-" else message.text
    await state.update_data(description=description)
    await state.set_state(CreateEvent.date)
    await message.answer("Дата и время в формате ДД.ММ.ГГГГ ЧЧ:ММ (например, 25.12.2026 18:00):")


@router.message(CreateEvent.date)
async def event_date(message: Message, state: FSMContext):
    try:
        event_dt = datetime.strptime(message.text.strip(), "%d.%m.%Y %H:%M")
    except ValueError:
        await message.answer("Неверный формат. Попробуй ещё раз, например: 25.12.2026 18:00")
        return
    await state.update_data(event_date=event_dt.isoformat())
    await state.set_state(CreateEvent.location)
    await message.answer("Место проведения (или «-», чтобы пропустить):")


@router.message(CreateEvent.location)
async def event_location(message: Message, state: FSMContext, session: AsyncSession):
    location = None if message.text.strip() == "-" else message.text
    data = await state.get_data()
    event = await create_event(
        session,
        community_id=data["community_id"],
        title=data["title"],
        description=data["description"],
        event_date=datetime.fromisoformat(data["event_date"]),
        location=location,
    )
    await state.clear()
    await message.answer(f"Событие «{event.title}» создано!")
