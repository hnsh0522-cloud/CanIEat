from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.analysis_crud import get_user_analysis_records


async def loadAnalysisResult_process(
    db: AsyncSession,
    user_id: int,
) -> dict:
    """인증된 사용자의 분석 기록을 조회한다."""
    return await get_user_analysis_records(db=db, user_id=user_id)
