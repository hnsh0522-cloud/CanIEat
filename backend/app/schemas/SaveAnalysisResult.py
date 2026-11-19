from typing import Literal

from pydantic import BaseModel


class DetectedIngredient(BaseModel):
    ingredient: str
    allergy: str


class RiskType(BaseModel):
    allergy: str
    type: Literal["match", "unmatch"]


class SaveAnalysisResult(BaseModel):
    product_name: str
    risk_level: Literal["safe", "caution", "unsafe"]
    detected_ingredients: list[DetectedIngredient]
    risk_type: list[RiskType]
    result_message: str