"""
식품안전나라 식품 검색 스크래퍼
https://www.foodsafetykorea.go.kr/portal/specialinfo/searchInfoProduct.do

srchBtn 클릭 시 발생하는 두 요청을 순서대로 재현합니다:
  1. searchPrdListCnt_1.do  → 총 결과 수 조회
  2. searchPrdList_1.do     → 실제 목록 조회

제품명 클릭 시 발생하는 상세 페이지 요청도 재현합니다:
  3. prdInfoDetail.do       → 인허가 정보 / 제품 정보 / 성분 및 원료
"""

import time
import random
import requests
from bs4 import BeautifulSoup


# ──────────────────────────────────────────────────────────────
# 상수
# ──────────────────────────────────────────────────────────────
BASE_URL    = "https://www.foodsafetykorea.go.kr"
REFERER     = f"{BASE_URL}/portal/specialinfo/searchInfoProduct.do?"
CNT_URL     = f"{BASE_URL}/ajax/portal/specialinfo/searchPrdListCnt_1.do"
LIST_URL    = f"{BASE_URL}/ajax/portal/specialinfo/searchPrdList_1.do"
DETAIL_URL  = f"{BASE_URL}/iframe/specialinfo/prdInfoDetail.do"

# 사이트 고정 파라미터 (네트워크 탭 캡처값 기준)
FIXED_PARAMS = {
    "menu_no":      "",
    "menu_grp":     "",
    "menuNm":       "",
    "copyUrl":      REFERER,
    "mberId":       "",
    "mberNo":       "",
    "favorListCnt": "",
    "s_mode":       "1",
    "s_opt":        "all",
    "s_induty_cd":  "106,402,108,131,132,604,611,612,613,118,119",
    "s_prdlst_grp": "all",
    "s_prdlst_cd":  "all",
    "s_bsn_nm":     "",
    "s_prdlst_report_no": "",
    "s_opt1":       "I",
    "s_keyword1":   "",
    "s_opt2":       "Y",
    "s_opt3":       "0",
    "s_keyword2":   "",
    "s_order_by":   "prdlst_nm",
    "s_prefix":     "",
    "s_halal_yn":   "",
    "s_highlow_yn": "",
    "s_dsp_yn":     "",
    "s_child_yn":   "",
    "s_bar_cd":     "",
    # 하단 중복 hidden 필드들
    "prdlst_grp":        "all",
    "bsn_nm":            "",
    "prdlst_report_no":  "",
    "opt1":              "I",
    "keyword1":          "",
    "prd_cd_nm":         "",
    "chk_prdlst_cd":     "all",
    "prd_cd_nm2":        "",
    "opt2":              "Y",
    "opt3":              "1",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/148.0.0.0 Safari/537.36"
    ),
    "Accept":           "application/json, text/javascript, */*; q=0.01",
    "Accept-Language":  "ko-KR,ko;q=0.9",
    "Content-Type":     "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    "Referer":          REFERER,
    "Origin":           BASE_URL,
}

DETAIL_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/148.0.0.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;"
        "q=0.9,image/avif,image/webp,*/*;q=0.8"
    ),
    "Accept-Language":       "ko-KR,ko;q=0.9",
    "Referer":               REFERER,
    "Upgrade-Insecure-Requests": "1",
}


# ──────────────────────────────────────────────────────────────
# 내부 유틸
# ──────────────────────────────────────────────────────────────
def _call_page() -> str:
    """사이트 JS와 동일한 방식으로 callPage 값 생성 (숫자 16자리)"""
    return str(int(time.time() * 1000)) + str(random.randint(100, 999))


def _build_params(keyword, page, page_size, tx_id, call_page,
                  bsn_nm="", report_no="") -> dict:
    p = dict(FIXED_PARAMS)
    p.update({
        "s_prd_nm":             keyword,    # 제품명
        "s_bsn_nm":             bsn_nm,     # 업체명
        "s_prdlst_report_no":   report_no,  # 품목보고번호
        "s_list_cnt":           str(page_size),
        "s_page_num":           str(page),
        "s_tx_id":              tx_id,
        "callPage":             call_page,
        "prd_nm":               keyword,    # 하단 중복 필드
        "bsn_nm":               bsn_nm,     # 하단 중복 필드
        "prdlst_report_no":     report_no,  # 하단 중복 필드
    })
    return p


def _text(tag) -> str:
    """BeautifulSoup 태그에서 공백 정리된 텍스트 추출"""
    return tag.get_text(" ", strip=True) if tag else ""


def _parse_table_pairs(table) -> dict:
    """
    th-td 쌍으로 된 테이블을 {헤더: 값} dict로 파싱합니다.
    colspan이 있는 td도 처리합니다.
    """
    result = {}
    if not table:
        return result
    for row in table.find_all("tr"):
        ths = row.find_all("th")
        tds = row.find_all("td")
        # th-td 쌍 매핑 (colspan 행 포함)
        for i, th in enumerate(ths):
            key = _text(th)
            val = _text(tds[i]) if i < len(tds) else ""
            if key:
                result[key] = val
    return result


def _parse_ingredient_table(table) -> list:
    """성분 및 원료 테이블 → 문자열 리스트"""
    if not table:
        return []
    items = []
    for row in table.find_all("tr"):
        tds = row.find_all("td")
        if len(tds) >= 2:
            items.append(_text(tds[1]))
    return items


# ──────────────────────────────────────────────────────────────
# 공개 함수
# ──────────────────────────────────────────────────────────────
def search(keyword: str = "", page: int = 1, page_size: int = 10,
           bsn_nm: str = "", report_no: str = "") -> dict:
    """
    srchBtn 클릭을 재현합니다.

    Parameters
    ----------
    keyword   : 제품명 검색어 (빈 문자열 = 전체)
    page      : 페이지 번호 (1부터 시작)
    page_size : 페이지당 항목 수
    bsn_nm    : 업체명 (빈 문자열 = 전체)
    report_no : 품목보고번호 (빈 문자열 = 전체)

    Returns
    -------
    {
        "total":   int,   # 총 검색 결과 수
        "page":    int,
        "keyword": str,
        "items":   list
    }
    """
    session   = requests.Session()
    session.headers.update(HEADERS)

    tx_id     = "1"
    call_page = _call_page()

    session.get(REFERER)
    session.cookies.set("callPage", call_page, domain="www.foodsafetykorea.go.kr")

    params = _build_params(keyword, page, page_size, tx_id, call_page,
                           bsn_nm=bsn_nm, report_no=report_no)

    conditions = f"keyword='{keyword}'"
    if bsn_nm:
        conditions += f", bsn_nm='{bsn_nm}'"
    if report_no:
        conditions += f", report_no='{report_no}'"

    # Step 1: 총 건수 조회
    print(f"[1/2] 총 건수 조회 중... ({conditions})")
    cnt_resp = session.post(CNT_URL, data=params)
    cnt_resp.raise_for_status()
    total = int(cnt_resp.json().get("totCnt", 0))
    print(f"      → 총 {total}건")

    # Step 2: 목록 조회
    print(f"[2/2] 목록 조회 중... (page={page}/{-(-total // page_size)})")
    list_resp = session.post(LIST_URL, data=params)
    list_resp.raise_for_status()
    items = list_resp.json().get("prdList", [])
    print(f"      → {len(items)}건 수신")

    return {"total": total, "page": page, "keyword": keyword, "items": items}


def get_detail(report_no: str, search_result: dict = None) -> dict:
    """
    품목보고번호(PRDLST_REPORT_NO)로 상세 페이지를 조회합니다.

    Parameters
    ----------
    report_no     : 품목보고번호  예) "19780614009581"
    search_result : search() 반환값 (있으면 PRDLST_REPORT_LEDG_NO를 자동 조회)
                    없으면 report_no == ledg_no 로 시도합니다. (반드시 있어야 한다. 왜냐하면 실제 품목보고번호랑 링크로 전달되는 쿼리 파라미터가 다르기 때문이다.)

    Returns
    -------
    {
        "인허가정보":   dict,   # 업체명, 소재지
        "제품정보":     dict,   # 품목보고번호, 일자, 제품명, 소비기한, 유형, ...
        "성분및원료":   list,   # ["밀가루", "설탕", ...]
    }
    """
    # ── 품목보고대장번호(ledg_no) 결정 ───────────────────────
    # 앵커 태그의 href 파라미터는 prdlstReportLedgNo = PRDLST_REPORT_LEDG_NO
    # 검색 결과에서 매칭되는 항목을 찾아 가져옴
    ledg_no = report_no  # fallback
    if search_result:
        for item in search_result.get("items", []):
            if item.get("PRDLST_REPORT_NO") == report_no:
                ledg_no = item.get("PRDLST_REPORT_LEDG_NO", report_no)
                break

    call_page = _call_page()

    session = requests.Session()
    session.headers.update(DETAIL_HEADERS)

    # 초기 페이지 GET → 세션 쿠키 획득
    session.get(REFERER)
    session.cookies.set("callPage", call_page, domain="www.foodsafetykorea.go.kr")

    # GET 요청 (앵커 태그의 href 구조 그대로)
    params = {
        "prdlstReportLedgNo": ledg_no,
        "from":               "searchCompany",
        "callPage":           call_page,
    }
    print(f"\n[상세 조회] 품목보고번호={report_no}, 대장번호={ledg_no}")
    resp = session.get(DETAIL_URL, params=params)
    resp.raise_for_status()
    resp.encoding = "UTF-8"

    soup = BeautifulSoup(resp.text, "html.parser")
    tables = soup.find_all("table", class_="mb-table")

    # mb-table 첫 번째 = 인허가 정보, 두 번째 = 제품 정보
    license_info = _parse_table_pairs(tables[0]) if len(tables) > 0 else {}
    product_info = _parse_table_pairs(tables[1]) if len(tables) > 1 else {}

    # 성분 및 원료: class="col table-sm" 인 table 중 번호/성분 컬럼이 있는 것
    ingredient_table = None
    for tbl in soup.find_all("table", class_=lambda c: c and "table-sm" in c):
        headers = [th.get_text(strip=True) for th in tbl.find_all("th")]
        if "성분 및 원료" in headers:
            ingredient_table = tbl
            break

    ingredients = _parse_ingredient_table(ingredient_table)

    print(f"      → 인허가정보 {len(license_info)}개 항목")
    print(f"      → 제품정보   {len(product_info)}개 항목")
    print(f"      → 성분원료   {len(ingredients)}개")

    return {
        "인허가정보": license_info,
        "제품정보":   product_info,
        "성분및원료": ingredients,
    }


def search_all(keyword: str = "", page_size: int = 10,
               bsn_nm: str = "", report_no: str = "") -> list:
    """전체 페이지를 순회하여 모든 결과를 반환합니다."""
    first      = search(keyword, page=1, page_size=page_size,
                        bsn_nm=bsn_nm, report_no=report_no)
    total      = first["total"]
    all_items  = list(first["items"])
    total_pages = -(-total // page_size)

    for page in range(2, total_pages + 1):
        time.sleep(0.5)
        result = search(keyword, page=page, page_size=page_size,
                        bsn_nm=bsn_nm, report_no=report_no)
        all_items.extend(result["items"])

    print(f"\n[완료] 총 {len(all_items)}건 수집")
    return all_items


# ──────────────────────────────────────────────────────────────
# 실행 예시
# ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import json

    # ── 1-A. 제품명만으로 검색 ────────────────────────────────
    #result = search(keyword="초코파이", page=1, page_size=10)

    # ── 1-B. 제품명 + 업체명 ──────────────────────────────────
    #result = search(keyword="초코파이", bsn_nm="롯데웰푸드", report_no="")

    # ── 1-C. 품목보고번호만으로 검색 ──────────────────────────
    result = search(report_no="2017015646367", keyword="", bsn_nm="")

    # ── 1-D. 제품명 + 업체명 + 품목보고번호 조합 ──────────────
    # result = search(keyword="초코파이", bsn_nm="롯데웰푸드", report_no="19780614009581")

    print(f"\n총 결과: {result['total']}건  /  수신: {len(result['items'])}건\n")
    for i, item in enumerate(result["items"], 1):
        print(
            f"[{i:02d}] 품목보고번호={item.get('PRDLST_REPORT_NO')}"
            f"  제품명={item.get('PRDLST_NM')}"
            f"  업체={item.get('BSSH_NM')}"
        )

    # ── 2. 상세 조회 (품목보고번호 지정) ──────────────────────
    TARGET_REPORT_NO = "2017015646367"   # ← 원하는 품목보고번호로 변경
    detail = get_detail(TARGET_REPORT_NO, result)
    print("\n[인허가 정보]")
    for k, v in detail["인허가정보"].items():
        print(f"  {k}: {v}")

    print("\n[제품 정보]")
    for k, v in detail["제품정보"].items():
        print(f"  {k}: {v}")

    print("\n[성분 및 원료]")
    print("  " + ", ".join(detail["성분및원료"]))


    # ── 전체 저장 (주석 해제 후 사용) ────────────────────────
    # with open("detail.json", "w", encoding="utf-8") as f:
    #     json.dump(detail, f, ensure_ascii=False, indent=2)