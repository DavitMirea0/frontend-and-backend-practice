from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_admin
from api.schemas import EventCreate, EventOut, EventParticipantOut
from db.database import get_session
from db.models import Event
from db.repository import list_event_participants

router = APIRouter(prefix="/events", tags=["events"], dependencies=[Depends(get_current_admin)])


@router.get("", response_model=list[EventOut])
async def get_events(community_id: int | None = None, session: AsyncSession = Depends(get_session)):
    query = select(Event)
    if community_id is not None:
        query = query.where(Event.community_id == community_id)
    result = await session.execute(query.order_by(Event.event_date.asc()))
    return list(result.scalars().all())


@router.post("", response_model=EventOut)
async def create_event_endpoint(payload: EventCreate, session: AsyncSession = Depends(get_session)):
    event = Event(**payload.model_dump())
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return event


@router.get("/{event_id}/participants", response_model=list[EventParticipantOut])
async def get_event_participants(event_id: int, session: AsyncSession = Depends(get_session)):
    return await list_event_participants(session, event_id)


@router.delete("/{event_id}")
async def delete_event(event_id: int, session: AsyncSession = Depends(get_session)):
    event = (await session.execute(select(Event).where(Event.id == event_id))).scalar_one_or_none()
    if event:
        await session.delete(event)
        await session.commit()
    return {"status": "deleted"}
