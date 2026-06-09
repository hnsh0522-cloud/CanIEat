from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, func
from sqlalchemy.orm import relationship
from app.models.base import Base


class Users(Base):
    """
    users 테이블에 대응하는 SQLAlchemy ORM 모델
    """
    __tablename__ = "users"

    user_id: int = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="사용자 고유 ID, 자동 증가",
    )
    email: str = Column(
        String(255),
        unique=True,
        nullable=False,
        comment="사용자 이메일",
    )
    password_hash: str = Column(
        Text,
        nullable=False,
        comment="암호화된 비밀번호",
    )
    nickname: str = Column(
        String(50),
        nullable=False,
        comment="사용자 닉네임",
    )
    created_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        nullable=False,
        comment="가입일 / 생성일",
    )

    # Relationships
    user_allergies: list = relationship(
        "UserAllergies", back_populates="user", cascade="all, delete"
    )
    analysis_records: list = relationship(
        "AnalysisRecords", back_populates="user"
    )

    def __repr__(self) -> str:
        return f"<Users(user_id={self.user_id}, email={self.email!r}, nickname={self.nickname!r})>"