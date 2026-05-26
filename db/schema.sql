CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,                         -- 사용자 고유 ID
    email VARCHAR(255) UNIQUE NOT NULL,                 -- 사용자 이메일
    password_hash TEXT NOT NULL,                        -- 암호화된 비밀번호
    nickname VARCHAR(50) NOT NULL,                      -- 사용자 닉네임
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP -- 가입일 / 생성일
);

CREATE TABLE allergies (
    allergy_id SERIAL PRIMARY KEY,                      -- 알레르기 고유 ID
    allergy_name VARCHAR(50) UNIQUE NOT NULL,           -- 알레르기 이름 예: 우유, 밀, 대두
    description TEXT                                    -- 알레르기 설명
);

CREATE TABLE user_allergies (
    user_allergy_id SERIAL PRIMARY KEY,                 -- 사용자 알레르기 고유 ID
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- 사용자 ID
    allergy_id INT NOT NULL REFERENCES allergies(allergy_id) ON DELETE CASCADE, -- 알레르기 ID
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')), -- 알레르기 심각도
    memo TEXT,                                          -- 사용자 알레르기 관련 메모
    UNIQUE (user_id, allergy_id)                        -- 같은 사용자가 같은 알레르기를 중복 등록하지 못하도록 설정
);

CREATE TABLE analysis_records (
    analysis_id SERIAL PRIMARY KEY,                     -- 분석 기록 고유 ID
    user_id INT REFERENCES users(user_id) ON DELETE SET NULL, -- 분석을 요청한 사용자 ID
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('SAFE', 'CAUTION', 'UNSAFE')), -- 분석 위험도
    result_message TEXT NOT NULL,                       -- 사용자에게 보여줄 분석 결과 메시지
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 분석 생성일
    detected_ingredient VARCHAR(100) NOT NULL          -- 실제 분석에서 탐지된 성분명
);
