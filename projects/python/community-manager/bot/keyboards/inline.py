from aiogram.types import InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder

from db.models import Community, Event


def main_menu_keyboard():
    builder = InlineKeyboardBuilder()
    builder.row(InlineKeyboardButton(text="Мои сообщества", callback_data="my_communities"))
    builder.row(InlineKeyboardButton(text="Все сообщества", callback_data="all_communities"))
    builder.row(InlineKeyboardButton(text="Создать сообщество", callback_data="create_community"))
    return builder.as_markup()


def communities_list_keyboard(communities: list[Community], action: str):
    builder = InlineKeyboardBuilder()
    for community in communities:
        builder.row(InlineKeyboardButton(text=community.name, callback_data=f"{action}:{community.id}"))
    builder.row(InlineKeyboardButton(text="⬅ Назад", callback_data="main_menu"))
    return builder.as_markup()


def community_menu_keyboard(community_id: int, is_member: bool):
    builder = InlineKeyboardBuilder()
    if not is_member:
        builder.row(InlineKeyboardButton(text="Вступить", callback_data=f"join:{community_id}"))
    builder.row(InlineKeyboardButton(text="Публикации", callback_data=f"publications:{community_id}"))
    builder.row(InlineKeyboardButton(text="Написать пост", callback_data=f"new_publication:{community_id}"))
    builder.row(InlineKeyboardButton(text="События", callback_data=f"events:{community_id}"))
    builder.row(InlineKeyboardButton(text="Создать событие", callback_data=f"new_event:{community_id}"))
    builder.row(InlineKeyboardButton(text="⬅ Назад", callback_data="main_menu"))
    return builder.as_markup()


def event_participation_keyboard(event_id: int):
    builder = InlineKeyboardBuilder()
    builder.row(
        InlineKeyboardButton(text="Пойду", callback_data=f"rsvp:{event_id}:going"),
        InlineKeyboardButton(text="Возможно", callback_data=f"rsvp:{event_id}:maybe"),
        InlineKeyboardButton(text="Не пойду", callback_data=f"rsvp:{event_id}:declined"),
    )
    return builder.as_markup()


def back_keyboard(callback_data: str = "main_menu"):
    builder = InlineKeyboardBuilder()
    builder.row(InlineKeyboardButton(text="⬅ Назад", callback_data=callback_data))
    return builder.as_markup()
