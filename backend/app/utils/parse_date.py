from datetime import date, datetime
import re

#정규식으로 소비기한에서 날짜 빼오기
def parse_duration(text):
    # 정규식 패턴: 숫자(\d+) 뒤에 년/월/일이 붙은 구조를 찾습니다.
    years_match = re.search(r"(\d+)\s*년", text)
    months_match = re.search(r"(\d+)\s*개월", text)
    weeks_match = re.search(r"(\d+)\s*주일", text)
    days_match = re.search(r"(\d+)\s*일", text)
    
    # 매칭되는 숫자가 있으면 정수로 변환, 없으면 0으로 처리
    years = int(years_match.group(1)) if years_match else 0
    months = int(months_match.group(1)) if months_match else 0
    weeks = int(weeks_match.group(1)) if weeks_match else 0
    days = int(days_match.group(1)) if days_match else 0
    
    if(years == 0 and months == 0 and weeks == 0 and days == 0):
        return ""
    
    # duration = ""

    # if(years > 0):
    #     duration = duration + str(years) + "년 "
    # if(months > 0):
    #     duration = duration + str(months) + "개월 "
    # if(days > 0):
    #     duration = duration + str(days) + "일"
    
    duration = years * 365 + months * 30 + weeks * 7 + days

    return str(duration)

#정규식으로 문자열이 날짜 형식에 맞는지 확인
def try_parse_date(date_string: str):
    try:
        # 문자열이 YYYY-MM-DD 형식에 맞는지 확인하고 datetime 객체로 변환합니다.
        parsed_datetime = datetime.strptime(date_string, "%Y-%m-%d")
        # 시간 정보를 제외한 순수한 date 객체만 반환합니다.
        return parsed_datetime.date()
    except (ValueError, TypeError):
        # 형식이 맞지 않거나(ValueError), 문자열이 아닌 타입이 들어오면(TypeError) False를 반환합니다.
        return False