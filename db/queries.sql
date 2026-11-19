-- =========================================================
-- CanIEat DB Query Functions
-- =========================================================


-- ---------------------------------------------------------
-- 1. 사용자 ID로 사용자 정보 조회
-- users 조회
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_by_id(
    p_user_id INT
)
RETURNS TABLE (
    user_id INT,
    email VARCHAR(255),
    nickname VARCHAR(50),
    created_at TIMESTAMP
)
LANGUAGE sql
AS $$
    SELECT
        u.user_id,
        u.email,
        u.nickname,
        u.created_at
    FROM users u
    WHERE u.user_id = p_user_id;
$$;


-- ---------------------------------------------------------
-- 로그인 처리를 위한 이메일 기반 사용자 조회
-- password_hash는 백엔드에서 비밀번호 검증할 때 사용
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_by_email(
    p_email VARCHAR
)
RETURNS TABLE (
    user_id INT,
    email VARCHAR(255),
    password_hash TEXT,
    nickname VARCHAR(50),
    created_at TIMESTAMP
)
LANGUAGE sql
AS $$
    SELECT
        u.user_id,
        u.email,
        u.password_hash,
        u.nickname,
        u.created_at
    FROM users u
    WHERE u.email = p_email;
$$;


-- ---------------------------------------------------------
-- 2. 전체 알레르기 종류 조회
-- allergies 조회
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION get_all_allergies()
RETURNS TABLE (
    allergy_id INT,
    allergy_name VARCHAR(50)
)
LANGUAGE sql
AS $$
    SELECT
        a.allergy_id,
        a.allergy_name
    FROM allergies a
    ORDER BY a.allergy_id;
$$;


-- ---------------------------------------------------------
-- 3. 특정 사용자의 알레르기 조회
-- user_allergies 조회
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_allergies(
    p_user_id INT
)
RETURNS TABLE (
    user_allergy_id INT,
    allergy_id INT,
    allergy_name VARCHAR(50),
    memo TEXT
)
LANGUAGE sql
AS $$
    SELECT
        ua.user_allergy_id,
        ua.allergy_id,
        a.allergy_name,
        ua.memo
    FROM user_allergies ua
    JOIN allergies a
        ON ua.allergy_id = a.allergy_id
    WHERE ua.user_id = p_user_id
    ORDER BY ua.user_allergy_id;
$$;


-- ---------------------------------------------------------
-- 4. 특정 사용자의 과거 분석 기록 조회
-- analysis_records 조회
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_analysis_history(
    p_user_id INT
)
RETURNS TABLE (
    analysis_id INT,
    product_name VARCHAR(255),
    risk_level VARCHAR(20),
    risk_type VARCHAR(20),
    result_message TEXT,
    created_at TIMESTAMP
)
LANGUAGE sql
AS $$
    SELECT
        ar.analysis_id,
        ar.product_name,
        ar.risk_level,

        -- 탐지된 MATCH 행이 하나라도 있으면 MATCH
        -- 아무것도 탐지되지 않았다면 UNMATCH
        (
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM detected_allergens da
                    WHERE da.analysis_id = ar.analysis_id
                      AND da.risk_type = 'MATCH'
                )
                THEN 'MATCH'
                ELSE 'UNMATCH'
            END
        )::VARCHAR(20) AS risk_type,

        ar.result_message,
        ar.created_at

    FROM analysis_records ar
    WHERE ar.user_id = p_user_id

    ORDER BY
        ar.created_at DESC,
        ar.analysis_id DESC;
$$;


-- ---------------------------------------------------------
-- 5. 특정 분석 기록 상세 조회
-- analysis_records 단건 조회
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION get_analysis_record(
    p_analysis_id INT
)
RETURNS TABLE (
    analysis_id INT,
    user_id INT,
    product_name VARCHAR(255),
    risk_level VARCHAR(20),
    risk_type VARCHAR(20),
    result_message TEXT,
    created_at TIMESTAMP
)
LANGUAGE sql
AS $$
    SELECT
        ar.analysis_id,
        ar.user_id,
        ar.product_name,
        ar.risk_level,

        (
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM detected_allergens da
                    WHERE da.analysis_id = ar.analysis_id
                      AND da.risk_type = 'MATCH'
                )
                THEN 'MATCH'
                ELSE 'UNMATCH'
            END
        )::VARCHAR(20) AS risk_type,

        ar.result_message,
        ar.created_at

    FROM analysis_records ar
    WHERE ar.analysis_id = p_analysis_id;
$$;


-- ---------------------------------------------------------
-- 6. 특정 분석에서 탐지된 알레르기 성분 조회
-- detected_allergens 조회
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION get_detected_allergens(
    p_analysis_id INT
)
RETURNS TABLE (
    detected_id INT,
    allergy_id INT,
    allergy_name VARCHAR(50),
    detected_ingredient VARCHAR(100),
    risk_type VARCHAR(20)
)
LANGUAGE sql
AS $$
    SELECT
        da.detected_id,
        da.allergy_id,
        a.allergy_name,
        da.detected_ingredient,
        da.risk_type

    FROM detected_allergens da

    LEFT JOIN allergies a
        ON da.allergy_id = a.allergy_id

    WHERE da.analysis_id = p_analysis_id

    ORDER BY da.detected_id;
$$;


-- ---------------------------------------------------------
-- 7. 사용자 섭취 주의사항 조회
-- user_restrictions 조회
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_restrictions(
    p_user_id INT
)
RETURNS TABLE (
    restriction_id INT,
    restriction_text TEXT,
    created_at TIMESTAMP
)
LANGUAGE sql
AS $$
    SELECT
        ur.restriction_id,
        ur.restriction_text,
        ur.created_at

    FROM user_restrictions ur

    WHERE ur.user_id = p_user_id

    ORDER BY
        ur.created_at DESC,
        ur.restriction_id DESC;
$$;