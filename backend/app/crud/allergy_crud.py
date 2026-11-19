from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# 전체 알레르기 목록 조회
async def get_all_allergies(
    db: AsyncSession
):
    """
    등록된 모든 알레르기 종류 목록을 조회한다.
    반환 컬럼: allergy_id, allergy_name, parent_allergy_id
    """

    try:
        result = await db.execute(
            text("""
                SELECT allergy_id, allergy_name, parent_allergy_id
                FROM allergies
                ORDER BY allergy_id ASC;
            """)
        )

        # 결과 행들을 딕셔너리 형태로 변환
        rows = result.mappings().all()
        allergies = [dict(row) for row in rows]

        return {
            "success": True,
            "message": "알레르기 목록 조회 성공",
            "data": allergies
        }

    except Exception as e:
        await db.rollback()

        return {
            "success": False,
            "message": "알레르기 목록 조회 실패",
            "error": str(e)
        }


# 특정 상위 알레르기에 속한 알레르기 목록 조회
async def get_allergies_by_parent_allergy_id(
    db: AsyncSession,
    parent_allergy_id: int
):
    """
    특정 상위 알레르기 ID를 부모로 갖는 알레르기 종류를 조회한다.
    반환 컬럼: allergy_id, allergy_name, parent_allergy_id
    """

    try:
        result = await db.execute(
            text("""
                SELECT allergy_id, allergy_name, parent_allergy_id
                FROM allergies
                WHERE parent_allergy_id = :parent_allergy_id
                ORDER BY allergy_id ASC;
            """),
            {
                "parent_allergy_id": parent_allergy_id
            }
        )

        rows = result.mappings().all()
        allergies = [dict(row) for row in rows]

        return {
            "success": True,
            "message": "하위 알레르기 목록 조회 성공",
            "data": allergies
        }

    except Exception as e:
        await db.rollback()

        return {
            "success": False,
            "message": "하위 알레르기 목록 조회 실패",
            "error": str(e)
        }


# 이름으로 알레르기 조회
async def get_allergy_by_name(
    db: AsyncSession,
    allergy_name: str
):
    """
    알레르기 이름으로 알레르기 정보를 조회한다.
    반환 컬럼: allergy_id, allergy_name, parent_allergy_id
    """

    try:
        result = await db.execute(
            text("""
                SELECT allergy_id, allergy_name, parent_allergy_id
                FROM allergies
                WHERE allergy_name = :allergy_name;
            """),
            {
                "allergy_name": allergy_name
            }
        )

        row = result.mappings().one_or_none()
        if row is None:
            return {
                "success": False,
                "message": "해당 알레르기 정보를 찾을 수 없습니다."
            }

        return {
            "success": True,
            "message": "알레르기 조회 성공",
            "data": dict(row)
        }

    except Exception as e:
        await db.rollback()

        return {
            "success": False,
            "message": "알레르기 조회 실패",
            "error": str(e)
        }