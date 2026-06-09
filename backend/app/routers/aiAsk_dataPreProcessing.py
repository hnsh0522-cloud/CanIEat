import json
from app.api.aiAsk_aiAPI import retry_ask

def data_pre_processing(allergy, ingredients, food_name, expiration_date="없음"):
    """데이터 전처리 함수
    각 단계별 전처리에 관한 요청을 문자열로 서서히 추가해서 최종 요청을 ai에 넘겨서 응답을 받아서 dict로 넘긴다.
    """

    # 💡 중요: AI가 JSON 외의 딴소리를 하지 못하도록 프롬프트를 보강합니다.
    default_question = (
        "각 단계를 순서대로 처리를 한 뒤 JSON 형태로 반환해줘. "
        "다른 설명이나 인사말은 절대 하지 말고, 오직 마크다운 문법도 없는 순수한 JSON 문자열만 출력해줘. "
        "json의 키와 값은 각 단계를 참고하면 돼."
    )
    
    allergy_question = ""
    ingredients_question = ""
    expiration_date_question = ""
    step = 1

    if allergy != "없음":
        allergy_question = f"{step}단계) {allergy}이랑 식품 성분적으로 포함 관계나 관련 관계에 있어서 똑같은 알레르기 반응을 일으킬 수 있는 다른 성분들을 정리해서 기존 {allergy}에 추가해서 값으로 넣어줘, 키는 'allergy'이고 값은 JSON 배열(List) 형태야. 배열 안의 값은 한글로 들어가야 하고 원래 내가 줬던 값들인 {allergy} 들을 포함시켜야 해.\n"
        step += 1
        
    if ingredients == "없음":
        ingredients_question = f"{step}단계) 식품명이 '{food_name}'인 것이랑 관련해서 {food_name} 식품에 들어갈 수 있는 성분/원료를 값으로 넣어줘, 키는 'ingredients'이고 값은 JSON 배열(List) 형태야. 배열 안의 값은 한글로 들어가야 해.\n"
        step += 1
        
    # if expiration_date == "없음":
    #     if ingredients == "없음":
    #         expiration_date_question = f"{step}단계) '{food_name}' 식품이라는 것과 이전 단계에서 'ingredients' 키에 넣은 원료/성분 값을 참고해서 소비기한을 추정해서 값으로 넣어줘, 키는 'expiration_date'이고 값은 문자열이야. 값의 형태는 예시를 참고해서 넣어줘. (예시: 제조일로부터 45일까지)\n"
    #     else:
    #         expiration_date_question = f"{step}단계) '{food_name}' 식품이라는 것과 원료/성분이 '{ingredients}' 라는 것을 참고해서 소비기한을 추정해서 값으로 넣어줘, 키는 'expiration_date'이고 값은 문자열이야. 값의 형태는 예시를 참고해서 넣어줘. (예시: 제조일로부터 45일까지)\n"
    #     step += 1


    if(step > 1):
    # 앞서 배웠던 삼중 따옴표를 활용한 가독성 높은 프롬프트 조립
        question = f"""{default_question}

    {allergy_question}{ingredients_question}"""

        # AI 호출 (groq에서 gpt oss 120b가 제일 하루 사용량이나 모델 성능이 괜찮다.)
        answer = retry_ask(try_count=2, question=question, max_tokens=1024, target_model="groq-gpt")

        # 💡 텍스트로 온 AI 답변을 파이썬 딕셔너리로 변환하여 반환
        try:
            # 혹시 AI가 앞뒤로 ```json ... ``` 같은 마크다운을 붙였을 때를 대비해 정형화 처리
            if "```json" in answer:
                answer = answer.split("```json")[1].split("```")[0].strip()
            elif "```" in answer:
                answer = answer.split("```")[1].split("```")[0].strip()
                
            result_dict = json.loads(answer.strip())
            return result_dict
        except json.JSONDecodeError as e:
            print(f"JSON 파싱 실패! AI가 보낸 원본 데이터: {answer}")
            # 예외 상황 발생 시 디버깅을 위해 원본 문자열이나 빈 딕셔너리 반환
            return {"error": "파싱 실패", "raw_response": answer}