from routers import *

from typing import Optional
from app.controller.getFoodDetail import getFoodInformation

# 1. 라우터 객체 생성 (공통 주소 prefix와 태그 지정)
router = APIRouter(
    prefix="/getFoodDetail",
    tags=["ask_process"]
)



@router.get("/")
def getFoodDetail(food_name: Optional[str] = "", report_number: Optional[int] = 0, company_name: Optional[str] = ""):
    getDetailResponse = getFoodInformation(food_name=food_name, report_number=report_number, company_name=company_name)
    
    return getDetailResponse

# # 가짜 데이터베이스 (메모리 DB)
# fake_items_db = [
#     {"id": 1, "name": "Item A", "price": 1000},
#     {"id": 2, "name": "Item B", "price": 2000}
# ]

# # 2. 엔드포인트 정의 (라우터 + 컨트롤러 역할)
# @router.get("/")
# async def get_all_items():
#     # 컨트롤러 로직: 전체 아이템 리스트 반환
#     return fake_items_db

# @router.get("/{item_id}")
# async def get_item_by_id(item_id: int):
#     # 컨트롤러 로직: 특정 아이템 찾기 및 예외 처리
#     for item in fake_items_db:
#         if item["id"] == item_id:
#             return item
    
#     # 아이템이 없을 때 404 에러 반환 (컨트롤러의 역할)
#     raise HTTPException(status_code=404, detail="아이템을 찾을 수 없습니다.")
