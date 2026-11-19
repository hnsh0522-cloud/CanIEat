from typing import Annotated

from pydantic import BaseModel, Field


class DeleteAnalysisResult(BaseModel):
    analysis_ids: list[Annotated[int, Field(gt=0)]] = Field(min_length=1)
