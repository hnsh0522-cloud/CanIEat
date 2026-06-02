-- 사용자 알레르기 등록
CREATE OR REPLACE PROCEDURE add_user_allergy(
    p_user_id INT,
    p_allergy_id INT,
    p_memo TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO user_allergies (
        user_id,
        allergy_id,
        memo
    )
    VALUES (
        p_user_id,
        p_allergy_id,
        p_memo
    )
    ON CONFLICT (user_id, allergy_id)
    DO UPDATE SET
        memo = EXCLUDED.memo;
END;
$$;






-- 분석 기록 저장
CREATE OR REPLACE PROCEDURE create_analysis_record(
    p_user_id INT,
    p_risk_level VARCHAR,
    p_result_message TEXT,
    INOUT p_analysis_id INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO analysis_records (
        user_id,
        risk_level,
        result_message
    )
    VALUES (
        p_user_id,
        p_risk_level,
        p_result_message
    )
    RETURNING analysis_id INTO p_analysis_id;
END;
$$;



-- 탐지된 알레르기 성분 저장
CREATE OR REPLACE PROCEDURE add_detected_allergen(
    p_analysis_id INT,
    p_allergy_id INT,
    p_detected_ingredient VARCHAR,
    p_risk_type VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO detected_allergens (
        analysis_id,
        allergy_id,
        detected_ingredient,
        risk_type
    )
    VALUES (
        p_analysis_id,
        p_allergy_id,
        p_detected_ingredient,
        p_risk_type
    );
END;
$$;

