from fastapi import APIRouter

from typing import Optional
from app.controller.getFoodDetail import getFoodInformation

# 1. 라우터 객체 생성 (공통 주소 prefix와 태그 지정)
router = APIRouter(
    prefix="/getFoodDetail",
    tags=["ask_process"]
)



@router.get("/")
def getFoodDetail(
    food_name: Optional[str] = "",
    report_number: Optional[str] = "",
    company_name: Optional[str] = "",
):
    return getFoodInformation(
        food_name=food_name,
        report_number=report_number,
        company_name=company_name,
    )
