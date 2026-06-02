
-- 사용자 테스트 데이터
INSERT INTO users (email, password_hash, nickname)
VALUES
('test1@example.com', 'hashed_password_test1', 'test_user1'),
('test2@example.com', 'hashed_password_test2', 'test_user2'),
('test3@example.com', 'hashed_password_test3', 'test_user3'),
('test4@example.com', 'hashed_password_test4', 'test_user4'),
('test5@example.com', 'hashed_password_test5', 'test_user5'),
('test6@example.com', 'hashed_password_test6', 'test_user6'),
('test7@example.com', 'hashed_password_test7', 'test_user7'),
('test8@example.com', 'hashed_password_test8', 'test_user8'),
('test9@example.com', 'hashed_password_test9', 'test_user9'),
('test10@example.com', 'hashed_password_test10', 'test_user10');


-- 알레르기 기본 목록
INSERT INTO allergies (allergy_name)
VALUES
('우유'),
('밀'),
('대두'),
('땅콩'),
('계란'),
('새우'),
('복숭아'),
('호두'),
('메밀'),
('고등어'),
('토마토'),
('아황산류');


-- 사용자별 알레르기 정보
INSERT INTO user_allergies (user_id, allergy_id, memo)
VALUES
(1, 1, '우유 및 유제품 성분 주의'),
(1, 2, '밀가루 성분 주의'),
(1, 3, '대두 관련 성분 주의'),

(2, 4, '땅콩 성분 섭취 금지'),
(2, 5, '계란 성분 주의'),

(3, 6, '새우 및 갑각류 성분 주의'),
(3, 10, '고등어 성분 주의'),

(4, 7, '복숭아 성분 주의'),
(4, 11, '토마토 성분 주의'),

(5, 8, '호두 성분 섭취 주의'),
(5, 4, '땅콩 성분도 함께 주의'),

(6, 9, '메밀 성분 주의'),
(6, 2, '밀 성분도 주의'),

(7, 1, '우유 성분 주의'),
(7, 5, '계란 성분 주의'),
(7, 6, '새우 성분 주의'),

(8, 12, '아황산류 성분 주의'),
(8, 3, '대두 성분 주의'),

(10, 1, '우유 단백질 관련 성분 주의');


-- 분석 기록 테스트 데이터
INSERT INTO analysis_records (
    user_id,
    risk_level,
    result_message
)
VALUES
(
    1,
    'CAUTION',
    '우유, 밀, 대두 관련 성분이 포함되어 있어 해당 알레르기가 있는 사용자는 주의가 필요합니다.'
),
(
    1,
    'SAFE',
    '사용자의 등록된 알레르기 성분이 발견되지 않았습니다.'
),
(
    2,
    'UNSAFE',
    '땅콩과 계란 성분이 포함되어 있어 해당 알레르기가 있는 사용자는 섭취를 피하는 것이 좋습니다.'
),
(
    3,
    'CAUTION',
    '새우 및 고등어 관련 성분이 포함되어 있어 주의가 필요합니다.'
),
(
    3,
    'UNSAFE',
    '새우 성분이 직접 포함되어 있어 해당 알레르기가 있는 사용자는 섭취를 피하는 것이 좋습니다.'
),
(
    4,
    'CAUTION',
    '복숭아와 토마토 관련 성분이 포함되어 있어 주의가 필요합니다.'
),
(
    5,
    'UNSAFE',
    '호두와 땅콩 관련 성분이 포함되어 있어 섭취에 주의가 필요합니다.'
),
(
    6,
    'CAUTION',
    '메밀과 밀 관련 성분이 포함되어 있어 주의가 필요합니다.'
),
(
    7,
    'UNSAFE',
    '우유, 계란, 새우 성분이 포함되어 있어 섭취를 피하는 것이 좋습니다.'
),
(
    8,
    'CAUTION',
    '아황산류와 대두 관련 성분이 포함되어 있어 주의가 필요합니다.'
),
(
    9,
    'SAFE',
    '사용자의 등록된 알레르기 성분이 발견되지 않았습니다.'
),
(
    10,
    'CAUTION',
    '우유 단백질 관련 성분이 포함되어 있어 주의가 필요합니다.'
);


-- 분석에서 탐지된 알레르기 성분
INSERT INTO detected_allergens (
    analysis_id,
    allergy_id,
    detected_ingredient,
    risk_type
)
VALUES
-- analysis_id 1: user1 / CAUTION
(1, 1, '우유분말', 'SIMILAR'),
(1, 2, '밀가루', 'SIMILAR'),
(1, 3, '대두단백', 'SIMILAR'),

-- analysis_id 3: user2 / UNSAFE
(3, 4, '땅콩', 'MATCH'),
(3, 5, '계란', 'MATCH'),

-- analysis_id 4: user3 / CAUTION
(4, 6, '새우추출물', 'SIMILAR'),
(4, 10, '고등어분말', 'SIMILAR'),

-- analysis_id 5: user3 / UNSAFE
(5, 6, '새우', 'MATCH'),

-- analysis_id 6: user4 / CAUTION
(6, 7, '복숭아농축액', 'SIMILAR'),
(6, 11, '토마토페이스트', 'SIMILAR'),

-- analysis_id 7: user5 / UNSAFE
(7, 8, '호두', 'MATCH'),
(7, 4, '땅콩분말', 'SIMILAR'),

-- analysis_id 8: user6 / CAUTION
(8, 9, '메밀가루', 'SIMILAR'),
(8, 2, '밀', 'MATCH'),

-- analysis_id 9: user7 / UNSAFE
(9, 1, '우유', 'MATCH'),
(9, 5, '계란', 'MATCH'),
(9, 6, '새우', 'MATCH'),

-- analysis_id 10: user8 / CAUTION
(10, 12, '아황산류', 'MATCH'),
(10, 3, '대두레시틴', 'SIMILAR'),

-- analysis_id 12: user10 / CAUTION
(12, 1, '우유단백', 'SIMILAR');
