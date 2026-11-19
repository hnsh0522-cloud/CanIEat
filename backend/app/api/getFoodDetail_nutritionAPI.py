import json
import logging
import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

import requests
from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[2] / ".env")

logger = logging.getLogger(__name__)

ENDPOINT = (
    "https://apis.data.go.kr/1471000/"
    "FoodNtrCpntDbInfo03/getFoodNtrCpntDbInq03"
)
PAGE_SIZE = 100
PAGE_FETCH_WORKERS = 4

AMOUNT_FIELD_LABELS = {
    "AMT_NUM1": "에너지(kcal)",
    "AMT_NUM2": "수분(g)",
    "AMT_NUM3": "단백질(g)",
    "AMT_NUM4": "지방(g)",
    "AMT_NUM5": "회분(g)",
    "AMT_NUM6": "탄수화물(g)",
    "AMT_NUM7": "당류(g)",
    "AMT_NUM8": "식이섬유(g)",
    "AMT_NUM9": "칼슘(mg)",
    "AMT_NUM10": "철(mg)",
    "AMT_NUM11": "인(mg)",
    "AMT_NUM12": "칼륨(mg)",
    "AMT_NUM13": "나트륨(mg)",
    "AMT_NUM14": "비타민 A(μg RAE)",
    "AMT_NUM15": "비타민 A(μg)",
    "AMT_NUM16": "레티놀(μg)",
    "AMT_NUM17": "베타카로틴(μg)",
    "AMT_NUM18": "비타민 B1(mg)",
    "AMT_NUM19": "비타민 B2(mg)",
    "AMT_NUM20": "니아신(mg)",
    "AMT_NUM21": "비타민 C(mg)",
    "AMT_NUM22": "비타민 D(μg)",
    "AMT_NUM23": "콜레스테롤(mg)",
    "AMT_NUM24": "포화지방산(g)",
    "AMT_NUM25": "트랜스지방산(g)",
    "AMT_NUM26": "니코틴산(mg)",
    "AMT_NUM27": "니코틴아마이드(mg)",
    "AMT_NUM28": "비오틴(μg)",
    "AMT_NUM29": "비타민 B6(mg)",
    "AMT_NUM30": "비타민 B12(μg)",
    "AMT_NUM31": "엽산(DFE)(μg)",
    "AMT_NUM32": "콜린(mg)",
    "AMT_NUM33": "판토텐산(mg)",
    "AMT_NUM34": "비타민 D2(μg)",
    "AMT_NUM35": "비타민 D3(μg)",
    "AMT_NUM36": "비타민 E(mg α-TE)",
    "AMT_NUM37": "비타민 E(mg)",
    "AMT_NUM38": "토코페롤(mg)",
    "AMT_NUM39": "알파 토코페롤(mg)",
    "AMT_NUM40": "베타 토코페롤(mg)",
    "AMT_NUM41": "감마 토코페롤(mg)",
    "AMT_NUM42": "델타 토코페롤(mg)",
    "AMT_NUM43": "토코트리에놀(mg)",
    "AMT_NUM44": "알파 토코트리에놀(mg)",
    "AMT_NUM45": "베타 토코트리에놀(mg)",
    "AMT_NUM46": "감마 토코트리에놀(mg)",
    "AMT_NUM47": "델타 토코트리에놀(mg)",
    "AMT_NUM48": "비타민 K(μg)",
    "AMT_NUM49": "비타민 K1(μg)",
    "AMT_NUM50": "비타민 K2(μg)",
    "AMT_NUM51": "갈락토오스(g)",
    "AMT_NUM52": "과당(g)",
    "AMT_NUM53": "당알콜(g)",
    "AMT_NUM54": "맥아당(g)",
    "AMT_NUM55": "알룰로오스(g)",
    "AMT_NUM56": "에리스리톨(g)",
    "AMT_NUM57": "유당(g)",
    "AMT_NUM58": "자당(g)",
    "AMT_NUM59": "타가토스(g)",
    "AMT_NUM60": "포도당(g)",
    "AMT_NUM61": "총 불포화지방산(g)",
    "AMT_NUM62": "EPA와 DHA의 합(mg)",
    "AMT_NUM63": "가돌레산/에이코센산(mg)",
    "AMT_NUM64": "감마 리놀렌산(18:3 n-6)(mg)",
    "AMT_NUM65": "네르본산(24:1)(mg)",
    "AMT_NUM66": "도코사디에노산(22:2)(mg)",
    "AMT_NUM67": "도코사펜타에노산(22:5(n-3))(mg)",
    "AMT_NUM68": "도코사펜타엔산(n-6)(22:5,n-6)(mg)",
    "AMT_NUM69": "도코사헥사에노산(22:6(n-3))(mg)",
    "AMT_NUM70": "디호모리놀렌산(20:3(n-3))(mg)",
    "AMT_NUM71": "디호모감마리놀렌산(20:3,n-6)(mg)",
    "AMT_NUM72": "라우르산(12:0)(mg)",
    "AMT_NUM73": "리그노세르산(24:0)(mg)",
    "AMT_NUM74": "리놀레산(18:2(n-6)c)(g)",
    "AMT_NUM75": "리놀레산(18:2(n-6)c)(mg)",
    "AMT_NUM76": "미리스톨레산(14:1)(mg)",
    "AMT_NUM77": "미리스트산(14:0)(mg)",
    "AMT_NUM78": "박센산(18:1(n-7))(mg)",
    "AMT_NUM79": "베헨산(22:0)(mg)",
    "AMT_NUM80": "부티르산(4:0)(mg)",
    "AMT_NUM81": "스테아르산(18:0)(mg)",
    "AMT_NUM82": "스테아리돈산(18:4)(mg)",
    "AMT_NUM83": "아라키돈산(20:4 n-6)(mg)",
    "AMT_NUM84": "아라키드산(20:0)(mg)",
    "AMT_NUM85": "알파 리놀렌산(18:3(n-3))(g)",
    "AMT_NUM86": "알파 리놀렌산(18:3(n-3))(mg)",
    "AMT_NUM87": "에루크산(22:1)(mg)",
    "AMT_NUM88": "에이코사디에노산(20:2(n-6))(mg)",
    "AMT_NUM89": "에이코사트리에노산(20:3(n-6))(mg)",
    "AMT_NUM90": "에이코사펜타에노산(20:5(n-3))(mg)",
    "AMT_NUM91": "오메가3 지방산(g)",
    "AMT_NUM92": "오메가6 지방산(g)",
    "AMT_NUM93": "올레산(18:1 n-9)(mg)",
    "AMT_NUM94": "카프로산(6:0)(mg)",
    "AMT_NUM95": "카프르산(10:0)(mg)",
    "AMT_NUM96": "카프릴산(8:0)(mg)",
    "AMT_NUM97": "트라이데칸산(13:0)(mg)",
    "AMT_NUM98": "트랜스 리놀레산(18:2t)(mg)",
    "AMT_NUM99": "트랜스 리놀렌산(18:3t)(mg)",
    "AMT_NUM100": "카페인(mg)",
    "AMT_NUM101": "트랜스 올레산(18:1(n-9)t)(mg)",
    "AMT_NUM102": "트리코산산(23:0)(mg)",
    "AMT_NUM103": "팔미톨레산(16:1)(mg)",
    "AMT_NUM104": "팔미트산(16:0)(mg)",
    "AMT_NUM105": "펜타데칸산(15:0)(mg)",
    "AMT_NUM106": "헨에이코산산(21:0)(mg)",
    "AMT_NUM107": "헵타데센산(17:1)(mg)",
    "AMT_NUM108": "헵타데칸산(17:0)(mg)",
    "AMT_NUM109": "구리(mg)",
    "AMT_NUM110": "구리(μg)",
    "AMT_NUM111": "마그네슘(mg)",
    "AMT_NUM112": "망간(mg)",
    "AMT_NUM113": "몰리브덴(μg)",
    "AMT_NUM114": "불소(mg)",
    "AMT_NUM115": "셀레늄(μg)",
    "AMT_NUM116": "아연(mg)",
    "AMT_NUM117": "염소(mg)",
    "AMT_NUM118": "요오드(μg)",
    "AMT_NUM119": "크롬(μg)",
    "AMT_NUM120": "총 아미노산(mg)",
    "AMT_NUM121": "필수아미노산(mg)",
    "AMT_NUM122": "비필수아미노산(mg)",
    "AMT_NUM123": "글루탐산(mg)",
    "AMT_NUM124": "글리신(mg)",
    "AMT_NUM125": "라이신(mg)",
    "AMT_NUM126": "루신(mg)",
    "AMT_NUM127": "메티오닌(mg)",
    "AMT_NUM128": "발린(mg)",
    "AMT_NUM129": "세린(mg)",
    "AMT_NUM130": "시스테인(mg)",
    "AMT_NUM131": "아르기닌(mg)",
    "AMT_NUM132": "아스파르트산(mg)",
    "AMT_NUM133": "알라닌(mg)",
    "AMT_NUM134": "이소루신(mg)",
    "AMT_NUM135": "타우린(mg)",
    "AMT_NUM136": "트레오닌(mg)",
    "AMT_NUM137": "트립토판(mg)",
    "AMT_NUM138": "티로신(mg)",
    "AMT_NUM139": "페닐알라닌(mg)",
    "AMT_NUM140": "프롤린(mg)",
    "AMT_NUM141": "히스티딘(mg)",
    "AMT_NUM142": "펜타데센산(15:1,n-5)(mg)",
    "AMT_NUM143": "에이코사테트라에노산(20:4(n-3))",
    "AMT_NUM144": "헤니코사펜타엔산(21:5,n-3)(mg)",
    "AMT_NUM145": "니아신당량(NE)",
    "AMT_NUM146": "수용성 식이섬유(g)",
    "AMT_NUM147": "불용성 식이섬유(g)",
    "AMT_NUM148": "피리독신(mg)",
    "AMT_NUM149": "엽산_식품 엽산(μg)",
    "AMT_NUM150": "엽산_합성 엽산(μg)",
    "AMT_NUM151": "총 필수지방산(g)",
    "AMT_NUM152": "총 단일불포화지방산(g)",
    "AMT_NUM153": "총 다중불포화지방산(g)",
    "AMT_NUM154": "총 지방산(g)",
    "AMT_NUM155": "지방산의 합(g)",
    "AMT_NUM156": "식염상당량(g)",
    "AMT_NUM157": "폐기율(%)",
}


def _extract_items(payload: dict) -> Tuple[List[Dict], Optional[int]]:
    if "OpenAPI_ServiceResponse" in payload:
        raise RuntimeError("식약처 영양정보 API가 오류 응답을 반환했습니다.")

    body = payload.get("body") or {}
    if isinstance(body, list):
        total_count = payload.get("totalCount")
        return body, int(total_count) if total_count is not None else None
    if not isinstance(body, dict):
        raise RuntimeError("식약처 영양정보 API 응답 형식이 올바르지 않습니다.")

    items_block = body.get("items") or []
    if isinstance(items_block, dict):
        items = items_block.get("item") or []
    else:
        items = items_block

    if isinstance(items, dict):
        items = [items]
    if not isinstance(items, list):
        raise RuntimeError("식약처 영양정보 API의 식품 목록 형식이 올바르지 않습니다.")

    total_count = body.get("totalCount") or payload.get("totalCount")
    total_count = int(total_count) if total_count is not None else None
    return items, total_count


def nutrition_as_ingredients(item: Dict) -> List[Dict[str, str]]:
    serving_size = str(item.get("SERVING_SIZE") or "").strip()
    ingredients = []

    for field, label in AMOUNT_FIELD_LABELS.items():
        value = item.get(field)
        if value is None or not str(value).strip():
            continue

        amount = str(value).strip()
        if serving_size:
            amount = "{} (기준량: {})".format(amount, serving_size)
        ingredients.append({"name": label, "amount": amount})

    return ingredients


def search_food_nutrition(
    food_name: str = "",
    report_number: str = "",
    target_report_numbers: Optional[Iterable[str]] = None,
) -> List[Dict]:
    service_key = (
        os.getenv("MFDS_FOOD_API_SERVICE_KEY")
        or os.getenv("DATA_GO_KR_SERVICE_KEY")
    )
    if not service_key:
        logger.warning(
            "식약처 영양정보 API 키가 설정되지 않아 영양정보 조회를 건너뜁니다. "
            "MFDS_FOOD_API_SERVICE_KEY를 백엔드 환경에 설정하세요."
        )
        return []

    normalized_targets = {
        "".join(character for character in value.upper() if character.isalnum())
        for value in (target_report_numbers or [])
        if value
    }

    params = {
        "serviceKey": service_key,
        "pageNo": 1,
        "numOfRows": PAGE_SIZE,
        "type": "json",
    }
    if report_number:
        params["ITEM_REPORT_NO"] = report_number
    elif food_name:
        params["FOOD_NM_KR"] = food_name

    def fetch_page(page_no: int) -> Tuple[List[Dict], Optional[int]]:
        page_params = dict(params)
        page_params["pageNo"] = page_no
        response = requests.get(
            ENDPOINT,
            params=page_params,
        )
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict):
            raise RuntimeError("식약처 영양정보 API 응답 형식이 올바르지 않습니다.")
        return _extract_items(payload)

    first_page_items, total_count = fetch_page(1)
    all_items = list(first_page_items)

    if total_count is not None:
        total_pages = (total_count + PAGE_SIZE - 1) // PAGE_SIZE
        if total_pages > 1:
            logger.info("식약처 영양정보 전체 %s페이지를 조회합니다.", total_pages)
            with ThreadPoolExecutor(max_workers=PAGE_FETCH_WORKERS) as executor:
                for page_items, _ in executor.map(
                    fetch_page,
                    range(2, total_pages + 1),
                ):
                    all_items.extend(page_items)
    else:
        page_no = 2
        previous_page_signature = json.dumps(
            first_page_items,
            sort_keys=True,
            ensure_ascii=False,
        )
        while len(first_page_items) == PAGE_SIZE:
            page_items, _ = fetch_page(page_no)
            if not page_items:
                break

            page_signature = json.dumps(
                page_items,
                sort_keys=True,
                ensure_ascii=False,
            )
            if page_signature == previous_page_signature:
                logger.warning(
                    "식약처 API가 페이지를 넘기지 않은 것 같아 "
                    "%s페이지 조회를 중단합니다.",
                    page_no,
                )
                break

            all_items.extend(page_items)
            previous_page_signature = page_signature
            first_page_items = page_items
            page_no += 1

    if normalized_targets:
        return [
            item
            for item in all_items
            if "".join(
                character
                for character in str(item.get("ITEM_REPORT_NO") or "").upper()
                if character.isalnum()
            )
            in normalized_targets
        ]
    return all_items
