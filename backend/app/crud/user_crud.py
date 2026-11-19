from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.password import hash_password


async def register_user(
    db: AsyncSession,
    email: str,
    password: str,
    nickname: str
):
    """
    회원가입 함수

    1. users 테이블에서 이메일 중복 확인
    2. 중복이면 실패 메시지 반환
    3. 중복이 아니면 users 테이블에 회원 정보 저장
    """

    try:
        result = await db.execute(
            text("""
                SELECT user_id
                FROM users
                WHERE email = :email;
            """),
            {"email": email}
        )

        existing_user = result.fetchone()

        if existing_user:
            return {
                "success": False,
                "message": "이미 사용 중인 이메일입니다."
            }

        insert_result = await db.execute(
            text("""
                INSERT INTO users (
                    email,
                    password_hash,
                    nickname
                )
                VALUES (
                    :email,
                    :password_hash,
                    :nickname
                )
                RETURNING user_id;
            """),
            {
                "email": email,
                "password_hash": hash_password(password),
                "nickname": nickname
            }
        )

        user_id = insert_result.scalar_one()

        await db.commit()

        return {
            "success": True,
            "message": "회원가입 성공",
            "user_id": user_id
        }

    except Exception as e:
        await db.rollback()
        return {
            "success": False,
            "message": "회원가입 실패",
            "error": str(e)
        }