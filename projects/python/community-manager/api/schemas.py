from datetime import datetime

from pydantic import BaseModel, ConfigDict

from db.models import MemberRole, ParticipationStatus


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    telegram_id: int
    username: str | None
    full_name: str
    created_at: datetime


class CommunityCreate(BaseModel):
    name: str
    description: str | None = None
    owner_id: int


class CommunityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    owner_id: int
    telegram_chat_id: int | None
    created_at: datetime


class CommunityMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    community_id: int
    user_id: int
    role: MemberRole
    joined_at: datetime


class PublicationCreate(BaseModel):
    community_id: int
    author_id: int
    text: str
    photo_file_id: str | None = None


class PublicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    community_id: int
    author_id: int
    text: str
    photo_file_id: str | None
    created_at: datetime


class EventCreate(BaseModel):
    community_id: int
    title: str
    description: str | None = None
    event_date: datetime
    location: str | None = None


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    community_id: int
    title: str
    description: str | None
    event_date: datetime
    location: str | None
    created_at: datetime


class EventParticipantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    user_id: int
    status: ParticipationStatus
