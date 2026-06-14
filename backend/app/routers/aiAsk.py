from fastapi import APIRouter, HTTPException
from datetime import date
from app.utils.parse_date import parse_duration, try_parse_date
from app.api.aiAsk_aiAPI import retry_ask
from app.routers.aiAsk_dataPreProcessing import data_pre_processing
from app.schemas.askOfEating import AskOfEating
import json


router = APIRouter(
    prefix="/aiAsk",
    tags=["ask_process"]
)

@router.post("/canIEat")
#요청 body 예시 데이터
#food_name=필수, 나머지는 선택, manufacture의 기본값=오늘
# data = {
#     "food_name": "초코우유",
#     "manufacture_date": "2026-05-20",
#     "expiration_date": "제조일로부터 1주일",
#     "allergy": ["우유"],
#     "ingredients": ["우유", "초코"]
# }
def ask_ai(ask: AskOfEating):
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
    ingredients = ask.ingredients or "없음"
    if(ingredients == []):
        ingredients = "없음"
    days_after_manufacture_date = str(max(0, (today - manufacture_date).days))
    json_schema = """
    {
    "risk_level": "safe | caution | unsafe",
    "detected_ingredients": "없음 또는 알레르기 성분",
    "risk_type": "match | unmatch",
    "result_message": "판단 이유를 포함한 사용자 안내 메시지"
    }
    """

    #2단계 전처리

    # data_pre_processing 호출 전, 리스트를 문자열로 명확히 변환해주는 것이 좋습니다.
    allergies_input = ", ".join(allergies) if isinstance(allergies, list) else allergies
    ingredients_input = ", ".join(ingredients) if isinstance(ingredients, list) else ingredients

    pre_processed_dict = data_pre_processing(
        allergy=allergies_input, 
        ingredients=ingredients_input, 
        expiration_date=expiration_date, 
        food_name=food_name
    ) or {}

    print(f"알레르기 정보, 원료/성분 전처리에 의한 json: {pre_processed_dict}")

    allergies = pre_processed_dict.get("allergy", allergies)
    ingredients = pre_processed_dict.get("ingredients", ingredients)
    #expiration_date = pre_processed_dict.get("expiration_date", expiration_date)

    question = f"""

    # 역할 정의
    너는 입력된 식품 정보를 바탕으로 규칙에 따라 사용자의 식품 섭취 안전성을 판단하여 오직 지정된 JSON 포맷으로만 응답하는 데이터 처리 API 인터페이스다.

    # 입력 데이터
    * 식품명: {food_name}
    * 제조일자: {manufacture_date or "없음"}
    * 소비기한(일 수): {expiration_date}
    * 제조일로부터 경과일: {days_after_manufacture_date}
    * 사용자의 알레르기 정보: {allergies}
    * 원료/성분: {ingredients}

    # 실행 규칙 및 판정 단계 (순서대로 수행할 것)

    ## 1단계: 알레르기 성분 판단
    - [조건 A] '원료/성분'에 '사용자의 알레르기 정보'와 관련된 성분이 포함되어 있어서 알레르기를 일으킬 수 있는가?
    - YES: risk_level = "unsafe", risk_type = "match", detected_ingredients = [감지된 성분명]
    - NO: risk_type = "unmatch", detected_ingredients = "없음"

    ## 2단계: 소비기한 및 식품 위험도 판단
    - [조건 B] '소비기한'이 "없음"인가?
    - YES: 소비기한 관련 risk_level = "caution"
    - NO: 아래 공식에 따라 '소비기한 경과일'을 계산하고 식품 분류 규칙을 적용한다.
        ※ 공식: 소비기한 경과일 = 제조일로부터 경과일 - 소비기한

    - [소비기한 경과일 기준 식품 분류 규칙]
    - 소비기한 경과일 <= 0 이면 무조건: risk_level = "safe"
    - 소비기한 경과일 > 0 이면 아래 분류에 따름:
        1. 고위험 식품 (우유, 유제품, 생고기, 생선, 회, 도시락, 샌드위치, 김밥, 즉석섭취식품 등)
        - 0 < 소비기한 경과일 <= 1: risk_level = "caution"
        - 소비기한 경과일 > 1: risk_level = "unsafe"
        2. 중위험 식품 (빵, 떡, 두부, 햄, 소시지, 치즈 등)
        - 0 < 소비기한 경과일 <= 3: risk_level = "caution"
        - 소비기한 경과일 > 3: risk_level = "unsafe"
        3. 저위험 식품 (과자, 라면, 시리얼, 통조림, 건조식품, 조미료 등)
        - 0 < 소비기한 경과일 <= 30: risk_level = "caution"
        - 소비기한 경과일 > 30: risk_level = "unsafe"

    ## 3단계: 최종 판정 우선순위 (가장 중요)
    아래 우선순위 규칙에 따라 최종 `risk_level`을 확정한다.
    - 우선순위 1: 1단계에서 알레르기 유발 성분이 감지([조건 A]가 YES)되었다면, 소비기한에 상관없이 최종 risk_level은 무조건 "unsafe" 이다.
    - 우선순위 2: 2단계에서 최종 결정된 risk_level이 "unsafe" 이면 최종 "unsafe" 이다.
    - 우선순위 3: 2단계에서 최종 결정된 risk_level이 "caution" 이면 최종 "caution" 이다.
    - 우선순위 4: 위의 위험 요소가 전혀 없다면 최종 "safe" 이다.

    # 출력 요구사항
    - result_message에는 최종 판정 이유를 핵심만 명확하게 한 문장으로 설명한다.
    - 반드시 아래의 JSON 포맷만 출력하라. 
    - 인사말, 마크다운 코드 블록(```json ```), 서론, 결론, 부연설명은 절대 출력하지 말고 오직 중괄호로 시작해서 중괄호로 끝나는 순수 JSON 문자열만 반환하라.

    # 출력 JSON 포맷:
    {json_schema}
    """

    isNotJson = True
    while(isNotJson):
        try:
            answer = json.loads(retry_ask(try_count=2, max_tokens=2048, question=question))
            isNotJson = False
        except:
            pass

    return answer