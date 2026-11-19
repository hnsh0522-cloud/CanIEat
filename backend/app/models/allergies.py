from models import *

from typing import List, Optional
from sqlalchemy import Integer, String, ForeignKey

class Allergies(Base):
    """
    allergies 테이블 - 알레르기 종류 목록
    """
    __tablename__ = "allergies"

    allergy_id: int = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="알레르기 고유 ID, 자동 증가",
    )
    allergy_name: str = Column(
        String(50),
        unique=True,
        nullable=False,
        comment="알레르기 이름 예: 우유, 밀, 대두, 땅콩",
    )
    parent_allergy_id: int | None = Column(
        Integer,
        ForeignKey("allergies.allergy_id", ondelete="SET NULL"),
        nullable=True,
        comment="상위 대표 알레르기 ID",
    )

    # Relationships
    parent: Optional["Allergies"] = relationship(
        "Allergies",
        remote_side="Allergies.allergy_id",
        back_populates="children",
    )
    children: List["Allergies"] = relationship(
        "Allergies",
        back_populates="parent",
    )
    user_allergies: list = relationship(
        "UserAllergies", back_populates="allergy", cascade="all, delete"
    )
    detected_allergens: list = relationship(
        "DetectedAllergens", back_populates="allergy"
    )

    def __repr__(self) -> str:
        return (
            f"<Allergies(allergy_id={self.allergy_id}, "
            f"allergy_name={self.allergy_name!r}, "
            f"parent_allergy_id={self.parent_allergy_id})>"
        )