from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# 특정 사용자의 알레르기 목록 조회
async def get_user_allergies(
    db: AsyncSession,
    user_id: int
):
    """
    특정 사용자가 등록한 모든 알레르기 정보를 조회한다.
    반환 컬럼: user_allergy_id, user_id, allergy_id, allergy_name,
    parent_allergy_id, memo
    """

    try:
        result = await db.execute(
            text("""
                SELECT 
                    ua.user_allergy_id,
                    ua.user_id,
                    ua.allergy_id,
                    a.allergy_name,
                    a.parent_allergy_id,
                    ua.memo
                FROM user_allergies ua
                JOIN allergies a ON ua.allergy_id = a.allergy_id
                WHERE ua.user_id = :user_id
                ORDER BY ua.user_allergy_id ASC;
            """),
            {
                "user_id": user_id
            }
        )

        # 조회된 행들을 딕셔너리 형태로 변환
        rows = result.mappings().all()
        user_allergies = [dict(row) for row in rows]

        return {
            "success": True,
            "message": "사용자 알레르기 조회 성공",
            "data": user_allergies
        }

    except Exception as e:
        await db.rollback()

        return {
            "success": False,
            "message": "사용자 알레르기 조회 실패",
            "error": str(e)
        }

# 1. 사용자 알레르기 추가
async def add_user_allergy(
    db: AsyncSession,
    user_id: int,
    allergy_id: int,
    memo: str = None
):
    """
    사용자 알레르기 추가 함수

    동일한 알레르기가 이미 등록되어 있으면
    memo만 수정한다.
    """

    try:
        result = await db.execute(
            text("""
                INSERT INTO user_allergies (
                    user_id,
                    allergy_id,
                    memo
                )
                VALUES (
                    :user_id,
                    :allergy_id,
                    :memo
                )
                ON CONFLICT (user_id, allergy_id)
                DO UPDATE SET
                    memo = EXCLUDED.memo
                RETURNING user_allergy_id;
            """),
            {
                "user_id": user_id,
                "allergy_id": allergy_id,
                "memo": memo
            }
        )

        user_allergy_id = result.scalar_one()

        await db.commit()

        return {
            "success": True,
            "message": "알레르기 추가 성공",
            "user_allergy_id": user_allergy_id
        }

    except Exception as e:
        await db.rollback()

        return {
            "success": False,
            "message": "알레르기 추가 실패",
            "error": str(e)
        }


# 2. 사용자 알레르기 삭제
async def delete_user_allergy(
    db: AsyncSession,
    user_id: int,
    allergy_id: int
):
    """
    사용자가 등록한 특정 알레르기를 삭제한다.
    """

    try:
        result = await db.execute(
            text("""
                DELETE FROM user_allergies
                WHERE user_id = :user_id
                  AND allergy_id = :allergy_id
                RETURNING user_allergy_id;
            """),
            {
                "user_id": user_id,
                "allergy_id": allergy_id
            }
        )

        deleted_id = result.scalar_one_or_none()

        if deleted_id is None:
            await db.rollback()

            return {
                "success": False,
                "message": "등록된 알레르기 정보가 없습니다."
            }

        await db.commit()

        return {
            "success": True,
            "message": "알레르기 삭제 성공"
        }

    except Exception as e:
        await db.rollback()

        return {
            "success": False,
            "message": "알레르기 삭제 실패",
            "error": str(e)
        }