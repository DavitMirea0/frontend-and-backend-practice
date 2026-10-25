from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_admin
from api.schemas import UserOut
from db.database import get_session
from db.repository import list_users

router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(get_current_admin)])


@router.get("", response_model=list[UserOut])
async def get_users(session: AsyncSession = Depends(get_session)):
    return await list_users(session)
