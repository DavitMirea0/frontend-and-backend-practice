from aiogram.fsm.state import State, StatesGroup


class CreateCommunity(StatesGroup):
    name = State()
    description = State()


class CreatePublication(StatesGroup):
    choosing_community = State()
    text = State()


class CreateEvent(StatesGroup):
    choosing_community = State()
    title = State()
    description = State()
    date = State()
    location = State()
