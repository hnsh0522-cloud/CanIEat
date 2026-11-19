from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.user_crud import register_user


async def register_process(
	db: AsyncSession,
	email: str,
	password: str,
	nickname: str
) -> dict:
	return await register_user(
		db=db,
		email=email,
		password=password,
		nickname=nickname
	)
