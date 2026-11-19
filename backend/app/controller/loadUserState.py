from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.account_crud import get_account_by_email
from app.crud.restrictions_crud import get_user_restrictions
from app.crud.user_allergy_crud import get_user_allergies


async def loadUserState_process(db: AsyncSession, email: str) -> dict:
    """이메일로 사용자의 알레르지와 주의사항 정보를 조회한다."""
    account = await get_account_by_email(db, email)
    if account is None:
        return {"success": False, "message": "사용자 계정을 찾을 수 없습니다."}

    user_id = account["user_id"]

    allergy_result = await get_user_allergies(db, user_id)
    if not allergy_result.get("success"):
        return allergy_result

    restriction_result = await get_user_restrictions(db, user_id)
    if not restriction_result.get("success"):
        return restriction_result

    return {
        "success": True,
        "message": "사용자 상태 조회 성공",
        "data": {
            "user_id": user_id,
            "email": account["email"],
            "allergies": allergy_result["data"],
            "restrictions": restriction_result["data"],
        },
    }