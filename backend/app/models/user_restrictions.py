from models import *

from sqlalchemy import (
    Integer,
    Text,
    ForeignKey,
    TIMESTAMP,
    func,
    UniqueConstraint,
    text
)
from sqlalchemy.ext.asyncio import AsyncSession


class UserRestrictions(Base):
    """
    user_restrictions 테이블 - 사용자별 음식 섭취 주의사항
    """

    __tablename__ = "user_restrictions"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "restriction_text",
            name="uq_user_restriction",
        ),
    )

    restriction_id: int = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="사용자 주의사항 고유 ID, 자동 증가",
    )

    user_id: int = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        comment="사용자 ID, users 테이블 참조",
    )

    restriction_text: str = Column(
        Text,
        nullable=False,
        comment="사용자가 음식 섭취 시 주의해야 할 내용",
    )

    created_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        nullable=False,
        comment="주의사항 등록 시간",
    )

    def __repr__(self) -> str:
        return (
            f"<UserRestrictions("
            f"restriction_id={self.restriction_id}, "
            f"user_id={self.user_id}, "
            f"restriction_text={self.restriction_text!r})>"
        )
