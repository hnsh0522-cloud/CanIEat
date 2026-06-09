from pydantic import BaseModel
from typing import Optional
from typing import List
from datetime import date

class AskOfEating(BaseModel):
    food_name: str
    manufacture_date: Optional[date] = None
    expiration_date: Optional[str] = None
    allergy: Optional[List[str]] = None
    ingredients: Optional[List[str]] = None