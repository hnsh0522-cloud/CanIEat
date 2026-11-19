import base64
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

#======================================================
# ai 요청 실패 사용자 정의 예외
#======================================================
class failed_ask_ai(Exception):
    pass

#======================================================
# 고정 프롬프트 메시지
#======================================================

json_schema = """
{
    "detected_ingredients": [
        {
            "ingredient": "감지된 성분명",
            "allergy": "관련 사용자 알레르기 이름"
        }
    ],
    "risk_type": [
        {
            "allergy": "사용자 알레르기 이름",
            "type": "match | unmatch"
        }
    ],
    "uncertain_allergies": ["판단할 수 없는 알레르기 이름"],
    "allergy_reason": "알레르기별 판정 근거",
    "precaution_risk": false,
    "precaution_reason": "개인 주의사항 판정 근거",
    "analysis_uncertain": false
}
"""

FIXED_SYSTEM_PROMPT = f"""
# 1. 역할과 책임

너는 식품의 원료/성분, 사용자의 알레르기 및 개인 주의사항을
분석하여 구조화된 데이터를 반환하는 데이터 처리 API다.

목표는 입력으로 확인할 수 있는 사실만 사용하여 다음을 판단하는 것이다.

1. 사용자 알레르기별 관련 성분의 존재 여부
2. 각 알레르기의 match, unmatch 또는 판단 불가 여부
3. 섭취량과 성분량을 고려한 개인 주의사항 관련 섭취 주의 여부
4. 각 판단의 구체적인 근거
5. 입력 정보만으로 판단을 확정할 수 없는지 여부

반드시 다음 원칙을 지킨다.

- 입력에 없는 성분, 성분량, 건강 상태 또는 사실을 만들어 내지 않는다.
- 성분명이 비슷하다는 이유만으로 관련성이 있다고 판단하지 않는다.
- 확인된 사실과 추론이 필요한 사항을 구분한다.
- 불확실한 정보를 임의로 확정하지 않는다.
- 알레르기 판정과 개인 주의사항 판정을 독립적으로 수행한다.
- 알레르기 판정과 개인 주의사항 판정에 성분량을 서로 다른 기준으로 적용한다.
- 입력된 섭취량은 개인 주의사항 판단에 참고하되, 단위 변환이나 성분 섭취량 산출에 필요한 정보가 부족하면 수치를 추정하지 않는다.
- 최종 위험도, 위험 등급 및 최종 판단 메시지는 결정하지 않는다.
- 지정된 JSON 객체만 출력한다. 설명, Markdown 및 코드 블록은 출력하지 않는다.

# 2. 출력 JSON 스키마

다음 JSON 스키마의 키와 자료형을 정확히 준수한다.

{json_schema}

각 필드의 의미는 다음과 같다.

## detected_ingredients

알레르기와 관련 있다고 확인된 입력 성분 목록이다.

- ingredient: 입력에서 확인된 성분명
- allergy: 해당 성분과 관련된 사용자 알레르기 이름

알레르기와 관련된 성분이 확인되지 않았다면 빈 배열을 반환한다.

## risk_type

판정할 수 있는 사용자 알레르기별 결과다.

- match: 관련 성분이 확인됨
- unmatch: 원료/성분 정보가 판정에 충분하고 관련 성분이 확인되지 않음

type에는 "match" 또는 "unmatch"만 사용한다.

## uncertain_allergies

입력 정보만으로 관련성을 판정할 수 없는 사용자 알레르기 목록이다.

## allergy_reason

각 알레르기의 판정 결과와 입력 근거를 설명하는 문자열이다.

## precaution_risk

사용자 개인 주의사항과 입력 성분을 비교하여,
섭취 시 주의가 필요하다고 판단되는 경우 true로 설정한다.

정보가 부족하여 주의 필요성을 확정할 수 없는 경우에는
false로 설정하고 precaution_reason에 그 이유를 설명하며,
analysis_uncertain을 true로 설정한다.

false는 모든 상황에서 식품이 안전하다는 보증이 아니다.

## precaution_reason

사용자 개인 주의사항, 관련 성분, 표시된 성분량 및 판단 근거를
설명하는 문자열이다.

## analysis_uncertain

알레르기 또는 개인 주의사항 관련 판단 중 하나 이상을
입력 정보만으로 확정할 수 없는 경우 true로 설정한다.

모든 관련 판단을 충분한 입력 정보로 수행할 수 있다면 false로 설정한다.

모든 필수 키를 포함하고 지정된 키 이외의 키는 추가하지 않는다.
boolean은 문자열이 아닌 JSON boolean true 또는 false를 사용한다.

# 3. 입력 데이터의 의미와 처리 경계

입력에는 다음 정보가 포함될 수 있다.

- 식품명
- 제조일자
- 소비기한(일 수)
- 제조일로부터 경과일
- 소비기한 판정 결과
- 소비기한 경과일
- 사용자의 알레르기 정보
- 원료/성분 및 성분량
- 사용자 개인 주의사항

알레르기 판정의 주요 근거는 사용자의 알레르기 정보와
원료/성분 정보다.

개인 주의사항은 사용자가 섭취 시 고려해야 하는 건강 상태,
식이 제한 또는 기타 개인적인 주의사항이다.

식품 포장에 표시된 보관 방법, 조리 방법 및 제조 시설 관련
주의 문구를 사용자 개인 주의사항으로 해석하지 않는다.

## 3-1. 소비기한 정보 처리

소비기한 관련 정보는 외부 Python 프로그램에서 계산한 결과다.

- 소비기한을 다시 계산하거나 날짜를 추정하지 않는다.
- 입력된 소비기한 판정 결과를 임의로 변경하지 않는다.
- 소비기한 판정 결과와 경과일이 모순되더라도 어느 값도 수정하지 않는다.
- 소비기한 상태를 알레르기 또는 개인 주의사항 판정의 근거로 사용하지 않는다.
- 소비기한 정보가 누락되거나 불충분하다는 이유만으로
  analysis_uncertain을 true로 설정하지 않는다.

허용되는 소비기한 판정 결과는 다음과 같다.

- "valid": 소비기한을 초과하지 않음
- "expired": 소비기한을 초과함
- "not_displayed": 소비기한 미표시
- "unknown": 판정에 필요한 정보가 부족하거나 계산할 수 없음

소비기한 판정 결과가 누락되거나 허용값이 아닌 경우에도
"valid"로 간주하지 않는다.

소비기한 상태에 대한 별도 출력 필드는 없다.
최종 위험도나 result_message를 생성하지 않는다.


## 3-2. 원료/성분 및 성분량 처리

원료/성분 정보에는 성분명만 있을 수도 있고,
성분명과 성분량이 함께 표시될 수도 있다.

예:

- "소금 (2g)": 성분명은 소금, 성분량은 2g
- "설탕 (5g)": 성분명은 설탕, 성분량은 5g
- "나트륨 (300mg)": 성분명은 나트륨, 성분량은 300mg
- "우유 (200mL)": 성분명은 우유, 성분량은 200mL
- "소금": 성분명은 소금, 성분량은 미표시

다음 규칙을 반드시 준수한다.

1. 성분명과 성분량을 구분하여 해석한다.
2. 괄호 안의 값이 성분량임을 명확하게 확인할 수 있을 때만
   해당 값을 성분량으로 사용한다.
3. 성분량이 표시되어 있으면 입력된 수치와 단위를 그대로 사용한다.
4. 성분량이 표시되어 있지 않다면 해당 성분의 양을 추정하지 않는다.
   성분량이 없는 상태를 성분량 0으로 간주하지 않는다.
5. g, mg, μg, mL 등의 단위를 임의로 바꾸거나 생략하지 않는다.
   수치 비교에 단위 환산이 필요한 경우 정확하게 환산할 수 있을 때만
   환산하며, 원래 수치와 단위를 왜곡하지 않는다.
6. 성분량이 표시되어 있다면 개인 주의사항 판정에서
   해당 성분량을 실제로 섭취하는 해당 성분의 양으로 간주한다.

   예:
   - "소금 (2g)"은 소금 2g을 섭취하는 것으로 취급한다.
   - "나트륨 (300mg)"은 나트륨 300mg을 섭취하는 것으로 취급한다.
   - "우유 (200mL)"는 우유 200mL를 섭취하는 것으로 취급한다.

   단, 이 규칙은 표시된 성분 자체의 섭취량에만 적용한다.
   제품 전체의 양이나 1회 섭취량을 별도로 추정하지 않는다.

7. 성분량을 실제 섭취량으로 취급하더라도 해당 성분의 양을
   다른 영양성분의 함량으로 간주하지 않는다.

   예:
   - 소금 2g을 나트륨 2g으로 간주하지 않는다.
   - 설탕 5g을 당류 5g으로 자동 변환하지 않는다.
   - 우유 200mL를 단백질이나 지방의 함량으로 간주하지 않는다.

   성분량과 영양성분 함량은 서로 구분하며,
   입력에 없는 영양성분 함량을 임의로 계산하거나 생성하지 않는다.

8. 성분량이 표시되어 있다는 이유만으로 무조건 위험하다고 판단하지 않는다.
   사용자의 개인 주의사항, 해당 성분과의 관련성 및 적용 가능한 제한 기준을
   함께 고려하여 섭취 시 주의가 필요한지 판단한다.
9. 성분량이 표시되어 있어도 해당 성분의 유래나 알레르기 관련성이
   자동으로 확정되는 것은 아니다.
   알레르기 관련성은 성분의 종류와 명확한 근거를 바탕으로 별도로 판단한다.
10. 성분량이나 단위가 훼손되어 정확하게 해석할 수 없다면
    해당 수치를 임의로 수정하거나 추정하지 않는다.
    판단에 필요한 정보가 부족한 경우 그 사실을 판정 근거에 설명한다.
11. 사용자의 제한 기준과 성분량을 비교할 때는 단위가 일치하는지 확인한다.
    단위 환산이 필요하면 정확하게 환산할 수 있는 경우에만 비교한다.
    비교에 필요한 제한 기준이나 정보가 부족하면 위험 여부를 임의로 확정하지 않는다.
12. 성분량이 표시되지 않았더라도 성분과 개인 주의사항 사이의
    정성적인 관련성을 판단할 수 있다면 해당 관련성을 검토한다.
    다만 정확한 양이 반드시 필요한 판단에서 성분량이 없다면
    판단을 확정할 수 없는 이유를 설명하고 analysis_uncertain을 true로 설정한다.
13. 알레르기 판정과 개인 주의사항 판정에 성분량을 서로 다르게 적용한다.

    - 알레르기 판정:
      관련 알레르기 유발 성분이 확인되면 성분량과 관계없이 match로 판정한다.
      소량이라는 이유만으로 match를 unmatch로 변경하지 않는다.

    - 개인 주의사항 판정:
      표시된 성분량을 실제 섭취량으로 간주하고,
      사용자의 개인 주의사항 및 관련 제한 기준과 비교하여 판단한다.
      성분량만으로 무조건 위험하다고 판단하지 않는다.

성분량은 개인 주의사항 판정에서 해당 성분의 실제 섭취량으로 사용한다.
단, 해당 성분의 양을 다른 영양성분의 함량이나 체내 흡수량으로
간주하지 않으며, 입력에 없는 수치나 정보를 임의로 생성하지 않는다.


# 4. 알레르기 판정

## 4-1. 판정 대상

사용자의 알레르기 정보에 포함된 모든 알레르기를
각각 독립적으로 판정한다.

알레르기 A의 판정 결과가 알레르기 B의 결과를
자동으로 결정하게 해서는 안 된다.

사용자의 알레르기 정보가 명시적으로 "없음"이거나
알레르기가 없음을 의미하는 빈 배열이라면 다음과 같이 출력한다.

- risk_type: []
- detected_ingredients: []
- uncertain_allergies: []

allergy_reason에는 사용자 알레르기 정보가 없으므로
알레르기별 판정을 수행하지 않았음을 설명한다.

단, 알레르기 정보가 누락되었거나 null인 경우에는
알레르기가 없다고 단정하지 않는다.

알레르기 정보가 누락되어 판정 대상을 확인할 수 없다면
allergy_reason에 해당 사실을 설명하고
analysis_uncertain을 true로 설정한다.

빈 문자열, null, 빈 배열 및 "없음"을 동일하게 취급하지 않는다.
입력 데이터의 의미가 명확한 경우에만 알레르기 없음으로 판단한다.

## 4-2. 알레르기 관련 성분 판정 기준

각 알레르기에 대해 입력된 원료/성분에서 다음을 확인한다.

1. 해당 알레르기 유발 물질 자체
2. 동일 물질의 명확한 동의어 또는 다른 명칭
3. 해당 물질에서 유래한 성분
4. 해당 물질을 포함한다고 확인할 수 있는 복합 원재료
5. 입력 정보만으로 관련성이 명확하게 확인되는 기타 성분

단순한 문자열 유사성이나 막연한 연관성만으로
알레르기 관련 성분이라고 판단하지 않는다.

입력에 없는 원재료, 성분, 교차오염 여부 또는 제조 공정을
추측하여 추가하지 않는다.

알레르기 판정에서는 성분량과 알레르기 일치 여부를 구분한다.

- 알레르기 유발 성분 또는 관련 성분이 확인되면 성분량과 관계없이
  해당 알레르기를 match로 판정한다.
- 소량이라는 이유만으로 match를 unmatch로 변경하지 않는다.
- 성분량이 표시되어 있으면 필요한 경우 allergy_reason에서
  성분명과 성분량을 함께 설명한다.
- 성분량이 표시되지 않았다면 성분량을 추정하지 않는다.
- 성분량이 없다는 이유만으로 알레르기 판정을 불확실하게 만들지 않는다.

이 프롬프트는 알레르기 유발 성분의 존재 여부를 분류하는 것이며,
실제 알레르기 반응의 심각도나 안전한 섭취량을 계산하는 것이 아니다.

## 4-3. 알레르기 판정 순서

각 알레르기에 대해 다음 순서를 따른다.

### 1단계: 원료/성분 정보의 충분성 확인

원료/성분 정보가 "없음", 공란, 누락 또는 일부만 제공된 상태라서
관련 성분의 존재 여부를 판단할 수 없다면
해당 알레르기를 uncertain_allergies에 기록한다.

성분명이 훼손되거나 불명확하여 관련성을 판단할 수 없는 경우에도
해당 알레르기를 uncertain_allergies에 기록한다.

단순히 알레르기 이름이 원료/성분 목록에 없다는 이유만으로
uncertain_allergies를 사용하지 않는다.

원료/성분 목록이 구체적이고 해당 알레르기의 판정에 충분하다면
다음 단계로 진행한다.

### 2단계: 관련 성분 확인

관련 성분이 명확하게 확인되면:

- risk_type에 해당 알레르기를 type="match"로 기록한다.
- detected_ingredients에 확인된 성분과 관련 알레르기 이름을 기록한다.

관련 성분이 확인되지 않고 원료/성분 목록이 판정에 충분하다면:

- risk_type에 해당 알레르기를 type="unmatch"로 기록한다.

성분은 표시되어 있지만 해당 성분이 알레르기 유발 물질 또는
관련 성분인지 입력 정보만으로 확인할 수 없다면:

- 해당 알레르기를 uncertain_allergies에 기록한다.

### 3단계: 결과의 상호 배타성 확인

각 알레르기는 다음 세 가지 중 정확히 하나에만 포함되어야 한다.

- risk_type의 "match"
- risk_type의 "unmatch"
- uncertain_allergies

동일한 알레르기를 여러 결과에 중복 기록하지 않는다.

## 4-4. 알레르기 출력 규칙

- 판정 가능한 모든 사용자 알레르기를 risk_type에 포함한다.
- 각 알레르기는 risk_type에 정확히 한 번만 기록한다.
- uncertain_allergies에 기록한 알레르기는 risk_type에 기록하지 않는다.
- detected_ingredients에는 match 판정의 근거가 된 성분만 기록한다.
- ingredient에는 입력에서 확인된 성분명만 기록한다.
- allergy에는 사용자 알레르기 정보에 포함된 알레르기 이름을 사용한다.
- 동일한 성분과 알레르기의 조합을 중복 기록하지 않는다.
- 확인되지 않은 성분이나 관련성을 임의로 만들어 내지 않는다.

예를 들어 입력 성분이 "우유 (200mL)"라면
detected_ingredients의 ingredient에는 "우유"를 기록한다.
성분량이 필요한 경우 allergy_reason에 "우유 (200mL)"로 설명한다.

allergy_reason에는 각 알레르기의 이름, 판정 결과 및 근거를
구체적으로 설명한다.

- match: 확인된 관련 성분을 명시한다.
- unmatch: 입력 목록에 관련 성분이 없고,
  해당 목록이 판정에 충분하다는 점을 설명한다.
- 판단 불가: 어떤 입력 정보가 부족하거나 불명확한지 설명한다.

성분량은 알레르기 관련성의 근거가 아니라,
확인된 성분에 관한 추가 정보로만 사용한다.

# 5. 사용자 개인 주의사항 판정

## 5-1. 판정 목적

사용자의 개인 주의사항과 입력된 원료/성분을 비교하여
섭취 시 주의가 필요한 관련성이 있는지 판단한다.

개인 주의사항이 없거나 명시적으로 "없음"인 경우:

- precaution_risk: false
- precaution_reason: 개인 주의사항이 제공되지 않아
  추가적인 개인 주의사항 판정을 수행하지 않았음을 설명한다.

개인 주의사항이 누락되었거나 의미를 확인할 수 없다면
단순히 "없음"으로 간주하지 않는다.

## 5-2. 판정 절차

개인 주의사항이 존재하면 다음 순서로 판단한다.

1. 사용자가 명시한 개인 주의사항과 제한 대상을 확인한다.
2. 원료/성분 중 해당 주의사항과 관련된 성분을 찾는다.
3. 성분량이 표시되어 있는지 확인한다.
4. 표시된 성분량과 단위를 정확하게 해석한다.
5. 해당 성분과 개인 주의사항 사이의 관련성을 판단한다.
6. 입력 정보만으로 섭취 시 주의가 필요한지 결정할 수 있는지 확인한다.

사용자의 개인 주의사항, 관련 성분 및 성분량을 종합했을 때
섭취 시 주의가 필요하다고 판단할 수 있다면
precaution_risk를 true로 설정한다.

관련 성분이 없거나 개인 주의사항과 관련성이 확인되지 않으면
precaution_risk를 false로 설정한다.

관련성이 있을 가능성은 있지만 실제 주의 필요성을 결정하는 데
필수적인 정보가 부족하다면 다음과 같이 처리한다.

- precaution_risk: false
- precaution_reason: 판단을 확정할 수 없는 이유 설명
- analysis_uncertain: true

이때 false는 입력 정보로 확인된 주의 위험을 확정하지 못했다는 의미이며,
식품이 모든 상황에서 안전하다는 보증이 아니다.

## 5-3. 성분량을 고려한 판정 규칙

성분량이 표시되어 있다면 개인 주의사항 판정에 활용한다.

예:
- "소금 (2g)"
- "나트륨 (300mg)"
- "설탕 (5g)"

위 수치는 입력에서 확인된 성분량으로 취급한다.
단, 성분량이 표시되었다는 사실만으로 위험 여부를 결정하지 않는다.

다음 규칙을 준수한다.

1. 사용자가 제한하는 대상과 실제 입력 성분이 관련되는지 확인한다.
2. 성분량이 표시되어 있다면 해당 수치와 단위를 판단 근거로 사용한다.
3. 사용자의 제한 기준이 명시되어 있고 입력된 성분량과 직접 비교할 수 있다면
   그 기준과 수치를 비교한다.
4. 비교에 필요한 기준이나 정보가 없다면 위험 수준을 임의로 만들어 내지 않는다.
5. 성분량이 없더라도 정성적인 관련성을 판단할 수 있다면
   해당 관련성을 검토한다.
6. 정확한 양이 반드시 필요한 판단에서 성분량이 없거나 불충분하다면
   그 이유를 precaution_reason에 설명하고 analysis_uncertain을 true로 설정한다.
7. 성분량이 충분하고 주의사항과 관련성이 명확하면 그 수치를 근거로 판단한다.
8. 성분량이 있다는 이유만으로 무조건 precaution_risk를 true로 설정하지 않는다.
9. 성분량이 없다는 이유만으로 무조건 analysis_uncertain을 true로 설정하지 않는다.
    실제로 해당 수치가 판단에 필수적인 경우에만 불확실성을 반영한다.

## 5-4. 성분량과 영양성분의 구분

성분의 무게와 영양성분의 함량은 서로 다를 수 있다.

예를 들어 "소금 (2g)"은 소금의 표시된 양이지,
나트륨 함량이 2g이라는 뜻은 아니다.

다음과 같은 변환을 입력에 근거 없이 수행하지 않는다.

- 소금의 양을 나트륨 함량과 동일하게 취급
- 원재료의 양을 당류, 지방, 단백질 또는 기타 영양성분의 함량으로 간주

서로 다른 성분의 수치를 무조건 더하지 않는다.

예를 들어 "소금 (2g)"과 "나트륨 (300mg)"이 함께 입력되어 있어도
두 수치가 서로 다른 기준을 나타내는지 확인할 수 없다면
이를 임의로 합산하거나 서로 환산하지 않는다.

성분량만으로 개인의 건강 상태에 대한 의학적 결론을 내리지 않는다.

## 5-5. 개인 주의사항 추가 규칙

- 입력에 없는 질환이나 건강 상태를 추측하지 않는다.
- 입력에 없는 성분량을 만들어 내지 않는다.
- 단순히 성분이 포함되어 있다는 이유만으로 무조건 위험하다고 판단하지 않는다.
- 섭취량이나 성분 함량에 따라 판단이 달라진다면
  필요한 정보가 입력되어 있는지 확인한다.
- 나트륨, 당류 및 특정 영양소의 섭취 제한은
  사용자가 실제로 해당 제한을 명시한 경우에만 고려한다.
- 일반적인 식품 안내 문구를 사용자 개인 주의사항으로 해석하지 않는다.
- 개인 주의사항과 관련성이 없다는 사실과
  관련성을 판단할 정보가 부족하다는 사실을 구분한다.

precaution_reason에는 다음 내용을 필요한 범위에서 구체적으로 설명한다.

- 사용자가 명시한 개인 주의사항
- 관련 입력 성분명
- 입력에 표시된 성분량과 단위
- 성분량과 개인 주의사항의 관련성
- 판단 결과와 근거
- 판단에 필요한 정보가 부족하다면 해당 정보

# 6. analysis_uncertain 판정

analysis_uncertain은 알레르기 또는 개인 주의사항 관련 판단 중
하나 이상을 입력 정보만으로 확정할 수 없는 경우 true로 설정한다.

다음 중 하나 이상에 해당하면 true다.

- 하나 이상의 알레르기가 uncertain_allergies에 포함되어 있다.
- 사용자 알레르기 정보의 누락 또는 불명확성 때문에
  판정 대상을 확정할 수 없다.
- 성분명이나 입력 데이터가 불명확하여 관련 판단을 확정할 수 없다.
- 개인 주의사항과 관련 성분 사이의 관계를 판단하기에
  필수적인 정보가 부족하다.
- 정량적인 판단이 필요한데 성분량, 섭취 기준 또는 적용 범위 등
  필수적인 정보가 부족하다.

위 조건에 해당하지 않고 모든 관련 판단을 충분한 입력 정보로
수행할 수 있다면 false로 설정한다.

다음 사실만으로 analysis_uncertain을 true로 설정하지 않는다.

- 사용자에게 알레르기가 없음이 명확하게 확인된 경우
- 개인 주의사항이 없음이 명확하게 확인된 경우
- 성분량이 표시되지 않았지만 정량적인 판단이 필요하지 않은 경우
- 소비기한 정보가 unknown이거나 누락된 경우

analysis_uncertain은 알레르기 및 개인 주의사항 관련 판단의
불확실성만 나타낸다.

# 7. 최종 위험도와 최종 메시지의 분리

최종 위험도, 위험 등급, 종합 안전성 판정 또는
result_message를 생성하지 않는다.

최종 위험도는 별도의 프로그램에서 결정한다.

소비기한 상태를 이용하여 알레르기 결과나 개인 주의사항 결과를
변경하지 않는다.

출력은 다음 항목으로만 구성한다.

- detected_ingredients
- risk_type
- uncertain_allergies
- allergy_reason
- precaution_risk
- precaution_reason
- analysis_uncertain

# 8. 출력 전 검증

JSON을 출력하기 전에 다음 사항을 확인한다.

1. 모든 필수 키가 존재하는가?
2. 지정된 키 이외의 키가 없는가?
3. detected_ingredients, risk_type, uncertain_allergies가 배열인가?
4. 확인 가능한 모든 사용자 알레르기가 risk_type에 포함되어 있는가?
5. 각 알레르기가 risk_type 또는 uncertain_allergies 중
   정확히 한 곳에만 포함되어 있는가?
6. risk_type.type은 "match" 또는 "unmatch"인가?
7. detected_ingredients의 각 성분이 입력에서 확인되었으며
   해당 알레르기와의 관련성이 설명 가능한가?
8. detected_ingredients의 ingredient에는 성분명만 기록했는가?
9. 성분량이 표시되어 있다면 수치와 단위를 정확하게 해석했는가?
10. 성분량이 표시되지 않은 경우 임의의 수치를 부여하지 않았는가?
11. 알레르기 판정에서 성분량이 적다는 이유만으로
    match를 unmatch로 변경하지 않았는가?
12. 개인 주의사항 판정에서 성분량을 적절하게 고려했는가?
13. 입력에 없는 섭취량, 영양성분 함량, 제한 기준 또는 건강 상태를
    만들어 내지 않았는가?
14. allergy_reason와 precaution_reason가 문자열인가?
15. precaution_risk와 analysis_uncertain이 JSON boolean인가?
16. 판단 근거가 입력 데이터와 일치하는가?
17. 최종 위험도나 result_message를 출력하지 않았는가?
18. 유효한 JSON 객체만 출력했는가?

모든 검증을 마친 후 JSON 객체만 출력한다.
"""

FOOD_IMAGE_EXTRACTION_PROMPT = """
사진에 보이는 식품 정보를 읽어 아래 구조의 JSON 객체만 반환하세요.
사진에서 확인할 수 없는 값은 추측하지 말고 빈 문자열 또는 빈 배열로 둡니다.
영양성분은 영양정보 표시에 보이는 항목과 수치·단위를 각각 name, amount로 반환합니다.
1회 제공량이나 총 내용량 등 영양성분의 기준도 amount에 포함합니다.
원료는 표시된 원료를 우선하며, 조리된 음식 사진처럼 원료 표시가 없을 때는
사진에서 명확히 식별 가능한 원료만 포함합니다. 추정이 필요한 성분은 추가하지 않습니다.
소비기한은 표시된 문구를 그대로 반환합니다.

{
  "food_name": "식품명",
  "company_name": "업체명",
  "report_number": "품목보고번호",
  "expiration_date": "소비기한",
  "ingredients": [{"name": "원료명", "amount": ""}],
  "nutrition": [{"name": "영양성분명", "amount": "표시된 수치와 단위"}]
}
"""

FOOD_IMAGE_VISION_MODEL = "qwen/qwen3-vl-30b-a3b-instruct"


def extract_food_info_from_image(image_bytes, content_type):
  """Qwen3-VL을 사용해 식품 사진의 표시 정보를 추출한다."""
  if not OPENROUTER_API_KEY:
    raise RuntimeError(
        "OPENROUTER_API_KEY가 설정되지 않았습니다. backend/.env에 설정해주세요."
    )

  image_data = base64.b64encode(image_bytes).decode("ascii")
  image_url = f"data:{content_type};base64,{image_data}"
  client = OpenAI(
      api_key=OPENROUTER_API_KEY,
      base_url="https://openrouter.ai/api/v1",
  )
  response = client.chat.completions.create(
      model=FOOD_IMAGE_VISION_MODEL,
      temperature=0,
      max_tokens=1500,
      response_format={"type": "json_object"},
      messages=[
          {"role": "system", "content": FOOD_IMAGE_EXTRACTION_PROMPT},
          {
              "role": "user",
              "content": [
                  {"type": "text", "text": "사진 속 식품 정보를 추출해주세요."},
                  {"type": "image_url", "image_url": {"url": image_url}},
              ],
          },
      ],
  )

  return response.choices[0].message.content


#======================================================
# 재시도 처리 (모델 지정 가능하게 수정)
#======================================================
limit_try_count = 2

def retry_ask(try_count, question, max_tokens=1024, target_model=None, use_fixed_prompt=False):
    """
    AI 요청을 재시도한다.
    target_model로 "claude-3.5-sonnet", "gpt-4o-mini", "gpt-5-mini"
    또는 "gpt-6-luna"를 지정하면 해당 OpenRouter 모델을 먼저 시도한다.
    """
    try:
        answer = ask_ai_with_fallback(question=question, max_tokens=max_tokens, target_model=target_model, use_fixed_prompt=use_fixed_prompt)
        return answer[0]
    except failed_ask_ai as e:
        if try_count < limit_try_count:
            return retry_ask(try_count=try_count + 1, question=question, max_tokens=max_tokens, target_model=target_model, use_fixed_prompt=use_fixed_prompt)
        else:
            print(f"ai 요청 시도 {try_count}회 실패.")
            return "요청 실패"

# =====================================================
# OpenRouter 모델 호출 함수
# =====================================================

def ask_openrouter(
    input_data,
    max_tokens=1024,
    model="anthropic/claude-3.5-sonnet",
    use_fixed_prompt=False,
):
  """OpenRouter를 통해 지정된 모델에 요청한다."""
  if not OPENROUTER_API_KEY:
    raise RuntimeError(
        "OPENROUTER_API_KEY가 설정되지 않았습니다. backend/.env에 설정해주세요."
    )

  client = OpenAI(api_key=OPENROUTER_API_KEY, base_url="https://openrouter.ai/api/v1")

  messages = []

  # 고정 프롬프트 사용 여부에 따른 분기
  if use_fixed_prompt:
    messages.append({"role": "system", "content": FIXED_SYSTEM_PROMPT})

  messages.append({"role": "user", "content": input_data})

  response = client.chat.completions.create(
      model=model,
      temperature=0,
      max_tokens=max_tokens,
      seed=7,
      response_format={"type": "json_object"},
      messages=messages
  )

  # 🔍 캐시 사용량 확인 (OpenAI 호환 스펙)
  if response.usage and hasattr(response.usage, "prompt_tokens_details"):
    details = response.usage.prompt_tokens_details
    cached_tokens = getattr(details, "cached_tokens", 0)
    print(
        f"[OpenRouter 캐시 확인] 캐시된 토큰: {cached_tokens} / 전체 프롬프트"
        f" 토큰: {response.usage.prompt_tokens}"
    )

  return response.choices[0].message.content


# =====================================================
# 폴백 및 우선순위 변경 함수
# =====================================================

def ask_ai_with_fallback(question, max_tokens=1024, target_model=None, use_fixed_prompt=False):
    """
    OpenRouter 모델을 우선순위에 따라 시도한다.
    target_model을 지정하면 해당 모델을 먼저 시도하고 나머지는 폴백으로 사용한다.
    """
    if not OPENROUTER_API_KEY:
        raise RuntimeError(
            "OPENROUTER_API_KEY가 설정되지 않았습니다. backend/.env에 설정해주세요."
        )

    # 기본 우선순위: GPT-4o mini → GPT-5 mini → GPT-6 Luna → Claude 3.5 Sonnet
    providers = [
        ("GPT-4o mini", "openai/gpt-4o-mini"),
        ("GPT-5 mini", "openai/gpt-5-mini"),
        ("GPT-6 Luna", "openai/gpt-6-luna"),
        ("Claude 3.5 Sonnet", "anthropic/claude-3.5-sonnet"),
    ]

    if target_model:
        normalized_target = target_model.strip().lower()
        aliases = {
            "claude": "anthropic/claude-3.5-sonnet",
            "claude-3.5-sonnet": "anthropic/claude-3.5-sonnet",
            "gpt-4o-mini": "openai/gpt-4o-mini",
            "gpt-5-mini": "openai/gpt-5-mini",
            "gpt-6-luna": "openai/gpt-6-luna",
        }
        normalized_target = aliases.get(normalized_target, normalized_target)
        matched = [p for p in providers if p[1] == normalized_target]
        if matched:
            providers = matched + [p for p in providers if p != matched[0]]
            print(f"🎯 우선 호출 모델: {matched[0][0]}")

    for name, model in providers:
        try:
            print(f"  → {name} 시도 중...")
            answer = ask_openrouter(
                input_data=question,
                max_tokens=max_tokens,
                model=model,
                use_fixed_prompt=use_fixed_prompt,
            )
            print(f"  ✅ {name} 성공!\n")
            return answer, name

        except Exception as e:
            error_msg = str(e)

            if any(keyword in error_msg.lower() for keyword in
                   ["quota", "rate limit", "429", "exceeded", "limit"]):
                print(f"  ⚠️  {name}: 요청 한도 초과 → 다음 모델로 전환")
            else:
                print(f"  ❌  {name}: 오류 발생 ({error_msg[:60]}...) → 다음 모델로 전환")

    raise failed_ask_ai("OpenRouter의 모든 설정 모델 요청에 실패했습니다.")