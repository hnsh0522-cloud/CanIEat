from typing import Optional, List, Dict, Any

from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import AsyncSession


async def _get_analysis_records(
    db: AsyncSession,
    user_id: Optional[int] = None,
) -> dict:
    """분석 기록과 각 기록의 알레르기 탐지 정보를 함께 조회한다."""
    where_clause = "WHERE ar.user_id = :user_id" if user_id is not None else ""
    params = {"user_id": user_id} if user_id is not None else {}

    try:
        result = await db.execute(
            text(f"""
                SELECT
                    ar.analysis_id,
                    ar.user_id,
                    ar.product_name,
                    ar.risk_level,
                    ar.result_message,
                    ar.created_at,
                    da.allergy_id,
                    a.allergy_name,
                    da.detected_ingredient,
                    da.risk_type
                FROM analysis_records AS ar
                LEFT JOIN detected_allergens AS da
                    ON da.analysis_id = ar.analysis_id
                LEFT JOIN allergies AS a
                    ON a.allergy_id = da.allergy_id
                {where_clause}
                ORDER BY ar.created_at DESC, ar.analysis_id DESC;
            """),
            params,
        )

        records_by_id = {}
        for row in result.mappings().all():
            analysis_id = row["analysis_id"]
            record = records_by_id.get(analysis_id)
            if record is None:
                record = {
                    "analysis_id": analysis_id,
                    "user_id": row["user_id"],
                    "product_name": row["product_name"],
                    "risk_level": row["risk_level"],
                    "result_message": row["result_message"],
                    "created_at": row["created_at"],
                    "detected_allergens": [],
                }
                records_by_id[analysis_id] = record

            if row["risk_type"] is not None:
                record["detected_allergens"].append({
                    "allergy_id": row["allergy_id"],
                    "allergy_name": row["allergy_name"],
                    "detected_ingredient": row["detected_ingredient"],
                    "risk_type": row["risk_type"],
                })

        return {
            "success": True,
            "message": "분석 기록 조회 성공",
            "data": list(records_by_id.values()),
        }

    except Exception as e:
        await db.rollback()
        return {
            "success": False,
            "message": "분석 기록 조회 실패",
            "error": str(e),
        }


async def get_all_analysis_records(db: AsyncSession) -> dict:
    """모든 사용자의 분석 기록을 최신순으로 조회한다."""
    return await _get_analysis_records(db)


async def get_user_analysis_records(
    db: AsyncSession,
    user_id: int,
) -> dict:
    """특정 사용자의 분석 기록을 최신순으로 조회한다."""
    return await _get_analysis_records(db, user_id=user_id)


async def save_analysis_result(
    db: AsyncSession,
    user_id: Optional[int],
    product_name: str,
    risk_level: str,
    result_message: str,
    allergens: List[Dict[str, Any]]
):
    """
    분석 결과 저장 함수

    1. analysis_records 테이블에 분석 기록 저장
    2. 생성된 analysis_id 반환
    3. detected_allergens 테이블에 분석된 알레르기 정보 저장
    """

    try:
        result = await db.execute(
            text("""
                INSERT INTO analysis_records (
                    user_id,
                    product_name,
                    risk_level,
                    result_message
                )
                VALUES (
                    :user_id,
                    :product_name,
                    :risk_level,
                    :result_message
                )
                RETURNING analysis_id;
            """),
            {
                "user_id": user_id,
                "product_name": product_name,
                "risk_level": risk_level,
                "result_message": result_message
            }
        )

        analysis_id = result.scalar_one()

        for allergen in allergens:
            await db.execute(
                text("""
                    INSERT INTO detected_allergens (
                        analysis_id,
                        allergy_id,
                        detected_ingredient,
                        risk_type
                    )
                    VALUES (
                        :analysis_id,
                        :allergy_id,
                        :detected_ingredient,
                        :risk_type
                    )
                    ON CONFLICT (
                        analysis_id,
                        allergy_id,
                        detected_ingredient
                    ) DO NOTHING;
                """),
                {
                    "analysis_id": analysis_id,
                    "allergy_id": allergen.get("allergy_id"),
                    "detected_ingredient": allergen.get("detected_ingredient"),
                    "risk_type": allergen.get("risk_type")
                }
            )

        await db.commit()

        return {
            "success": True,
            "message": "분석 결과 저장 완료",
            "analysis_id": analysis_id
        }

    except Exception as e:
        await db.rollback()
        return {
            "success": False,
            "message": "분석 결과 저장 실패",
            "error": str(e)
        }
        
# 분석 결과 삭제
async def delete_analysis_result(
    db: AsyncSession,
    analysis_id: int
):
    """
    특정 분석 결과를 삭제한다.

    analysis_records가 삭제되면
    연결된 detected_allergens는
    ON DELETE CASCADE로 자동 삭제된다.
    """

    try:
        result = await db.execute(
            text("""
                DELETE FROM analysis_records
                WHERE analysis_id = :analysis_id
                RETURNING analysis_id;
            """),
            {
                "analysis_id": analysis_id
            }
        )

        deleted_id = result.scalar_one_or_none()

        if deleted_id is None:
            return {
                "success": False,
                "message": "삭제할 분석 기록이 없습니다."
            }

        await db.commit()

        return {
            "success": True,
            "message": "분석 결과 삭제 성공",
            "analysis_id": deleted_id
        }

    except Exception as e:
        await db.rollback()

        return {
            "success": False,
            "message": "분석 결과 삭제 실패",
            "error": str(e)
        }


async def delete_analysis_results(
    db: AsyncSession,
    user_id: int,
    analysis_ids: List[int],
) -> dict:
    """특정 사용자가 소유한 분석 기록들을 일괄 삭제한다."""
    if not analysis_ids:
        return {
            "success": False,
            "message": "삭제할 분석 기록 ID가 없습니다.",
            "deleted_analysis_ids": [],
            "not_found_analysis_ids": [],
        }

    statement = text("""
        DELETE FROM analysis_records
        WHERE user_id = :user_id
          AND analysis_id IN :analysis_ids
        RETURNING analysis_id;
    """).bindparams(bindparam("analysis_ids", expanding=True))

    try:
        result = await db.execute(
            statement,
            {
                "user_id": user_id,
                "analysis_ids": analysis_ids,
            },
        )
        deleted_ids = result.scalars().all()
        deleted_id_set = set(deleted_ids)
        not_found_ids = [
            analysis_id
            for analysis_id in analysis_ids
            if analysis_id not in deleted_id_set
        ]

        if not deleted_ids:
            return {
                "success": False,
                "message": "삭제할 수 있는 분석 기록이 없습니다.",
                "deleted_analysis_ids": [],
                "not_found_analysis_ids": not_found_ids,
            }

        await db.commit()
        return {
            "success": True,
            "message": "분석 결과 삭제 완료",
            "deleted_analysis_ids": deleted_ids,
            "not_found_analysis_ids": not_found_ids,
        }
    except Exception as e:
        await db.rollback()
        return {
            "success": False,
            "message": "분석 결과 삭제 실패",
            "error": str(e),
        }