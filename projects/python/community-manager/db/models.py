import enum
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.database import Base


class MemberRole(str, enum.Enum):
    owner = "owner"
    admin = "admin"
    member = "member"


class ParticipationStatus(str, enum.Enum):
    going = "going"
    maybe = "maybe"
    declined = "declined"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    username: Mapped[str | None] = mapped_column(String(64), nullable=True)
    full_name: Mapped[str] = mapped_column(String(256))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owned_communities: Mapped[list["Community"]] = relationship(back_populates="owner")
    memberships: Mapped[list["CommunityMember"]] = relationship(back_populates="user")
    publications: Mapped[list["Publication"]] = relationship(back_populates="author")
    event_participations: Mapped[list["EventParticipant"]] = relationship(back_populates="user")


class Community(Base):
    __tablename__ = "communities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    telegram_chat_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped["User"] = relationship(back_populates="owned_communities")
    members: Mapped[list["CommunityMember"]] = relationship(back_populates="community", cascade="all, delete-orphan")
    publications: Mapped[list["Publication"]] = relationship(back_populates="community", cascade="all, delete-orphan")
    events: Mapped[list["Event"]] = relationship(back_populates="community", cascade="all, delete-orphan")


class CommunityMember(Base):
    __tablename__ = "community_members"
    __table_args__ = (UniqueConstraint("community_id", "user_id", name="uq_community_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    community_id: Mapped[int] = mapped_column(ForeignKey("communities.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    role: Mapped[MemberRole] = mapped_column(Enum(MemberRole), default=MemberRole.member)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    community: Mapped["Community"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="memberships")


class Publication(Base):
    __tablename__ = "publications"

    id: Mapped[int] = mapped_column(primary_key=True)
    community_id: Mapped[int] = mapped_column(ForeignKey("communities.id"))
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    text: Mapped[str] = mapped_column(Text)
    photo_file_id: Mapped[str | None] = mapped_column(String(256), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    community: Mapped["Community"] = relationship(back_populates="publications")
    author: Mapped["User"] = relationship(back_populates="publications")


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    community_id: Mapped[int] = mapped_column(ForeignKey("communities.id"))
    title: Mapped[str] = mapped_column(String(256))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_date: Mapped[datetime] = mapped_column(DateTime)
    location: Mapped[str | None] = mapped_column(String(256), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    community: Mapped["Community"] = relationship(back_populates="events")
    participants: Mapped[list["EventParticipant"]] = relationship(back_populates="event", cascade="all, delete-orphan")


class EventParticipant(Base):
    __tablename__ = "event_participants"
    __table_args__ = (UniqueConstraint("event_id", "user_id", name="uq_event_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    status: Mapped[ParticipationStatus] = mapped_column(Enum(ParticipationStatus), default=ParticipationStatus.going)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    event: Mapped["Event"] = relationship(back_populates="participants")
    user: Mapped["User"] = relationship(back_populates="event_participations")
