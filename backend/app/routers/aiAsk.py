import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from openai import APIError
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.AskOfEating import AskOfEating
from app.controller.aiAsk import getAiAnswer
from app.controller.extractFoodImage import extract_food_info
from app.database import get_db


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/aiAsk",
    tags=["ask_process"]
)

@router.post("/canIEat")
async def aiAsk(
    ask: AskOfEating,
    db: AsyncSession = Depends(get_db),
):
    
    answer = await getAiAnswer(ask, db)
    
    return answer


@router.post("/extract-food-info")
async def extractFoodInfo(image: UploadFile = File(...)):
    try:
        image_bytes = await image.read(10 * 1024 * 1024 + 1)
        return await extract_food_info(image_bytes, image.content_type or "")
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except APIError as error:
        logger.exception("Vision model API request failed")
        raise HTTPException(
            status_code=502,
            detail="비전 모델 API 요청에 실패했습니다. 잠시 후 다시 시도해주세요.",
        ) from error
    except RuntimeError as error:
        logger.exception("Vision model configuration failed")
        raise HTTPException(status_code=503, detail=str(error)) from error