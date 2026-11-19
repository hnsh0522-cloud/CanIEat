from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def delete_user_data(
    db: AsyncSession,
    user_id: int
):
    """
    1. 사용자의 과거 분석 데이터"만"삭제
    
    """

    await db.execute(
        text("""
            DELETE FROM analysis_records
            WHERE user_id = :user_id;
        """),
        {"user_id": user_id}
    )


async def delete_user_account(
    db: AsyncSession,
    user_id: int
):
    """
    2. 사용자 계정"만" 삭제
    
    """

    await db.execute(
        text("""
            DELETE FROM users
            WHERE user_id = :user_id;
        """),
        {"user_id": user_id}
    )
    
    
async def delete_user(
    db: AsyncSession,
    user_id: int
):
    """
    3. 위 2개의 기능을 하나로 합친 함수
    
    회원 계정 + 과거 분석 데이터 전체 삭제
    
    """

    try:
        result = await db.execute(
            text("""
                SELECT user_id
                FROM users
                WHERE user_id = :user_id;
            """),
            {"user_id": user_id}
        )

        existing_user = result.fetchone()

        if not existing_user:
            return {
                "success": False,
                "message": "존재하지 않는 사용자입니다."
            }

        # 1. 과거 분석 데이터 먼저 삭제
        await delete_user_data(db, user_id)

        # 2. 계정 삭제
        await delete_user_account(db, user_id)

        await db.commit()

        return {
            "success": True,
            "message": "회원 탈퇴 성공"
        }

    except Exception as e:
        await db.rollback()

        return {
            "success": False,
            "message": "회원 탈퇴 실패",
            "error": str(e)
        }