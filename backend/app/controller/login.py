from fastapi import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.account_crud import get_account_by_email
from app.utils.auth_cookies import set_refresh_token_cookie
from app.utils.password import verify_password
from app.utils.token import create_access_token, create_refresh_token


async def login_process(
    response: Response,
    db: AsyncSession,
    email: str,
    password: str
) -> dict:
    user = await get_account_by_email(db, email)

    if not user or not verify_password(password, user["password_hash"]):
        return {
            "success": False,
            "message": "이메일 또는 비밀번호가 올바르지 않습니다."
        }

    access_token = create_access_token(user["user_id"], user["email"])
    refresh_token = create_refresh_token(user["user_id"], user["email"])

    set_refresh_token_cookie(response, refresh_token)

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "nickname": user["nickname"]
        }
    }