import json
from typing import List, Union
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.aiAsk_aiAPI import retry_ask
from app.crud.allergy_crud import (
    get_allergies_by_parent_allergy_id,
    get_allergy_by_name,
)


async def data_pre_processing(
    db: AsyncSession,
    allergies: Union[List[str], str],
    ingredients: str,
    food_name: str,
    expiration_date: str = "없음",
):
    """데이터 전처리 함수
    각 단계별 전처리에 관한 요청을 문자열로 서서히 추가해서 최종 요청을 ai에 넘겨서 응답을 받아서 dict로 넘긴다.
    """

    # 💡 중요: AI가 JSON 외의 딴소리를 하지 못하도록 프롬프트를 보강합니다.
    default_question = (
        "다른 설명이나 인사말은 절대 하지 말고, 오직 마크다운 문법도 없는 순수한 JSON 문자열만 출력해줘. "
        "json의 키와 값은 아래 요청을 참고하면 돼."
    )
    
    ingredients_question = ""
    step = 1

    if allergies != "없음":
        allergy_names = (
            [name.strip() for name in allergies.split(",") if name.strip()]
            if isinstance(allergies, str)
            else allergies
        )
        expanded_allergies = []

        for allergy_name in allergy_names:
            allergy_result = await get_allergy_by_name(db, allergy_name)
            if not allergy_result.get("success"):
                return allergy_result

            parent_allergy = allergy_result["data"]
            expanded_allergies.append(parent_allergy["allergy_name"])

            child_result = await get_allergies_by_parent_allergy_id(
                db,
                parent_allergy["allergy_id"],
            )
            if not child_result.get("success"):
                return child_result

            expanded_allergies.extend(
                child["allergy_name"] for child in child_result["data"]
            )

        allergies_value = list(dict.fromkeys(expanded_allergies))
    else:
        allergies_value = "없음"
        
    if ingredients == "없음":
        ingredients_question = f"식품명이 '{food_name}'인 것이랑 관련해서 {food_name} 식품에 들어갈 수 있는 성분/원료를 값으로 넣어줘, 키는 'ingredients'이고 값은 JSON 배열(List) 형태야. 배열 안의 값은 한글로 들어가야 해.\n"
        step += 1
        
    # if expiration_date == "없음":
    #     if ingredients == "없음":
    #         expiration_date_question = f"{step}단계) '{food_name}' 식품이라는 것과 이전 단계에서 'ingredients' 키에 넣은 원료/성분 값을 참고해서 소비기한을 추정해서 값으로 넣어줘, 키는 'expiration_date'이고 값은 문자열이야. 값의 형태는 예시를 참고해서 넣어줘. (예시: 제조일로부터 45일까지)\n"
    #     else:
    #         expiration_date_question = f"{step}단계) '{food_name}' 식품이라는 것과 원료/성분이 '{ingredients}' 라는 것을 참고해서 소비기한을 추정해서 값으로 넣어줘, 키는 'expiration_date'이고 값은 문자열이야. 값의 형태는 예시를 참고해서 넣어줘. (예시: 제조일로부터 45일까지)\n"
    #     step += 1


    result_dict = {"allergies": allergies_value}

    if step > 1:
        question = f"""{default_question}

    {ingredients_question}"""

        answer = await run_in_threadpool(
            retry_ask,
            try_count=2,
            question=question,
            max_tokens=1024,
            target_model="openai/gpt-4o-mini",
        )

        try:
            if "```json" in answer:
                answer = answer.split("```json")[1].split("```")[0].strip()
            elif "```" in answer:
                answer = answer.split("```")[1].split("```")[0].strip()
                
            ai_result = json.loads(answer.strip())
            if not isinstance(ai_result, dict):
                return {
                    **result_dict,
                    "error": "AI 응답 형식이 JSON 객체가 아닙니다.",
                    "raw_response": answer,
                }
            result_dict.update(ai_result)
            return result_dict
        except json.JSONDecodeError:
            print(f"JSON 파싱 실패! AI가 보낸 원본 데이터: {answer}")
            return {
                **result_dict,
                "error": "파싱 실패",
                "raw_response": answer,
            }

    return result_dict