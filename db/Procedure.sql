-- 회원가입
CREATE OR REPLACE PROCEDURE register_user(
    p_email VARCHAR,
    p_password_hash TEXT,
    p_nickname VARCHAR,
    INOUT p_user_id INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM users
        WHERE email = p_email
    ) THEN
        RAISE EXCEPTION '이미 사용 중인 이메일입니다: %', p_email;
    END IF;

    INSERT INTO users (
        email,
        password_hash,
        nickname
    )
    VALUES (
        p_email,
        p_password_hash,
        p_nickname
    )
    RETURNING user_id INTO p_user_id;
END;
$$;




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
    p_product_name VARCHAR,
    p_risk_level VARCHAR,
    p_result_message TEXT,
    INOUT p_analysis_id INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO analysis_records (
        user_id,
        product_name,
        risk_level,
        result_message
    )
    VALUES (
        p_user_id,
        p_product_name,
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


-- 사용자가 먹지 못하는 음식 등록
CREATE OR REPLACE PROCEDURE add_user_avoid_food(
    p_user_id INT,
    p_food_name VARCHAR,
    p_reason TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO user_avoid_foods (
        user_id,
        food_name,
        reason
    )
    VALUES (
        p_user_id,
        p_food_name,
        p_reason
    )
    ON CONFLICT (user_id, food_name)
    DO UPDATE SET
        reason = EXCLUDED.reason;
END;
$$;

