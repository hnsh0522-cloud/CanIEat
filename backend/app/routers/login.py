from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.Login import Login
from app.controller.login import login_process
from app.database import get_db

# 1. 라우터 객체 생성 (공통 주소 prefix와 태그 지정)
router = APIRouter(
    prefix="/login",
    tags=["login_process"]
)


@router.post("/")
async def login(
    login_data: Login,
    response: Response,          # ★ 쿠키 설정을 위해 Response 객체 주입 추가
    db: AsyncSession = Depends(get_db)
):
    return await login_process(
        response=response,       # ★ login_process로 Response 객체 전달
        db=db,
        email=login_data.email,
        password=login_data.password
    )