from pydantic import BaseModel
from typing import List, Optional, Union
from datetime import date


class Ingredient(BaseModel):
    name: str
    amount: Optional[str] = None


class AskOfEating(BaseModel):
    food_name: str
    manufacture_date: Optional[date] = None
    expiration_date: Optional[str] = None
    consumption_amount: Optional[str] = None
    allergies: Optional[List[str]] = None
    ingredients: Optional[List[Union[str, Ingredient]]] = None
    precautions: Optional[List[str]] = None