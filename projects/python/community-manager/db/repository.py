from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.models import (
    Community,
    CommunityMember,
    Event,
    EventParticipant,
    MemberRole,
    ParticipationStatus,
    Publication,
    User,
)


# --- Users ---

async def get_or_create_user(session: AsyncSession, telegram_id: int, username: str | None, full_name: str) -> User:
    result = await session.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if user:
        user.username = username
        user.full_name = full_name
        await session.commit()
        return user
    user = User(telegram_id=telegram_id, username=username, full_name=full_name)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def list_users(session: AsyncSession) -> list[User]:
    result = await session.execute(select(User))
    return list(result.scalars().all())


# --- Communities ---

async def create_community(session: AsyncSession, name: str, description: str | None, owner: User) -> Community:
    community = Community(name=name, description=description, owner_id=owner.id)
    session.add(community)
    await session.flush()
    session.add(CommunityMember(community_id=community.id, user_id=owner.id, role=MemberRole.owner))
    await session.commit()
    await session.refresh(community)
    return community


async def list_communities(session: AsyncSession) -> list[Community]:
    result = await session.execute(select(Community))
    return list(result.scalars().all())


async def get_community(session: AsyncSession, community_id: int) -> Community | None:
    result = await session.execute(
        select(Community).where(Community.id == community_id).options(selectinload(Community.members))
    )
    return result.scalar_one_or_none()


async def list_user_communities(session: AsyncSession, user_id: int) -> list[Community]:
    result = await session.execute(
        select(Community).join(CommunityMember).where(CommunityMember.user_id == user_id)
    )
    return list(result.scalars().all())


async def join_community(session: AsyncSession, community_id: int, user_id: int) -> CommunityMember | None:
    existing = await session.execute(
        select(CommunityMember).where(
            CommunityMember.community_id == community_id, CommunityMember.user_id == user_id
        )
    )
    if existing.scalar_one_or_none():
        return None
    member = CommunityMember(community_id=community_id, user_id=user_id, role=MemberRole.member)
    session.add(member)
    await session.commit()
    await session.refresh(member)
    return member


async def is_member(session: AsyncSession, community_id: int, user_id: int) -> bool:
    result = await session.execute(
        select(CommunityMember).where(
            CommunityMember.community_id == community_id, CommunityMember.user_id == user_id
        )
    )
    return result.scalar_one_or_none() is not None


# --- Publications ---

async def create_publication(
    session: AsyncSession, community_id: int, author_id: int, text: str, photo_file_id: str | None = None
) -> Publication:
    publication = Publication(community_id=community_id, author_id=author_id, text=text, photo_file_id=photo_file_id)
    session.add(publication)
    await session.commit()
    await session.refresh(publication)
    return publication


async def list_publications(session: AsyncSession, community_id: int, limit: int = 10) -> list[Publication]:
    result = await session.execute(
        select(Publication)
        .where(Publication.community_id == community_id)
        .order_by(Publication.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


# --- Events ---

async def create_event(
    session: AsyncSession,
    community_id: int,
    title: str,
    description: str | None,
    event_date: datetime,
    location: str | None,
) -> Event:
    event = Event(
        community_id=community_id,
        title=title,
        description=description,
        event_date=event_date,
        location=location,
    )
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return event


async def list_upcoming_events(session: AsyncSession, community_id: int) -> list[Event]:
    result = await session.execute(
        select(Event)
        .where(Event.community_id == community_id, Event.event_date >= datetime.utcnow())
        .order_by(Event.event_date.asc())
    )
    return list(result.scalars().all())


async def set_event_participation(
    session: AsyncSession, event_id: int, user_id: int, status: ParticipationStatus
) -> EventParticipant:
    result = await session.execute(
        select(EventParticipant).where(EventParticipant.event_id == event_id, EventParticipant.user_id == user_id)
    )
    participant = result.scalar_one_or_none()
    if participant:
        participant.status = status
    else:
        participant = EventParticipant(event_id=event_id, user_id=user_id, status=status)
        session.add(participant)
    await session.commit()
    await session.refresh(participant)
    return participant


async def list_event_participants(session: AsyncSession, event_id: int) -> list[EventParticipant]:
    result = await session.execute(
        select(EventParticipant)
        .where(EventParticipant.event_id == event_id)
        .options(selectinload(EventParticipant.user))
    )
    return list(result.scalars().all())
