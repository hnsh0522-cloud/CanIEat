from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.allergy_crud import get_all_allergies
from app.controller.loadUserState import loadUserState_process
from app.crud.restrictions_crud import (
    add_user_restriction,
    delete_user_restriction,
)
from app.crud.user_allergy_crud import (
    add_user_allergy,
    delete_user_allergy,
)
from app.schemas.UserState import UserState


async def saveUserState_process(
    user_state: UserState,
    db: AsyncSession,
    email: str,
) -> dict:
    """인증된 사용자의 알레르지와 주의사항을 요청 내용에 맞게 갱신한다."""
    current_state_result = await loadUserState_process(db=db, email=email)
    if not current_state_result.get("success"):
        return current_state_result

    current_state = current_state_result["data"]
    user_id = current_state["user_id"]
    current_allergies = current_state["allergies"]
    current_restrictions = current_state["restrictions"]
    allergy_names = user_state.allergies
    restriction_texts = user_state.restrictions

    allergies_to_delete = []
    allergies_to_add = []
    if allergy_names is not None:
        requested_allergies = set(allergy_names)
        allergies_to_delete = [
            allergy
            for allergy in current_allergies
            if allergy["allergy_name"] not in requested_allergies
        ]
        current_allergy_names = {
            allergy["allergy_name"] for allergy in current_allergies
        }
        allergy_names_to_add = requested_allergies - current_allergy_names

        if allergy_names_to_add:
            catalog_result = await get_all_allergies(db)
            if not catalog_result.get("success"):
                return catalog_result

            allergy_ids_by_name = {
                allergy["allergy_name"]: allergy["allergy_id"]
                for allergy in catalog_result["data"]
            }
            allergy_names_by_id = {
                allergy_id: allergy_name
                for allergy_name, allergy_id in allergy_ids_by_name.items()
            }
            unknown_allergies = allergy_names_to_add - allergy_ids_by_name.keys()
            if unknown_allergies:
                return {
                    "success": False,
                    "message": "등록되지 않은 알레르기 이름이 포함되어 있습니다.",
                    "unknown_allergies": sorted(unknown_allergies),
                }

            allergies_to_add = [
                allergy_ids_by_name[name] for name in sorted(allergy_names_to_add)
            ]

    restrictions_to_delete = []
    restrictions_to_add = []
    if restriction_texts is not None:
        requested_restrictions = set(restriction_texts)
        restrictions_to_delete = [
            restriction
            for restriction in current_restrictions
            if restriction["restriction_text"] not in requested_restrictions
        ]
        current_restriction_texts = {
            restriction["restriction_text"] for restriction in current_restrictions
        }
        restrictions_to_add = sorted(
            requested_restrictions - current_restriction_texts
        )

    changes = {
        "deleted_allergies": [],
        "added_allergies": [],
        "deleted_restrictions": [],
        "added_restrictions": [],
    }

    for allergy in allergies_to_delete:
        result = await delete_user_allergy(
            db=db,
            user_id=user_id,
            allergy_id=allergy["allergy_id"],
        )
        if not result.get("success"):
            return {
                **result,
                "changes": changes,
            }
        changes["deleted_allergies"].append(allergy["allergy_name"])

    for allergy_id in allergies_to_add:
        result = await add_user_allergy(
            db=db,
            user_id=user_id,
            allergy_id=allergy_id,
        )
        if not result.get("success"):
            return {
                **result,
                "changes": changes,
            }
        changes["added_allergies"].append(allergy_names_by_id[allergy_id])

    for restriction in restrictions_to_delete:
        result = await delete_user_restriction(
            db=db,
            user_id=user_id,
            restriction_id=restriction["restriction_id"],
        )
        if not result.get("success"):
            return {
                **result,
                "changes": changes,
            }
        changes["deleted_restrictions"].append(restriction["restriction_text"])

    for restriction_text in restrictions_to_add:
        result = await add_user_restriction(
            db=db,
            user_id=user_id,
            restriction_text=restriction_text,
        )
        if not result.get("success"):
            return {
                **result,
                "changes": changes,
            }
        changes["added_restrictions"].append(restriction_text)

    return {
        "success": True,
        "message": "사용자 상태가 성공적으로 저장되었습니다.",
        "changes": changes,
    }