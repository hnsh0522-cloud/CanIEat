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
from app.routers.getFoodDetail import router as getFoodDetail_router
from app.routers.aiAsk import router as aiAsk_router
from app.routers.login import router as login_router
from app.routers.auth import router as auth_router
from app.routers.register import router as register_router
from app.routers.loadUserState import router as loadUserState_router
from app.routers.saveUserState import router as saveUserState_router
from app.routers.analysis import router as analysis_router

app = FastAPI() #서버 객체 생성

origins = [
    "http://localhost:5173",  # 프론트엔드 개발 서버 주소
    "http://127.0.0.1:5173",
    "https://canieat.kro.kr",  # 실제 서비스 주소
]

# ── CORS 설정 ────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # "*" = 모든 출처 허용 (개발용)
                               # 실제 서비스: ["https://mysite.com"] 처럼 지정
    allow_credentials=True,    # 쿠키, 인증 헤더 허용
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
app.include_router(login_router)
app.include_router(auth_router)
app.include_router(register_router)
app.include_router(loadUserState_router)
app.include_router(saveUserState_router)
app.include_router(analysis_router)


if __name__ == "__main__":
    #uvicorn.run(app, host="127.0.0.1", port=8000) #서버 실행, 로컬에서의 접속만 허용
    uvicorn.run(app, host="0.0.0.0", port=8000) #서버 실행, 호스트의 모든 네트워크 인터페이스로 접속을 허용.

#서버 실행 함수
def start(mode="local"):
    if(mode=="local"):
        uvicorn.run(app, host="127.0.0.1", port=8000)
    else:
        uvicorn.run(app, host=mode, port=8000)