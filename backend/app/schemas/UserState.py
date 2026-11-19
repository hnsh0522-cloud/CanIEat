from pydantic import BaseModel
from typing import Optional
from typing import List

class UserState(BaseModel):
    email: str
    allergies: Optional[List[str]] = None
    restrictions: Optional[List[str]] = None