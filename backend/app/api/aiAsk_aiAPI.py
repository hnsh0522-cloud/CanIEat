import os
from openai import OpenAI
from google import genai
from google.genai import types
from groq import Groq

# =====================================================
# ✅ API 키 설정 (본인 키로 교체하세요)
# =====================================================
GEMINI_API_KEY      = "AIzaSyDI9f8it40wsqxbDKzdMOTmBX4Do2EPctU"
OPENROUTER_API_KEY  = "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" 
GROQ_API_KEY     = "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"

#======================================================
# ai 요청 실패 사용자 정의 예외
#======================================================
class failed_ask_ai(Exception):
    pass

#======================================================
# 재시도 처리 (모델 지정 가능하게 수정)
#======================================================
limit_try_count = 2

def retry_ask(try_count, question, max_tokens=1024, target_model=None):
    """
    ai 요청을 재시도 합니다. 
    target_model에 "groq-gpt", "openrouter-gpt", "gemini" 등을 지정하면 해당 모델을 최우선으로 시도합니다.
    기본 우선순위:
        1. gemini
        2. groq compound mini
        3. groq compound
    """
    try:
        # fallback 함수에 우선 호출할 모델 지정을 함께 넘겨줍니다.
        answer = ask_ai_with_fallback(question, max_tokens, target_model=target_model)
        return answer[0]
    except failed_ask_ai as e:
        if try_count < limit_try_count:
            # 재시도할 때도 지정된 모델 설정을 그대로 유지합니다.
            return retry_ask(try_count + 1, question, max_tokens, target_model=target_model)
        else:
            print(f"ai 요청 시도 {try_count}회 실패.")
            return "요청 실패"


# =====================================================
# ✅ 각 AI 호출 함수
# =====================================================

def ask_gemini(question, max_tokens=1024):
    """Google Gemini 2.5 Flash"""
    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=question,
        config=types.GenerateContentConfig(
            max_output_tokens=max_tokens,
            temperature=0,
            seed=7,
            response_mime_type="application/json"
        )
    )
    return response.text


def ask_openrouter(question, max_tokens=1024, model="openai/gpt-oss-120b:free"):
    """OpenRouter"""
    client = OpenAI(
        api_key=OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1"
    )
    response = client.chat.completions.create(
        model=model,
        temperature=0,
        max_tokens=max_tokens,
        seed=7,
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": question}]
    )
    return response.choices[0].message.content



def ask_groq(question, max_tokens=1024, model="openai/gpt-oss-120b"):
    """Groq"""

    # client = OpenAI(
    #     api_key=GROQ_API_KEY,
    #     base_url="https://api.groq.com/openai/v1"
    # )

    # response = client.chat.completions.create(
    #     model=model,
    #     temperature=0,
    #     max_tokens=max_tokens,
    #     seed=7,
    #     response_format={"type":"json_object"},
    #     messages=[{"role": "user", "content": question}]
    # )

    client = Groq(api_key=GROQ_API_KEY)
    completion = client.chat.completions.create(
    model="openai/gpt-oss-120b",
    max_tokens=max_tokens,
    temperature=0,
    seed=7,
    response_format={"type":"json_object"},
    messages=[
        {
            "role": "user",
            "content": question
        }
    ]
)

    # return response.choices[0].message.content
    return completion.choices[0].message.content


# =====================================================
# ✅ 핵심: 폴백(Fallback) 및 우선순위 동적 변경 함수
# =====================================================

def ask_ai_with_fallback(question, max_tokens=1024, target_model=None):
    """
    무료 AI를 순서대로 시도합니다.
    target_model 키워드가 들어오면 해당 모델을 리스트의 맨 앞으로 재배치합니다.
    """

    # 기본 우선순위 정의 (튜플 구조: (로그용 이름, 함수 고유키, 실행 함수))
    providers = [
        ("Google Gemini 2.5 Flash", "gemini", ask_gemini, "gemini"),
        ("Groq Compound Mini", "groq-compound-mini", ask_groq, "groq/compound-mini"),
        ("Groq Compound", "groq-compound", ask_groq, "groq/compound"),
        ("OpenRouter Nemotron 3 Ultra ", "openrouter-nemotron", ask_openrouter, "nvidia/nemotron-3-ultra-550b-a55b:free"),
        ("OpenRouter gpt-oss-120b ", "openrouter-gpt", ask_openrouter, "openai/gpt-oss-120b:free"),
        ("Groq gpt-oss-120b", "groq-gpt", ask_groq, "openai/gpt-oss-120b")
    ]

    # 💡 픽(Pick) 기능 구현: 사용자가 특정 모델을 원한 경우 리스트 재배치
    if target_model:
        target_model = target_model.lower()
        matched = [p for p in providers if p[1] == target_model]
        unmatched = [p for p in providers if p[1] != target_model]
        
        if matched:
            # 지정된 모델을 맨 앞으로 보내고, 나머지를 뒤로 붙여 순서를 바꿉니다.
            providers = matched + unmatched
            print(f"🎯 사용자가 지정한 [{matched[0][0]}] 모델을 1순위로 호출합니다.")

    # 재배치된 순서대로 AI 호출 진행
    for name, _, ask_func, model in providers:
        try:
            print(f"  → {name} 시도 중...")
            if(name == "Google Gemini 2.5 Flash"):
                answer = ask_func(question, max_tokens)
            else:
                answer = ask_func(question, max_tokens, model)
            print(f"  ✅ {name} 성공!\n")
            return answer, name

        except Exception as e:
            error_msg = str(e)

            if any(keyword in error_msg.lower() for keyword in
                   ["quota", "rate limit", "429", "exceeded", "limit"]):
                print(f"  ⚠️  {name}: 할당량 초과 → 다음 백업 AI로 전환")
            else:
                print(f"  ❌  {name}: 오류 발생 ({error_msg[:60]}...) → 다음 백업 AI로 전환")

    raise failed_ask_ai("❌ 모든 무료 AI의 할당량이 초과되었습니다. 내일 다시 시도해주세요.")