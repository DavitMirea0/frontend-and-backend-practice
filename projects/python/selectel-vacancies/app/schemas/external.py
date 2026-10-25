from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ExternalCity(BaseModel):
    id: int
    name: str


class ExternalTag(BaseModel):
    id: int
    name: str
    description: str


class ExternalTimetableMode(BaseModel):
    id: int
    name: str


class ExternalVacancyItem(BaseModel):
    id: int
    title: str
    timetable_mode: ExternalTimetableMode
    tag: Optional[ExternalTag] = None
    city: Optional[ExternalCity] = None
    published_at: datetime
    is_remote_available: bool
    is_hot: bool


class ExternalVacanciesResponse(BaseModel):
    item_count: int = Field(alias="item_count")
    items: List[ExternalVacancyItem]
    items_per_page: int
    page: int
    page_count: int
