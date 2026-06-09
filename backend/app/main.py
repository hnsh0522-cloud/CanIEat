"""
FastAPI 백엔드 서버 구축 예시
"""



# app/main.py 최상단
import os
import sys

# 현재 파일(main.py)의 부모의 부모 폴더(프로젝트 루트)를 파이썬 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.database import get_db

from app.routers.getFoodDetail import router as getFoodDetail_router
from app.routers.aiAsk import router as aiAsk_router

db_session = get_db()

print(f"db 서버 접속 성공 {db_session}")

app = FastAPI() #서버 객체 생성

# ── CORS 설정 ────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # "*" = 모든 출처 허용 (개발용)
                               # 실제 서비스: ["https://mysite.com"] 처럼 지정
    allow_methods=["*"],       # GET, POST, PUT, DELETE 등 모두 허용
    allow_headers=["*"],       # Authorization, Content-Type 등 모두 허용
)


# ── 라우터 ──────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "서버 정상 동작 중"}

#식품 정보 얻기 처리
#프론트 엔드 서버에서 픔목보고번호를 적거나, 식품명하고 업체명을 적도록 처리를 해줘야 한다.
app.include_router(getFoodDetail_router)
#식품 판단 처리
app.include_router(aiAsk_router)


#@는 데코레이터이고 함수에 기능을 덧붙이는 역할이다.
#@ 없이 쓴다면 get_item = app.get("/items/{item_id}")(get_item) 이렇게 해야 하고 의미는 해당 경로로 요청이 들어오면 get_item 함수를 실행하는 것이다.
#반환값은 자동으로 json 형태로 바뀌고 그 값으로 응답을 해준다. (FastAPI가 해주는 것)
#넘기는 파라미터 이름과 받는 매개변수 이름이 동일해야 한다.
#쿼리 파라미터는 이름이 같으면 자동으로 받아온다. 쿼리 파라미터 받아올 때는 {} 없이 그냥 받아온다.
#@app.get("/items/{item_id}")
# def get_item(item_id: int):
#     if item_id != 1:
#         raise HTTPException(status_code=404, detail="아이템을 찾을 수 없습니다")
#     return {"id": item_id, "name": "샘플 아이템"}

# #요청 body의 데이터를 받을 때 Item 스키마와 같다면 자동으로 객체로 변환해서 인자로 넘어간다.
# #브라우저 개발자 도구의 네트워크 탭에서 보시는 Payload(페이로드)가 바로 요청 body 데이터
# @app.post("/items")
# def create_item(item: Item):
#     # 여기서 DB 저장 로직 추가
#     return {"message": "생성 완료", "item": item}


# @app.put("/items/{item_id}")
# def update_item(item_id: int, item: Item):
#     return {"message": f"{item_id}번 수정 완료", "item": item}


# @app.delete("/items/{item_id}")
# def delete_item(item_id: int):
#     return {"message": f"{item_id}번 삭제 완료"}


# async를 쓰고 await을 안 쓰면 async를 쓰는 의미가 없어진다. async는 await이 있을거라고 예고를 하는 것. await으로 그 함수 실행을 멈추고 다른 함수 실행을 할 수 있게 하는 것
# async await 비동기 처리 과정
# 1. 기존 함수 A가 await를 만나서 뒷부분을 멈추고 대기실로 갑니다.
# 2. 서버는 대기실에 있던 다른 함수 B를 가져와서 실행합니다
# 3. 함수 B가 실행되던 도중, 아까 기존 함수 A의 await 작업(DB 조회 등)이 완료되었다는 알림이 띵동! 하고 울립니다.
# 4. 하지만 컴퓨터는 바로 함수 A로 달려가지 않습니다. 지금 실행 중인 함수 B가 또 다른 await를 만나서 자리를 양보하거나, 함수 B의 처리가 완전히 끝날 때까지 기다립니다.
# 5. 함수 B가 자리를 양보하거나 끝나면, 그제야 컴퓨터는 기존 함수 A로 돌아와서 멈췄던 뒷부분을 재개합니다.
# (만약 await을 썼는데 제어권을 넘길 이벤트가 없다면 await 다음 부분을 처리한다.)

if __name__ == "__main__":
    #uvicorn.run(app, host="127.0.0.1", port=8000) #서버 실행, 로컬에서의 접속만 허용
    uvicorn.run(app, host="0.0.0.0", port=8000) #서버 실행, 외부에서 모든 ip의 접속을 허용

#서버 실행 함수
def start(mode="local"):
    if(mode=="local"):
        uvicorn.run(app, host="127.0.0.1", port=8000)
    else:
        uvicorn.run(app, host=mode, port=8000)