from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.analysis_crud import delete_analysis_results
from app.schemas.DeleteAnalysisResult import DeleteAnalysisResult


async def deleteAnalysisResult_process(
    delete_request: DeleteAnalysisResult,
    db: AsyncSession,
    user_id: int,
) -> dict:
    """인증된 사용자가 소유한 분석 기록들을 삭제한다."""
    analysis_ids = list(dict.fromkeys(delete_request.analysis_ids))
    return await delete_analysis_results(
        db=db,
        user_id=user_id,
        analysis_ids=analysis_ids,
    )
