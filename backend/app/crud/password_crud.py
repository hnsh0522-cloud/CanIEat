from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.password import hash_password, verify_password


async def change_password(
    db: AsyncSession,
    user_id: int,
    current_password: str,
    new_password: str
):
    """
    비밀번호 변경 함수

    사용자 ID와 기존 비밀번호 해시가 일치하는 경우에만
    새로운 비밀번호 해시로 변경
    
    """

    try:
        result = await db.execute(
            text("""
                SELECT user_id, password_hash
                FROM users
                WHERE user_id = :user_id;
            """),
            {"user_id": user_id}
        )

        user = result.mappings().first()

        if not user or not verify_password(current_password, user["password_hash"]):
            return {
                "success": False,
                "message": "기존 비밀번호가 일치하지 않습니다."
            }

        await db.execute(
            text("""
                UPDATE users
                SET password_hash = :new_password_hash
                WHERE user_id = :user_id;
            """),
            {
                "user_id": user_id,
                "new_password_hash": hash_password(new_password)
            }
        )

        await db.commit()

        return {
            "success": True,
            "message": "비밀번호 변경 성공"
        }

    except Exception as e:      
        await db.rollback()

        return {
            "success": False,
            "message": "비밀번호 변경 실패",
            "error": str(e)
        }