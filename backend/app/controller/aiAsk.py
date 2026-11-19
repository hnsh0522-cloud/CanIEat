from datetime import date
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.ext.asyncio import AsyncSession
from app.utils.parse_date import parse_duration, try_parse_date
from app.api.aiAsk_aiAPI import FIXED_SYSTEM_PROMPT, retry_ask
from app.controller.aiAsk_dataPreProcessing import data_pre_processing
from app.crud.allergy_crud import get_all_allergies
from app.schemas.AskOfEating import AskOfEating, Ingredient
import json
from typing import List, Optional, Union


def _normalize_allergy_name(
    allergy_name: str,
    allergy_rows: list[dict],
) -> str:
    allergies_by_name = {
        allergy["allergy_name"]: allergy
        for allergy in allergy_rows
    }
    allergies_by_id = {
        allergy["allergy_id"]: allergy
        for allergy in allergy_rows
    }
    allergy = allergies_by_name.get(allergy_name)
    if allergy is None or allergy["parent_allergy_id"] is None:
        return allergy_name

    parent_allergy = allergies_by_id.get(allergy["parent_allergy_id"])
    return parent_allergy["allergy_name"] if parent_allergy else allergy_name


def _group_risk_type_by_parent(
    risk_type: list[dict],
    allergy_rows: list[dict],
) -> list[dict]:
    allergies_by_name = {
        allergy["allergy_name"]: allergy
        for allergy in allergy_rows
    }
    allergies_by_id = {
        allergy["allergy_id"]: allergy
        for allergy in allergy_rows
    }
    grouped_risk_types = {}

    for risk in risk_type:
        allergy = allergies_by_name.get(risk["allergy"])
        if allergy is None:
            normalized_risk = risk.copy()
        elif allergy["parent_allergy_id"] is None:
            normalized_risk = risk.copy()
        else:
            parent_allergy = allergies_by_id.get(allergy["parent_allergy_id"])
            if parent_allergy is None:
                normalized_risk = risk.copy()
            else:
                normalized_risk = {
                    **risk,
                    "allergy": parent_allergy["allergy_name"],
                }

        existing_risk = grouped_risk_types.get(normalized_risk["allergy"])
        if existing_risk is None or (
            existing_risk["type"] != "match"
            and normalized_risk["type"] == "match"
        ):
            grouped_risk_types[normalized_risk["allergy"]] = normalized_risk

    return list(grouped_risk_types.values())


def _replace_detected_ingredient_allergies_with_parent(
    detected_ingredients: list[dict],
    allergy_rows: list[dict],
) -> list[dict]:
    allergies_by_name = {
        allergy["allergy_name"]: allergy
        for allergy in allergy_rows
    }
    allergies_by_id = {
        allergy["allergy_id"]: allergy
        for allergy in allergy_rows
    }
    normalized_ingredients = []

    for detected_ingredient in detected_ingredients:
        allergy = allergies_by_name.get(detected_ingredient["allergy"])
        if allergy is None or allergy["parent_allergy_id"] is None:
            normalized_ingredients.append(detected_ingredient)
            continue

        parent_allergy = allergies_by_id.get(allergy["parent_allergy_id"])
        if parent_allergy is None:
            normalized_ingredients.append(detected_ingredient)
            continue

        normalized_ingredients.append({
            **detected_ingredient,
            "allergy": parent_allergy["allergy_name"],
        })

    return normalized_ingredients


def _determine_risk_level(
    risk_type: list[dict],
    expiration_status: str,
    precaution_risk: bool,
    analysis_uncertain: bool,
) -> str:
    if any(risk["type"] == "match" for risk in risk_type):
        return "unsafe"
    if expiration_status == "expired":
        return "unsafe"
    if (
        expiration_status != "valid"
        or precaution_risk
        or analysis_uncertain
    ):
        return "caution"
    return "safe"


def _build_result_message(
    risk_level: str,
    risk_type: list[dict],
    expiration_status: str,
    expiration_elapsed_days: Optional[int],
    precaution_risk: bool,
    analysis_uncertain: bool,
) -> str:
    if risk_level == "unsafe":
        matched_allergies = [
            risk["allergy"]
            for risk in risk_type
            if risk["type"] == "match"
        ]
        if matched_allergies:
            return (
                f"{', '.join(matched_allergies)} 알레르기 관련 성분이 확인되어 "
                "섭취에 위험이 있습니다."
            )
        if expiration_elapsed_days is not None:
            return (
                f"소비기한이 {expiration_elapsed_days}일 경과하여 "
                "섭취하지 않는 것이 안전합니다."
            )
        return "소비기한이 지나 섭취하지 않는 것이 안전합니다."

    if risk_level == "safe":
        return (
            "알레르기 및 개인 주의사항 관련 위험 요소가 확인되지 않았고 "
            "소비기한도 지나지 않았습니다."
        )

    reasons = []
    if expiration_status == "not_displayed":
        reasons.append("소비기한이 표시되지 않았습니다")
    elif expiration_status != "valid" and expiration_status != "expired":
        reasons.append("소비기한 정보를 확인할 수 없습니다")
    if precaution_risk:
        reasons.append("사용자 개인 주의사항과 관련된 성분이 확인되었습니다")
    if analysis_uncertain:
        reasons.append("알레르기 또는 원료/성분 정보가 불충분합니다")

    return f"{', '.join(reasons)}. 안전 여부를 확정할 수 없어 섭취에 주의가 필요합니다."


def _build_expiration_reason(
    expiration_status: str,
    expiration_date: str,
    days_after_manufacture_date: str,
    expiration_elapsed_days: Optional[int],
) -> str:
    if expiration_status == "not_displayed":
        return "입력된 소비기한이 없어 소비기한 미표시로 판정했습니다."
    if expiration_status == "unknown":
        return "소비기한을 일수로 계산할 수 없어 소비기한 상태를 확인할 수 없습니다."
    if expiration_status == "expired" and expiration_elapsed_days is not None:
        return (
            f"제조일부터 {days_after_manufacture_date}일이 지났고 소비기한은 "
            f"{expiration_date}일이므로 {expiration_elapsed_days}일 초과했습니다."
        )
    if expiration_status == "valid":
        remaining_days = int(expiration_date) - int(days_after_manufacture_date)
        if remaining_days == 0:
            return "제조일부터 경과한 일수가 소비기한과 같아 소비기한 당일입니다."
        return (
            f"제조일부터 {days_after_manufacture_date}일이 지났고 소비기한은 "
            f"{expiration_date}일이므로 소비기한 이내입니다 "
            f"({remaining_days}일 남음)."
        )
    return "소비기한 판정에 필요한 입력 정보가 부족합니다."


async def getAiAnswer(ask: AskOfEating, db: AsyncSession):
    #1단계 데이터 양식 맞추기

    today = date.today()
    food_name = ask.food_name
    if not food_name:
        return
    manufacture_date = ask.manufacture_date or today
    expiration_date = parse_duration(ask.expiration_date) or ask.expiration_date or "없음"
    #소비기한을 무조건 n일로 표현하기 위해서 양식을 맞춰준다.
    convert_dateformatstr_to_date = try_parse_date(expiration_date)
    if(convert_dateformatstr_to_date != False):
        expiration_date = str(max(0, (convert_dateformatstr_to_date - manufacture_date).days))
    
    allergies = ask.allergies or "없음"
    if(allergies == []):
        allergies = "없음"
    consumption_amount = ask.consumption_amount or "미입력"
    ingredients = ask.ingredients or "없음"
    if(ingredients == []):
        ingredients = "없음"
    days_after_manufacture_date = str(max(0, (today - manufacture_date).days))

    precaution = ask.precautions or "없음"
    if(precaution == []):
        precaution = "없음"
    if(precaution != "없음"):
        precautions = [f"{i+1}. {val}" for i, val in enumerate(precaution)]
        precaution = "\n".join(precautions)


# 소비기한 판정 결과 계산
# expiration_date: 소비기한 일수 또는 "없음"
# days_after_manufacture_date: 제조일부터 경과한 일수 문자열

    expiration_elapsed_days = None

    if expiration_date == "없음":
        expiration_status = "not_displayed"
    else:
        try:
            expiration_days = int(expiration_date)
            elapsed_days = int(days_after_manufacture_date)

            expiration_elapsed_days = elapsed_days - expiration_days

            if expiration_elapsed_days > 0:
                expiration_status = "expired"
            else:
                expiration_status = "valid"

        except (TypeError, ValueError):
            expiration_status = "unknown"
            expiration_elapsed_days = None



    #2단계 전처리

    def format_ingredients(
        values: Union[List[Union[str, Ingredient]], str],
    ) -> str:
        if not isinstance(values, list):
            return values
        return ", ".join(
            (
                f"{ingredient.name} ({ingredient.amount.strip()})"
                if ingredient.amount and ingredient.amount.strip()
                else ingredient.name
            )
            if isinstance(ingredient, Ingredient)
            else ingredient
            for ingredient in values
        )

    ingredients_input = format_ingredients(ingredients)

    pre_processed_dict = await data_pre_processing(
        db=db,
        allergies=allergies,
        ingredients=ingredients_input, 
        expiration_date=expiration_date, 
        food_name=food_name
    ) or {}

    print(f"알레르기 정보, 원료/성분 전처리에 의한 json: {pre_processed_dict}")

    if pre_processed_dict.get("success") is False:
        return pre_processed_dict
    if pre_processed_dict.get("error"):
        return pre_processed_dict

    allergies = pre_processed_dict.get("allergies", allergies)
    ingredients = pre_processed_dict.get("ingredients", ingredients)
    ingredients_input = format_ingredients(ingredients)
    #expiration_date = pre_processed_dict.get("expiration_date", expiration_date)

    question = f"""
    # 입력 데이터

    * 식품명: {food_name}
    * 제조일자: {manufacture_date or "없음"}
    * 소비기한(일 수): {expiration_date}
    * 제조일로부터 경과일: {days_after_manufacture_date}
    * 소비기한 판정 결과: {expiration_status}
    * 소비기한 경과일: {
        expiration_elapsed_days
        if expiration_elapsed_days is not None
        else "없음"
    }
    * 섭취량: {consumption_amount}
    * 사용자의 알레르기 정보: {allergies}
    * 원료/성분: {ingredients_input}
    * 사용자 개인 주의사항: {precaution}
    """


    tryCount = 1
    while(True):
        try:
            answer_text = await run_in_threadpool(
                retry_ask,
                try_count=2,
                max_tokens=2500,
                question=question,
                system_prompt=FIXED_SYSTEM_PROMPT,
                target_model="openai/gpt-6-luna",
            )
            answer = json.loads(answer_text)
            print(answer)
            if not isinstance(answer, dict):
                raise ValueError("AI 응답이 JSON 객체가 아닙니다.")
            answer.pop("risk_level", None)
            answer.pop("result_message", None)
            if not isinstance(answer.get("detected_ingredients"), list):
                raise ValueError("detected_ingredients가 배열이 아닙니다.")
            if not isinstance(answer.get("risk_type"), list):
                raise ValueError("risk_type이 배열이 아닙니다.")
            if not isinstance(answer.get("uncertain_allergies"), list):
                raise ValueError("uncertain_allergies가 배열이 아닙니다.")
            for reason_field in ("allergy_reason", "precaution_reason"):
                if not isinstance(answer.get(reason_field), str):
                    raise ValueError(f"{reason_field}가 문자열이 아닙니다.")
            for boolean_field in ("precaution_risk", "analysis_uncertain"):
                boolean_value = answer.get(boolean_field)
                if isinstance(boolean_value, str):
                    normalized_value = boolean_value.strip().lower()
                    if normalized_value in {"true", "false"}:
                        answer[boolean_field] = normalized_value == "true"
                if not isinstance(answer.get(boolean_field), bool):
                    raise ValueError(f"{boolean_field}가 boolean이 아닙니다.")

            for risk in answer["risk_type"]:
                if (
                    not isinstance(risk, dict)
                    or not isinstance(risk.get("allergy"), str)
                    or risk.get("type") not in {"match", "unmatch"}
                ):
                    raise ValueError("risk_type 항목 형식이 올바르지 않습니다.")
            for ingredient in answer["detected_ingredients"]:
                if (
                    not isinstance(ingredient, dict)
                    or not isinstance(ingredient.get("ingredient"), str)
                    or not isinstance(ingredient.get("allergy"), str)
                ):
                    raise ValueError(
                        "detected_ingredients 항목 형식이 올바르지 않습니다."
                    )
            if not all(
                isinstance(allergy_name, str)
                for allergy_name in answer["uncertain_allergies"]
            ):
                raise ValueError("uncertain_allergies 항목 형식이 올바르지 않습니다.")

            print(f"ai 응답 메시지: {answer}")
            expected_allergies = (
                allergies
                if isinstance(allergies, list)
                else [
                    allergy.strip()
                    for allergy in allergies.split(",")
                    if allergy.strip() and allergy.strip() != "없음"
                ]
            )
            if (
                expected_allergies
                or answer["risk_type"]
                or answer["detected_ingredients"]
                or answer["uncertain_allergies"]
            ):
                allergy_result = await get_all_allergies(db)
                if not allergy_result.get("success"):
                    return allergy_result
                allergy_rows = allergy_result["data"]
                answer["risk_type"] = _group_risk_type_by_parent(
                    answer["risk_type"],
                    allergy_rows,
                )
                if answer["detected_ingredients"]:
                    answer["detected_ingredients"] = (
                        _replace_detected_ingredient_allergies_with_parent(
                            answer["detected_ingredients"],
                            allergy_rows,
                        )
                    )
                expected_allergies = {
                    _normalize_allergy_name(name, allergy_rows)
                    for name in expected_allergies
                }
                assessed_allergies = {
                    risk["allergy"] for risk in answer["risk_type"]
                }
                uncertain_allergies = {
                    _normalize_allergy_name(name, allergy_rows)
                    for name in answer["uncertain_allergies"]
                }
                missing_allergies = (
                    expected_allergies - assessed_allergies - uncertain_allergies
                )
                if missing_allergies:
                    answer["uncertain_allergies"].extend(sorted(missing_allergies))
                    answer["analysis_uncertain"] = True
            analysis_uncertain = (
                answer["analysis_uncertain"]
                or bool(answer["uncertain_allergies"])
                or (allergies != "없음" and not answer["risk_type"])
            )
            answer["analysis_uncertain"] = analysis_uncertain
            if precaution == "없음":
                answer["precaution_risk"] = False
            answer["risk_level"] = _determine_risk_level(
                risk_type=answer["risk_type"],
                expiration_status=expiration_status,
                precaution_risk=answer["precaution_risk"],
                analysis_uncertain=analysis_uncertain,
            )
            answer["result_message"] = _build_result_message(
                risk_level=answer["risk_level"],
                risk_type=answer["risk_type"],
                expiration_status=expiration_status,
                expiration_elapsed_days=expiration_elapsed_days,
                precaution_risk=answer["precaution_risk"],
                analysis_uncertain=analysis_uncertain,
            )
            if precaution == "없음":
                answer["precaution_reason"] = (
                    "사용자 개인 주의사항이 입력되지 않아 관련 위험이 없습니다."
                )
            answer["reasoning"] = {
                "allergy": answer.pop("allergy_reason"),
                "expiration": _build_expiration_reason(
                    expiration_status=expiration_status,
                    expiration_date=expiration_date,
                    days_after_manufacture_date=days_after_manufacture_date,
                    expiration_elapsed_days=expiration_elapsed_days,
                ),
                "precautions": answer.pop("precaution_reason"),
            }
            return answer
        except (json.JSONDecodeError, TypeError, ValueError, KeyError) as error:
            if(tryCount < 2):
                print(f"ai 응답 처리에 문제가 발생 ({error}). 재시도 합니다.")
                tryCount += 1
            else:
                print("너무 많이 ai 응답 처리에 실패하여 요청을 종료 합니다")
                return {
                    "success": False,
                    "message": "AI 응답 처리에 실패했습니다.",
                }