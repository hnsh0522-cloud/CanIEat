from fastapi import APIRouter, HTTPException
from typing import Optional
#식품 정보 모듈 가져오기
from app.api.getFoodDetail_foodsearchAPI import get_detail
from app.api.getFoodDetail_foodsearchAPI import search

# 1. 라우터 객체 생성 (공통 주소 prefix와 태그 지정)
router = APIRouter(
    prefix="/getFoodDetail",
    tags=["ask_process"]
)



@router.get("/")
def getFoodInformation(food_name: Optional[str] = "", report_number: Optional[int] = 0, company_name: Optional[str] = ""):
    #search는 str로 받기 때문에 str로 변환한다.
    get_inform = search(keyword=food_name if food_name else "", report_no=str(report_number) if report_number else "", bsn_nm=company_name if company_name else "")
    if(get_inform["total"] > 0):
        if(report_number != 0):
            get_inform = get_detail(report_no=str(report_number), search_result=get_inform)
        #품목보고번호가 제시되어 있지 않을 때 (식품명하고 업체명을 통해서 찾을 때이다. 이 경우는 나중에 추가하도록 한다. 기본적으로는 가장 첫 번째 항목을 가져오도록 함.)
        else:
            firstProductPrd = get_inform.get("items", []) [0].get("PRDLST_REPORT_LEDG_NO", str(report_number))
            get_inform = get_detail(report_no=firstProductPrd)
        fn = prn = expiration_date = ingre = ""
        try:
            fn = get_inform["제품정보"]["제품명"]
            prn = get_inform["제품정보"]["품목보고번호"]
            expiration_date = get_inform["제품정보"]["소비기한"]
            ingre = get_inform["성분및원료"]
        except Exception as e:
            pass

        return {"food_name" : fn, "report_number" : prn, "expiration_date" : expiration_date, "ingredients" : ingre}
    
    else:
        return "식품안전나라에서 찾을 수 없는 식품"



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
