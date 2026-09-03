CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,                         -- 사용자 고유 ID, 자동 증가
    email VARCHAR(255) UNIQUE NOT NULL,                 -- 사용자 이메일
    password_hash TEXT NOT NULL,                        -- 암호화된 비밀번호
    nickname VARCHAR(50) NOT NULL,                      -- 사용자 닉네임
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP       -- 가입일 / 생성일
);

CREATE TABLE allergies (
    allergy_id SERIAL PRIMARY KEY,                      -- 알레르기 고유 ID, 자동 증가
    allergy_name VARCHAR(50) UNIQUE NOT NULL,           -- 알레르기 이름 예: 우유, 밀, 대두, 땅콩
);

CREATE TABLE user_allergies (
    user_allergy_id SERIAL PRIMARY KEY, -- 사용자 알레르기 고유 ID, 자동 증가
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- 사용자 ID, users 테이블 참조                                                      
    allergy_id INT NOT NULL REFERENCES allergies(allergy_id) ON DELETE CASCADE,  -- 알레르기 ID, allergies 테이블 참조                                                        
    memo TEXT,    -- 사용자 알레르기 관련 메모                                      
    UNIQUE (user_id, allergy_id)  -- 같은 사용자가 같은 알레르기를 중복 등록하지 못하도록 설정                      
);

CREATE TABLE analysis_records (
    analysis_id SERIAL PRIMARY KEY,   -- 분석 기록 고유 ID, 자동 증가
    user_id INT REFERENCES users(user_id) ON DELETE SET NULL,  -- 분석을 요청한 사용자 ID, users 테이블 참조                                                    
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('SAFE', 'CAUTION', 'UNSAFE')),  -- 분석 결과 전체 위험도: SAFE / CAUTION / UNSAFE                                                
    result_message TEXT,   -- 사용자에게 보여줄 분석 결과 메시지                             
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP   -- 분석 생성일 / 분석 기록 저장 시간
);

CREATE TABLE detected_allergens (
    detected_id SERIAL PRIMARY KEY,    -- 탐지된 알레르기 성분 고유 ID, 자동 증가
    analysis_id INT NOT NULL REFERENCES analysis_records(analysis_id) ON DELETE CASCADE,  -- 연결된 분석 기록 ID, analysis_records 테이블 참조                                                 
    allergy_id INT REFERENCES allergies(allergy_id) ON DELETE SET NULL, -- 탐지된 알레르기 ID, allergies 테이블 참조                                                    
    detected_ingredient VARCHAR(100) NOT NULL,  -- 실제 분석에서 탐지된 성분명 예: 탈지분유, 밀가루
    risk_type VARCHAR(20) CHECK (risk_type IN ('MATCH', 'UNMATCH'))  --탐지 유형: MATCH 정확히 일치 / UMATCH 성분 불일치
    );

CREATE TABLE user_avoid_foods (
    avoid_food_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    food_name VARCHAR(100) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, food_name)
);
