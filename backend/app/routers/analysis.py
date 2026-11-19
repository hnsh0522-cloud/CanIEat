from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.controller.loadAnalysisResult import loadAnalysisResult_process
from app.controller.deleteAnalysisResult import deleteAnalysisResult_process
from app.controller.saveAnalysisResult import saveAnalysisResult_process
from app.database import get_db
from app.schemas.DeleteAnalysisResult import DeleteAnalysisResult
from app.schemas.SaveAnalysisResult import SaveAnalysisResult
from app.utils.auth import get_current_user

router = APIRouter(
    prefix="/analysis",
    tags=["analysis"]
)


@router.get("/load")
async def load_analysis_results(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """인증된 사용자의 분석 기록을 조회합니다."""
    return await loadAnalysisResult_process(
        db=db,
        user_id=current_user["user_id"],
    )


@router.delete("/delete")
async def delete_analysis_results(
    delete_request: DeleteAnalysisResult,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """인증된 사용자의 분석 기록들을 삭제합니다."""
    return await deleteAnalysisResult_process(
        delete_request=delete_request,
        db=db,
        user_id=current_user["user_id"],
    )


@router.post("/save")
async def save_analysis_result(
    analysis_result: SaveAnalysisResult,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    분석 결과를 저장하는 엔드포인트입니다.
    이 엔드포인트는 인증된 사용자만 접근할 수 있습니다.
    """
    return await saveAnalysisResult_process(
        analysis_result=analysis_result,
        db=db,
        user_id=current_user["user_id"],
    )