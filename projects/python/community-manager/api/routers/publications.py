from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_admin
from api.schemas import PublicationCreate, PublicationOut
from db.database import get_session
from db.models import Publication

router = APIRouter(prefix="/publications", tags=["publications"], dependencies=[Depends(get_current_admin)])


@router.get("", response_model=list[PublicationOut])
async def get_publications(community_id: int | None = None, session: AsyncSession = Depends(get_session)):
    query = select(Publication)
    if community_id is not None:
        query = query.where(Publication.community_id == community_id)
    result = await session.execute(query.order_by(Publication.created_at.desc()))
    return list(result.scalars().all())


@router.post("", response_model=PublicationOut)
async def create_publication_endpoint(payload: PublicationCreate, session: AsyncSession = Depends(get_session)):
    publication = Publication(**payload.model_dump())
    session.add(publication)
    await session.commit()
    await session.refresh(publication)
    return publication


@router.delete("/{publication_id}")
async def delete_publication(publication_id: int, session: AsyncSession = Depends(get_session)):
    publication = (
        await session.execute(select(Publication).where(Publication.id == publication_id))
    ).scalar_one_or_none()
    if publication:
        await session.delete(publication)
        await session.commit()
    return {"status": "deleted"}
