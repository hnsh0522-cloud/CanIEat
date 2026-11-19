from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from jose.exceptions import ExpiredSignatureError

from app.utils.token import decode_token

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """
    요청 헤더의 Authorization: Bearer <token>을 검증하고 payload를 반환합니다.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 토큰이 필요합니다.",
        )

    try:
        payload = decode_token(credentials.credentials, "access")
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access Token이 만료되었습니다.",
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰 검증에 실패했습니다.",
        )

    user_id = payload.get("sub")
    email = payload.get("email")
    try:
        parsed_user_id = int(user_id)
    except (TypeError, ValueError):
        parsed_user_id = 0

    if parsed_user_id <= 0 or not isinstance(email, str) or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다.",
        )

    return {"user_id": parsed_user_id, "email": email}
