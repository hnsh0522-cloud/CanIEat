import json

from fastapi.concurrency import run_in_threadpool

from app.api.aiAsk_aiAPI import extract_food_info_from_image


MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
SUPPORTED_IMAGE_TYPES = {
    "image/jpeg": lambda image: image.startswith(b"\xff\xd8\xff"),
    "image/png": lambda image: image.startswith(b"\x89PNG\r\n\x1a\n"),
    "image/webp": lambda image: (
        len(image) >= 12 and image[:4] == b"RIFF" and image[8:12] == b"WEBP"
    ),
}


def _normalize_entries(value, field_name):
    if not isinstance(value, list):
        raise ValueError(f"{field_name}는 배열이어야 합니다.")

    entries = []
    for entry in value:
        if isinstance(entry, str):
            name, amount = entry.strip(), ""
        elif isinstance(entry, dict):
            name = entry.get("name", "")
            amount = entry.get("amount", "")
            if not isinstance(name, str) or not isinstance(amount, str):
                raise ValueError(f"{field_name} 항목의 name과 amount는 문자열이어야 합니다.")
            name, amount = name.strip(), amount.strip()
        else:
            raise ValueError(f"{field_name} 항목 형식이 올바르지 않습니다.")

        if name:
            entries.append({"name": name, "amount": amount})
    return entries


def _parse_food_info(response_text):
    if not isinstance(response_text, str) or not response_text.strip():
        raise ValueError("AI가 식품 정보를 반환하지 않았습니다.")

    try:
        result = json.loads(response_text)
    except json.JSONDecodeError as error:
        raise ValueError("AI 식품 정보 응답을 JSON으로 읽을 수 없습니다.") from error

    if not isinstance(result, dict):
        raise ValueError("AI 식품 정보 응답 형식이 올바르지 않습니다.")

    normalized = {}
    for field in ("food_name", "company_name", "report_number", "expiration_date"):
        value = result.get(field, "")
        if not isinstance(value, str):
            raise ValueError(f"{field}는 문자열이어야 합니다.")
        normalized[field] = value.strip()

    normalized["ingredients"] = _normalize_entries(
        result.get("ingredients", []), "ingredients"
    )
    normalized["nutrition"] = _normalize_entries(
        result.get("nutrition", []), "nutrition"
    )
    return normalized


async def extract_food_info(image_bytes, content_type):
    if not image_bytes:
        raise ValueError("이미지 파일이 비어 있습니다.")
    if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise ValueError("이미지 크기는 10MB 이하여야 합니다.")

    image_validator = SUPPORTED_IMAGE_TYPES.get(content_type)
    if image_validator is None or not image_validator(image_bytes):
        raise ValueError("JPEG, PNG 또는 WEBP 이미지 파일만 사용할 수 있습니다.")

    response_text = await run_in_threadpool(
        extract_food_info_from_image,
        image_bytes,
        content_type,
    )
    return _parse_food_info(response_text)
