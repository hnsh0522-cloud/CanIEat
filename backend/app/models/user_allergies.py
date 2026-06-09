from sqlalchemy import Column, Integer, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import Base


class UserAllergies(Base):
    """
    user_allergies 테이블 - 사용자별 알레르기 매핑 (N:M 중간 테이블)
    """
    __tablename__ = "user_allergies"
    __table_args__ = (
        UniqueConstraint("user_id", "allergy_id", name="uq_user_allergy"),
    )

    user_allergy_id: int = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="사용자 알레르기 고유 ID, 자동 증가",
    )
    user_id: int = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        comment="사용자 ID, users 테이블 참조",
    )
    allergy_id: int = Column(
        Integer,
        ForeignKey("allergies.allergy_id", ondelete="CASCADE"),
        nullable=False,
        comment="알레르기 ID, allergies 테이블 참조",
    )
    memo: str | None = Column(
        Text,
        nullable=True,
        comment="사용자 알레르기 관련 메모",
    )

    # Relationships
    user = relationship("Users", back_populates="user_allergies")
    allergy = relationship("Allergies", back_populates="user_allergies")

    def __repr__(self) -> str:
        return f"<UserAllergies(user_allergy_id={self.user_allergy_id}, user_id={self.user_id}, allergy_id={self.allergy_id})>"