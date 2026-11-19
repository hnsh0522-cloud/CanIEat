from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.allergy_crud import get_all_allergies
from app.crud.analysis_crud import save_analysis_result
from app.schemas.SaveAnalysisResult import SaveAnalysisResult


async def saveAnalysisResult_process(
    analysis_result: SaveAnalysisResult,
    db: AsyncSession,
    user_id: int,
) -> dict:
    """분석 결과를 DB 컬럼 형식으로 변환해 저장한다."""
    allergy_result = await get_all_allergies(db)
    if not allergy_result.get("success"):
        return allergy_result

    allergy_ids_by_name = {
        allergy["allergy_name"]: allergy["allergy_id"]
        for allergy in allergy_result["data"]
    }
    detected_ingredients_by_allergy: dict[str, list[str]] = {}
    unknown_allergies = set()

    for detected_ingredient in analysis_result.detected_ingredients:
        allergy_name = detected_ingredient.allergy.strip()
        ingredient_name = detected_ingredient.ingredient.strip()
        if allergy_name not in allergy_ids_by_name:
            unknown_allergies.add(allergy_name)
            continue
        if ingredient_name:
            ingredients = detected_ingredients_by_allergy.setdefault(
                allergy_name,
                [],
            )
            if ingredient_name not in ingredients:
                ingredients.append(ingredient_name)

    for risk in analysis_result.risk_type:
        allergy_name = risk.allergy.strip()
        if allergy_name not in allergy_ids_by_name:
            unknown_allergies.add(allergy_name)

    if unknown_allergies:
        return {
            "success": False,
            "message": "등록되지 않은 알레르기 이름이 분석 결과에 포함되어 있습니다.",
            "unknown_allergies": sorted(unknown_allergies),
        }

    allergens = []
    processed_allergies = set()
    risk_by_allergy = {}

    for risk in analysis_result.risk_type:
        allergy_name = risk.allergy.strip()
        if allergy_name not in risk_by_allergy:
            risk_by_allergy[allergy_name] = risk.type
        elif risk_by_allergy[allergy_name] != "match" and risk.type == "match":
            risk_by_allergy[allergy_name] = "match"

    for allergy_name, risk_type in risk_by_allergy.items():
        allergy_id = allergy_ids_by_name[allergy_name]
        detected_ingredients = detected_ingredients_by_allergy.get(
            allergy_name, []
        )
        processed_allergies.add(allergy_name)

        if risk_type == "match":
            for ingredient in detected_ingredients:
                allergens.append({
                    "allergy_id": allergy_id,
                    "detected_ingredient": ingredient,
                    "risk_type": "MATCH",
                })
            if not detected_ingredients:
                allergens.append({
                    "allergy_id": allergy_id,
                    "detected_ingredient": None,
                    "risk_type": "MATCH",
                })
        else:
            allergens.append({
                "allergy_id": allergy_id,
                "detected_ingredient": None,
                "risk_type": "UNMATCH",
            })

    for allergy_name, ingredients in detected_ingredients_by_allergy.items():
        if allergy_name in processed_allergies:
            continue
        for ingredient in ingredients:
            allergens.append({
                "allergy_id": allergy_ids_by_name[allergy_name],
                "detected_ingredient": ingredient,
                "risk_type": "MATCH",
            })

    return await save_analysis_result(
        db=db,
        user_id=user_id,
        product_name=analysis_result.product_name,
        risk_level=analysis_result.risk_level.upper(),
        result_message=analysis_result.result_message,
        allergens=allergens,
    )