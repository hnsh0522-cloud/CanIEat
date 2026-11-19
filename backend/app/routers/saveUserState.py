from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.controller.saveUserState import saveUserState_process
from app.schemas.UserState import UserState
from app.utils.auth import get_current_user
from app.database import get_db


router = APIRouter(
    prefix="/MyPage",
    tags=["MyPage"],
)


@router.post("/saveUserState")
async def save_user_state(
    user_state: UserState,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    사용자 상태를 저장하는 엔드포인트입니다.
    이 엔드포인트는 인증된 사용자만 접근할 수 있습니다.
    """
    return await saveUserState_process(
        user_state=user_state,
        db=db,
        email=current_user.get("email"),
    )