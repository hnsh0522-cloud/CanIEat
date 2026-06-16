from models import *

from sqlalchemy import Integer, String, ForeignKey, CheckConstraint


class DetectedAllergens(Base):
    """
    detected_allergens 테이블 - 분석 기록에서 탐지된 알레르기 성분 상세
    """
    __tablename__ = "detected_allergens"
    __table_args__ = (
        CheckConstraint(
            "risk_type IN ('MATCH', 'UNMATCH')",
            name="ck_detected_allergens_risk_type",
        ),
    )

    detected_id: int = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="탐지된 알레르기 성분 고유 ID, 자동 증가",
    )
    analysis_id: int = Column(
        Integer,
        ForeignKey("analysis_records.analysis_id", ondelete="CASCADE"),
        nullable=False,
        comment="연결된 분석 기록 ID, analysis_records 테이블 참조",
    )
    allergy_id: int | None = Column(
        Integer,
        ForeignKey("allergies.allergy_id", ondelete="SET NULL"),
        nullable=True,
        comment="탐지된 알레르기 ID, allergies 테이블 참조",
    )
    detected_ingredient: str = Column(
        String(100),
        nullable=False,
        comment="실제 분석에서 탐지된 성분명 예: 탈지분유, 밀가루",
    )
    risk_type: str | None = Column(
        String(20),
        nullable=True,
        comment="탐지 유형: MATCH 탐지됨 / UNMATCH 탐지되지 않음",
    )

    # Relationships
    analysis_record = relationship("AnalysisRecords", back_populates="detected_allergens")
    allergy = relationship("Allergies", back_populates="detected_allergens")

    def __repr__(self) -> str:
        return (
            f"<DetectedAllergens(detected_id={self.detected_id}, "
            f"analysis_id={self.analysis_id}, "
            f"detected_ingredient={self.detected_ingredient!r}, "
            f"risk_type={self.risk_type!r})>"
        )