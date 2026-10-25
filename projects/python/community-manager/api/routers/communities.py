from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_admin
from api.schemas import CommunityCreate, CommunityOut
from db.database import get_session
from db.models import Community, User
from db.repository import list_communities

router = APIRouter(prefix="/communities", tags=["communities"], dependencies=[Depends(get_current_admin)])


@router.get("", response_model=list[CommunityOut])
async def get_communities(session: AsyncSession = Depends(get_session)):
    return await list_communities(session)


@router.post("", response_model=CommunityOut)
async def create_community_endpoint(payload: CommunityCreate, session: AsyncSession = Depends(get_session)):
    owner = (await session.execute(select(User).where(User.id == payload.owner_id))).scalar_one_or_none()
    if not owner:
        raise HTTPException(status_code=404, detail="Пользователь-владелец не найден")
    community = Community(name=payload.name, description=payload.description, owner_id=owner.id)
    session.add(community)
    await session.commit()
    await session.refresh(community)
    return community


@router.delete("/{community_id}")
async def delete_community(community_id: int, session: AsyncSession = Depends(get_session)):
    community = (
        await session.execute(select(Community).where(Community.id == community_id))
    ).scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Сообщество не найдено")
    await session.delete(community)
    await session.commit()
    return {"status": "deleted"}
