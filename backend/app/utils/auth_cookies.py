import os

from fastapi import Response

from app.utils.token import REFRESH_TOKEN_EXPIRE_DAYS

REFRESH_TOKEN_COOKIE_NAME = "refresh_token"
REFRESH_TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * REFRESH_TOKEN_EXPIRE_DAYS
REFRESH_TOKEN_COOKIE_SECURE = (
    os.getenv("REFRESH_TOKEN_COOKIE_SECURE", "false").lower() == "true"
)


def set_refresh_token_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=REFRESH_TOKEN_COOKIE_SECURE,
        samesite="lax",
        max_age=REFRESH_TOKEN_COOKIE_MAX_AGE,
        path="/",
    )


def clear_refresh_token_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE_NAME,
        httponly=True,
        secure=REFRESH_TOKEN_COOKIE_SECURE,
        samesite="lax",
        path="/",
    )
