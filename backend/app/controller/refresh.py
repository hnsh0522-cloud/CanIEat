from typing import NoReturn, Optional

from fastapi import HTTPException, Response, status
from jose import JWTError
from jose.exceptions import ExpiredSignatureError
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.account_crud import get_account_by_email
from app.utils.auth_cookies import clear_refresh_token_cookie
from app.utils.token import create_access_token, decode_token


def _unauthorized(response: Response, detail: str) -> NoReturn:
    clear_refresh_token_cookie(response)
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
    )


async def refresh_access_token_process(
    response: Response,
    db: AsyncSession,
    refresh_token: Optional[str],
) -> dict:
    if not refresh_token:
        _unauthorized(response, "Refresh Token이 없습니다.")

    try:
        payload = decode_token(refresh_token, "refresh")
    except ExpiredSignatureError:
        _unauthorized(response, "Refresh Token이 만료되었습니다.")
    except JWTError:
        _unauthorized(response, "Refresh Token 검증에 실패했습니다.")

    user_id = payload.get("sub")
    email = payload.get("email")
    try:
        parsed_user_id = int(user_id)
    except (TypeError, ValueError):
        _unauthorized(response, "유효하지 않은 Refresh Token입니다.")

    if parsed_user_id <= 0 or not isinstance(email, str) or not email:
        _unauthorized(response, "유효하지 않은 Refresh Token입니다.")

    user = await get_account_by_email(db, email)
    if user is None or user["user_id"] != parsed_user_id:
        _unauthorized(response, "Refresh Token의 사용자 계정을 찾을 수 없습니다.")

    return {
        "access_token": create_access_token(parsed_user_id, email),
        "token_type": "bearer",
    }
