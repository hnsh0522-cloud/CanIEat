


-- 1. 회원가입


CREATE OR REPLACE PROCEDURE register_user(
    p_email VARCHAR,
    p_password_hash TEXT,
    p_nickname VARCHAR,
    INOUT p_user_id INT
)
LANGUAGE plpgsql
AS $$
BEGIN

    -- 이메일 중복 확인
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
    RETURNING user_id
    INTO p_user_id;

END;
$$;



-- 2. 알레르기 종류 등록


CREATE OR REPLACE PROCEDURE add_allergy(
    p_allergy_name VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN

    INSERT INTO allergies (
        allergy_name
    )
    VALUES (
        p_allergy_name
    )
    ON CONFLICT (allergy_name)
    DO NOTHING;

END;
$$;





-- 3. 사용자 알레르기 등록

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

    -- 이미 존재하면 중복 행을 만들지 않고 memo 수정
    ON CONFLICT (user_id, allergy_id)
    DO UPDATE SET
        memo = EXCLUDED.memo;

END;
$$;





-- 4. 분석 기록 저장


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

        -- safe / SAFE 둘 다 받아도 DB에는 SAFE로 저장
        UPPER(p_risk_level),

        p_result_message
    )
    RETURNING analysis_id
    INTO p_analysis_id;

END;
$$;


-- 5. 탐지된 알레르기 성분 저장


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
        UPPER(p_risk_type)
    )

    -- 같은 분석 결과가 중복 요청되어도
    -- 동일 성분이 계속 추가되는 것을 방지
    ON CONFLICT (
        analysis_id,
        allergy_id,
        detected_ingredient
    )
    DO UPDATE SET
        risk_type = EXCLUDED.risk_type;

END;
$$;



-- 6. 사용자 섭취 주의사항 등록


CREATE OR REPLACE PROCEDURE add_user_restriction(
    p_user_id INT,
    p_restriction_text TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN

    INSERT INTO user_restrictions (
        user_id,
        restriction_text
    )
    VALUES (
        p_user_id,
        p_restriction_text
    )

    -- 같은 사용자가 같은 주의사항을 두 번 등록하지 않도록 처리
    ON CONFLICT (
        user_id,
        restriction_text
    )
    DO NOTHING;

END;
$$;












-- UPDATE / DELETE 프로시저









-- 사용자 닉네임 수정

CREATE OR REPLACE PROCEDURE update_user_nickname(
    p_user_id INT,
    p_nickname VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN

    UPDATE users
    SET nickname = p_nickname
    WHERE user_id = p_user_id;

END;
$$;






-- 사용자 알레르기 삭제

CREATE OR REPLACE PROCEDURE delete_user_allergy(
    p_user_id INT,
    p_allergy_id INT
)
LANGUAGE plpgsql
AS $$
BEGIN

    DELETE FROM user_allergies
    WHERE user_id = p_user_id
      AND allergy_id = p_allergy_id;

END;
$$;




-- 사용자 섭취 주의사항 수정
CREATE OR REPLACE PROCEDURE update_user_restriction(
    p_restriction_id INT,
    p_user_id INT,
    p_restriction_text TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN

    UPDATE user_restrictions
    SET restriction_text = p_restriction_text
    WHERE restriction_id = p_restriction_id
      AND user_id = p_user_id;

END;
$$;



-- 사용자 섭취 주의사항 삭제
CREATE OR REPLACE PROCEDURE delete_user_restriction(
    p_restriction_id INT,
    p_user_id INT
)
LANGUAGE plpgsql
AS $$
BEGIN

    DELETE FROM user_restrictions
    WHERE restriction_id = p_restriction_id
      AND user_id = p_user_id;

END;
$$;