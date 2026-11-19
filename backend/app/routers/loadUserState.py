from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.controller.loadUserState import loadUserState_process
from app.utils.auth import get_current_user
from app.database import get_db


router = APIRouter(
    prefix="/MyPage",
    tags=["MyPage"],
)


@router.get("/loadUserState")
async def load_user_state(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    사용자 상태를 불러오는 엔드포인트입니다.
    이 엔드포인트는 인증된 사용자만 접근할 수 있습니다.
    """
    return await loadUserState_process(
        db=db,
        email=current_user.get("email"),
    )