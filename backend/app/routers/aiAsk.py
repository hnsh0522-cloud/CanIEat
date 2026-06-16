from routers import *
from app.schemas.AskOfEating import AskOfEating
from app.controller.aiAsk import getAiAnswer


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
def aiAsk(ask: AskOfEating):
    
    answer = getAiAnswer(ask)
    
    return answer