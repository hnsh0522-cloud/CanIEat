from typing import Optional

from fastapi import APIRouter, Cookie, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controller.refresh import refresh_access_token_process
from app.database import get_db
from app.utils.auth_cookies import (
    REFRESH_TOKEN_COOKIE_NAME,
    clear_refresh_token_cookie,
)

router = APIRouter(tags=["authentication"])


@router.post("/refresh")
async def refresh_access_token(
    response: Response,
    refresh_token: Optional[str] = Cookie(
        default=None,
        alias=REFRESH_TOKEN_COOKIE_NAME,
    ),
    db: AsyncSession = Depends(get_db),
):
    return await refresh_access_token_process(
        response=response,
        db=db,
        refresh_token=refresh_token,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    clear_refresh_token_cookie(response)
