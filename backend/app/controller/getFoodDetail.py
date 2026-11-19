import logging
import re
from typing import Dict, List, Optional

import requests

from app.api.getFoodDetail_foodsearchAPI import get_detail, search_all
from app.api.getFoodDetail_nutritionAPI import (
    nutrition_as_ingredients,
    search_food_nutrition,
)


logger = logging.getLogger(__name__)

NO_FOOD_INFORMATION_MESSAGE = "식품 정보를 찾을 수 없습니다."
NO_MATCHING_FOOD_MESSAGE = "두 데이터베이스에서 품목보고번호가 일치하는 식품을 찾을 수 없습니다."


def _normalize_report_number(value: object) -> str:
    return re.sub(r"[^A-Za-z0-9]", "", str(value or "")).upper()


def _get_food_safety_results(
    food_name: str,
    report_number: str,
    company_name: str,
) -> List[Dict]:
    if not food_name and not report_number and not company_name:
        return []
    return search_all(
        keyword=food_name,
        page_size=100,
        bsn_nm=company_name,
        report_no=report_number,
    )


def getFoodInformation(
    food_name: Optional[str] = "",
    report_number: Optional[str] = "",
    company_name: Optional[str] = "",
):
    food_name = food_name or ""
    report_number = str(report_number or "").strip()
    company_name = company_name or ""

    if not food_name and not report_number and not company_name:
        return {"message": NO_FOOD_INFORMATION_MESSAGE}

    try:
        food_safety_items = _get_food_safety_results(
            food_name,
            report_number,
            company_name,
        )
    except (requests.RequestException, ValueError, RuntimeError) as error:
        logger.warning(
            "식품안전나라 조회에 실패했습니다 (%s). 식약처 조회 결과를 확인합니다.",
            type(error).__name__,
        )
        food_safety_items = []

    if not food_safety_items:
        try:
            nutrition_items = search_food_nutrition(
                food_name=food_name,
                report_number=report_number,
            )
        except (requests.RequestException, ValueError, RuntimeError) as error:
            logger.warning(
                "식약처 영양정보 조회에 실패했습니다 (%s).",
                type(error).__name__,
            )
            nutrition_items = []
        if nutrition_items:
            nutrition_item = nutrition_items[0]
            return {
                "food_name": nutrition_item.get("FOOD_NM_KR", ""),
                "report_number": nutrition_item.get("ITEM_REPORT_NO", ""),
                "ingredients": nutrition_as_ingredients(nutrition_item),
            }
        return {"message": NO_FOOD_INFORMATION_MESSAGE}

    food_safety_report_numbers = {
        _normalize_report_number(item.get("PRDLST_REPORT_NO"))
        for item in food_safety_items
        if _normalize_report_number(item.get("PRDLST_REPORT_NO"))
    }

    try:
        nutrition_items = search_food_nutrition(
            food_name=food_name,
            report_number=report_number,
            target_report_numbers=(
                {report_number}
                if report_number
                else food_safety_report_numbers
            ),
        ) if report_number or food_safety_report_numbers else []
    except (requests.RequestException, ValueError, RuntimeError) as error:
        logger.warning(
            "식약처 영양정보 조회에 실패해 식품안전나라 결과를 사용합니다 (%s).",
            type(error).__name__,
        )
        nutrition_items = []

    nutrition_report_numbers = {
        _normalize_report_number(item.get("ITEM_REPORT_NO"))
        for item in nutrition_items
        if _normalize_report_number(item.get("ITEM_REPORT_NO"))
    }

    if nutrition_report_numbers:
        matching_report_numbers = (
            food_safety_report_numbers & nutrition_report_numbers
        )
        if not matching_report_numbers:
            return {"message": NO_MATCHING_FOOD_MESSAGE}

        selected_item = next(
            item
            for item in food_safety_items
            if _normalize_report_number(item.get("PRDLST_REPORT_NO"))
            in matching_report_numbers
        )
    else:
        # 식약처 결과나 품목보고번호가 없으면 식품안전나라 결과를 우선 사용합니다.
        selected_item = food_safety_items[0]

    selected_report_number = str(
        selected_item.get("PRDLST_REPORT_NO") or report_number
    )
    selected_report_number_normalized = _normalize_report_number(
        selected_report_number
    )
    selected_nutrition_item = next(
        (
            item
            for item in nutrition_items
            if _normalize_report_number(item.get("ITEM_REPORT_NO"))
            == selected_report_number_normalized
        ),
        {},
    )
    nutrition_ingredients = nutrition_as_ingredients(selected_nutrition_item)

    try:
        detail = get_detail(
            report_no=selected_report_number,
            search_result={"items": food_safety_items},
        )
    except (requests.RequestException, ValueError, RuntimeError) as error:
        logger.warning(
            "식품안전나라 상세 조회에 실패했습니다 (%s). 검색 목록 정보를 사용합니다.",
            type(error).__name__,
        )
        return {
            "food_name": selected_item.get("PRDLST_NM", ""),
            "report_number": selected_report_number,
            "ingredients": nutrition_ingredients,
        }

    product_info = detail.get("제품정보", {})
    expiration_date = next(
        (
            value
            for label, value in product_info.items()
            if any(
                term in "".join(label.split())
                for term in ("소비기한", "유통기한", "품질유지기한")
            )
        ),
        "",
    )

    ingredients = list(detail.get("성분및원료", []) or [])
    ingredients.extend(nutrition_ingredients)

    return {
        "food_name": product_info.get("제품명")
        or selected_item.get("PRDLST_NM", ""),
        "report_number": product_info.get("품목보고번호")
        or selected_report_number,
        "expiration_date": expiration_date,
        "ingredients": ingredients,
    }