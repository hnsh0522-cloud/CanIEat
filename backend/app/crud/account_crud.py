from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def get_account_by_email(db: AsyncSession, email: str):
    """
    계정 정보 조회 함수

    인자로 받은 이메일과 일치하는 회원 정보를 조회한다.
    """

    result = await db.execute(
        text("""
            SELECT
                user_id,
                email,
                nickname,
                password_hash,
                created_at
            FROM users
            WHERE email = :email;
        """),
        {"email": email}
    )

    user = result.mappings().first()

    if not user:
        return None

    return dict(user)