from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def get_account_by_email_and_password(
    db: AsyncSession,
    email: str,
    password_hash: str
):
    """
    계정 정보 조회 함수

    인자로 받은 이메일과 비밀번호 해시가 일치하는 회원 정보를 조회한다.
    """

    result = await db.execute(
        text("""
            SELECT
                user_id,
                email,
                nickname,
                created_at
            FROM users
            WHERE email = :email
              AND password_hash = :password_hash;
        """),
        {
            "email": email,
            "password_hash": password_hash
        }
    )

    user = result.mappings().first()

    if not user:
        return {
            "success": False,
            "message": "일치하는 계정 정보가 없습니다."
        }

    return {
        "success": True,
        "message": "계정 조회 성공",
        "user": dict(user)
    }