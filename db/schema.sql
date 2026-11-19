-- 1. 사용자
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 2. 알레르기 기본 목록 (계층 구조 반영)
CREATE TABLE allergies (
    allergy_id SERIAL PRIMARY KEY,
    allergy_name VARCHAR(50) UNIQUE NOT NULL,
    
    -- [추가] 상위(대표) 알레르기 ID (셀프 참조)
    -- 대표 알레르기는 NULL, 교차반응/세부 성분은 부모 알레르기의 allergy_id를 가짐
    parent_allergy_id INT NULL,
    CONSTRAINT fk_parent_allergy 
        FOREIGN KEY (parent_allergy_id) 
        REFERENCES allergies(allergy_id) 
        ON DELETE SET NULL
);


-- 3. 사용자별 알레르기
CREATE TABLE user_allergies (
    user_allergy_id SERIAL PRIMARY KEY,

    user_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    allergy_id INT NOT NULL
        REFERENCES allergies(allergy_id)
        ON DELETE CASCADE,

    memo TEXT,

    -- 같은 사용자가 같은 알레르기를 중복 등록하지 못하도록 설정
    UNIQUE (user_id, allergy_id)
);


-- 4. 분석 기록
CREATE TABLE analysis_records (
    analysis_id SERIAL PRIMARY KEY,

    -- 비회원 분석도 저장할 수 있으므로 NULL 허용
    user_id INT
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    -- 어떤 식품을 분석했는지 저장
    -- 현재 백엔드 연동이 완료되지 않았으므로 일단 NULL 허용
    product_name VARCHAR(255),

    risk_level VARCHAR(20) NOT NULL
        CHECK (risk_level IN ('SAFE', 'CAUTION', 'UNSAFE')),

    result_message TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 5. 분석에서 탐지된 알레르기 성분
CREATE TABLE detected_allergens (
    detected_id SERIAL PRIMARY KEY,

    analysis_id INT NOT NULL
        REFERENCES analysis_records(analysis_id)
        ON DELETE CASCADE,

    -- allergies 데이터가 삭제되더라도 과거 분석 기록은 유지
    -- (주의: 전처리 과정에 의해 확장된 세부 성분/교차반응 성분 ID가 저장됨)
    allergy_id INT
        REFERENCES allergies(allergy_id)
        ON DELETE SET NULL,

	-- 알러지 탐지되지 않은 알러지라면 감지된 성분이 없을테니 nullable 하게 저장
    detected_ingredient VARCHAR(100) NULL,

    -- 현재 AI 응답 형식과 동일하게 MATCH / UNMATCH 사용
    risk_type VARCHAR(20) NOT NULL
        CHECK (risk_type IN ('MATCH', 'UNMATCH')),

    -- 같은 분석에서 동일한 성분이 중복 저장되는 것을 방지
    UNIQUE (
        analysis_id,
        allergy_id,
        detected_ingredient
    )
);


-- 6. 사용자 섭취 주의사항
CREATE TABLE user_restrictions (
    restriction_id SERIAL PRIMARY KEY,

    user_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    restriction_text TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 같은 사용자가 같은 주의사항을 중복 등록하지 못하도록 설정
    UNIQUE (
        user_id,
        restriction_text
    )
);
