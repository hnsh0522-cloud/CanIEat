from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.controller.register import register_process
from app.database import get_db
from app.schemas.Register import Register


router = APIRouter(
	prefix="/register",
	tags=["register_process"]
)


@router.post("/")
async def register(
	register_data: Register,
	db: AsyncSession = Depends(get_db)
):
	return await register_process(
		db=db,
		email=register_data.email,
		password=register_data.password,
		nickname=register_data.nickname
	)
