import asyncio

from app.database import AsyncSessionLocal
from app.crud.password_crud import change_password


async def main():
    async with AsyncSessionLocal() as db:
        result = await change_password(
            db=db,
            user_id=1,
            current_password_hash="new_password_test1",
            new_password_hash="123456789"
        )

        print(result)


asyncio.run(main())