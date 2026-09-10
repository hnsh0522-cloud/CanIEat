from models import *

from sqlalchemy import Integer, Text, ForeignKey, TIMESTAMP, String, func, CheckConstraint


class AnalysisRecords(Base):
    """
    analysis_records 테이블 - 식품 성분 분석 기록
    """
    __tablename__ = "analysis_records"
    __table_args__ = (
        CheckConstraint(
            "risk_level IN ('SAFE', 'CAUTION', 'UNSAFE')",
            name="ck_analysis_records_risk_level",
        ),
    )

    analysis_id: int = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="분석 기록 고유 ID, 자동 증가",
    )
    user_id: int | None = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
        comment="분석을 요청한 사용자 ID, users 테이블 참조",
    )
    risk_level: str = Column(
        String(20),
        nullable=False,
        comment="분석 결과 전체 위험도: SAFE / CAUTION / UNSAFE",
    )
    result_message: str | None = Column(
        Text,
        nullable=True,
        comment="사용자에게 보여줄 분석 결과 메시지",
    )
    created_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        nullable=False,
        comment="분석 생성일 / 분석 기록 저장 시간",
    )

    # Relationships
    user = relationship("Users", back_populates="analysis_records")
    detected_allergens: list = relationship(
        "DetectedAllergens", back_populates="analysis_record", cascade="all, delete"
    )

    def __repr__(self) -> str:
        return f"<AnalysisRecords(analysis_id={self.analysis_id}, user_id={self.user_id}, risk_level={self.risk_level!r})>"