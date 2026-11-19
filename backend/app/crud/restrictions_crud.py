from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# 사용자 주의사항 목록 조회
async def get_user_restrictions(
    db: AsyncSession,
    user_id: int
):
    """
    특정 사용자가 등록한 모든 주의사항을 조회한다.
    반환 컬럼: restriction_id, user_id, restriction_text
    """

    try:
        result = await db.execute(
            text("""
                SELECT restriction_id, user_id, restriction_text
                FROM user_restrictions
                WHERE user_id = :user_id
                ORDER BY restriction_id DESC;
            """),
            {
                "user_id": user_id
            }
        )

        # 여러 행(Row)을 딕셔너리 형태로 변환
        rows = result.mappings().all()
        restrictions = [dict(row) for row in rows]

        return {
            "success": True,
            "message": "주의사항 조회 성공",
            "data": restrictions
        }

    except Exception as e:
        # 조회 작업이므로 rollback 필수는 아니지만 통일성을 위해 유지
        await db.rollback()

        return {
            "success": False,
            "message": "주의사항 조회 실패",
            "error": str(e)
        }

# 사용자 주의사항 추가
async def add_user_restriction(
    db: AsyncSession,
    user_id: int,
    restriction_text: str
):
    """
    사용자 섭취 주의사항 추가 함수
    """

    try:
        result = await db.execute(
            text("""
                INSERT INTO user_restrictions (
                    user_id,
                    restriction_text
                )
                VALUES (
                    :user_id,
                    :restriction_text
                )
                ON CONFLICT (user_id, restriction_text)
                DO NOTHING
                RETURNING restriction_id;
            """),
            {
                "user_id": user_id,
                "restriction_text": restriction_text
            }
        )

        restriction_id = result.scalar_one_or_none()

        if restriction_id is None:
            await db.rollback()

            return {
                "success": False,
                "message": "이미 등록된 주의사항입니다."
            }

        await db.commit()

        return {
            "success": True,
            "message": "주의사항 추가 성공",
            "restriction_id": restriction_id
        }

    except Exception as e:
        await db.rollback()

        return {
            "success": False,
            "message": "주의사항 추가 실패",
            "error": str(e)
        }


# 사용자 주의사항 삭제
async def delete_user_restriction(
    db: AsyncSession,
    user_id: int,
    restriction_id: int
):
    """
    사용자가 등록한 특정 주의사항을 삭제한다.
    """

    try:
        result = await db.execute(
            text("""
                DELETE FROM user_restrictions
                WHERE user_id = :user_id
                  AND restriction_id = :restriction_id
                RETURNING restriction_id;
            """),
            {
                "user_id": user_id,
                "restriction_id": restriction_id
            }
        )

        deleted_id = result.scalar_one_or_none()

        if deleted_id is None:
            await db.rollback()

            return {
                "success": False,
                "message": "등록된 주의사항이 없습니다."
            }

        await db.commit()

        return {
            "success": True,
            "message": "주의사항 삭제 성공"
        }

    except Exception as e:
        await db.rollback()

        return {
            "success": False,
            "message": "주의사항 삭제 실패",
            "error": str(e)
        }