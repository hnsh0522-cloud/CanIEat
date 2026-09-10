from typing import Optional, List, Dict, Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def save_analysis_result(
    db: AsyncSession,
    user_id: Optional[int],
    risk_level: str,
    result_message: str,
    detected_allergens: List[Dict[str, Any]]
):
    """
    분석 결과 저장 함수

    1. analysis_records 테이블에 분석 기록 저장
    2. 생성된 analysis_id 반환
    3. 탐지된 성분이 있으면 detected_allergens 테이블에 저장
    """

    try:
        result = await db.execute(
            text("""
                INSERT INTO analysis_records (
                    user_id,
                    risk_level,
                    result_message
                )
                VALUES (
                    :user_id,
                    :risk_level,
                    :result_message
                )
                RETURNING analysis_id;
            """),
            {
                "user_id": user_id,
                "risk_level": risk_level,
                "result_message": result_message
            }
        )

        analysis_id = result.scalar_one()

        for allergen in detected_allergens:
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
                    );
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