



-- 1. 사용자 테스트 데이터
INSERT INTO users (
    email,
    password_hash,
    nickname
)
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




-- 2. 알레르기 기본 목록

INSERT INTO allergies (
    allergy_name
)
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



-- 3. 사용자별 알레르기

INSERT INTO user_allergies (
    user_id,
    allergy_id,
    memo
)
VALUES

-- user 1
(1, 1, '우유 및 유제품 성분 주의'),
(1, 2, '밀가루 성분 주의'),
(1, 3, '대두 관련 성분 주의'),

-- user 2
(2, 4, '땅콩 성분 섭취 금지'),
(2, 5, '계란 성분 주의'),

-- user 3
(3, 6, '새우 및 갑각류 성분 주의'),
(3, 10, '고등어 성분 주의'),

-- user 4
(4, 7, '복숭아 성분 주의'),
(4, 11, '토마토 성분 주의'),

-- user 5
(5, 8, '호두 성분 섭취 주의'),
(5, 4, '땅콩 성분도 함께 주의'),

-- user 6
(6, 9, '메밀 성분 주의'),
(6, 2, '밀 성분도 주의'),

-- user 7
(7, 1, '우유 성분 주의'),
(7, 5, '계란 성분 주의'),
(7, 6, '새우 성분 주의'),

-- user 8
(8, 12, '아황산류 성분 주의'),
(8, 3, '대두 성분 주의'),

-- user 10
(10, 1, '우유 단백질 관련 성분 주의');




-- 4. 사용자 섭취 주의사항
-- 알레르기와 별도로 사용자가 직접 작성하는 정보

INSERT INTO user_restrictions (
    user_id,
    restriction_text
)
VALUES
(1, '카페인이 들어간 식품은 피함'),
(1, '매운 음식 섭취 시 주의'),
(2, '돼지고기가 들어간 음식은 먹지 않음'),
(3, '너무 기름진 음식은 피함'),
(4, '찬 음식은 많이 먹지 않음'),
(5, '매운 음식은 피함'),
(6, '카페인 섭취를 줄이고 있음'),
(7, '너무 짠 음식은 피함'),
(8, '탄산음료 섭취 시 주의'),
(9, '고카페인 식품은 먹지 않음'),
(10, '유제품이 많이 들어간 식품은 피함');



-- 5. 분석 기록 테스트 데이터

-- 알레르기가 발견되면 UNSAFE
-- 알레르기가 없고 소비기한 문제가 없으면 SAFE
-- 알레르기는 없으나 소비기한 정보 등이 부족하면 CAUTION

INSERT INTO analysis_records (
    user_id,
    product_name,
    risk_level,
    result_message
)
VALUES

-- analysis_id 1
(
    1,
    '초코우유',
    'UNSAFE',
    '우유 관련 성분이 포함되어 있어 섭취를 피하는 것이 좋습니다.'
),

-- analysis_id 2
(
    1,
    '감자칩',
    'SAFE',
    '사용자가 등록한 알레르기 성분이 발견되지 않았으며 섭취에 문제가 없습니다.'
),

-- analysis_id 3
(
    2,
    '땅콩쿠키',
    'UNSAFE',
    '땅콩과 계란 성분이 포함되어 있어 섭취를 피하는 것이 좋습니다.'
),

-- analysis_id 4
(
    3,
    '냉동볶음밥',
    'CAUTION',
    '알레르기 성분은 발견되지 않았지만 소비기한 정보가 없어 주의가 필요합니다.'
),

-- analysis_id 5
(
    3,
    '새우볶음밥',
    'UNSAFE',
    '새우 관련 성분이 포함되어 있어 섭취를 피하는 것이 좋습니다.'
),

-- analysis_id 6
(
    4,
    '복숭아음료',
    'UNSAFE',
    '복숭아 관련 성분이 포함되어 있어 섭취를 피하는 것이 좋습니다.'
),

-- analysis_id 7
(
    5,
    '호두과자',
    'UNSAFE',
    '호두와 땅콩 관련 성분이 포함되어 있어 섭취를 피하는 것이 좋습니다.'
),

-- analysis_id 8
(
    6,
    '메밀면',
    'UNSAFE',
    '메밀과 밀 성분이 포함되어 있어 섭취를 피하는 것이 좋습니다.'
),

-- analysis_id 9
(
    7,
    '크림파스타',
    'UNSAFE',
    '우유와 계란 성분이 포함되어 있어 섭취를 피하는 것이 좋습니다.'
),

-- analysis_id 10
(
    8,
    '두유',
    'UNSAFE',
    '대두 관련 성분이 포함되어 있어 섭취를 피하는 것이 좋습니다.'
),

-- analysis_id 11
(
    9,
    '생수',
    'SAFE',
    '등록된 알레르기 성분이 발견되지 않았습니다.'
),

-- analysis_id 12
(
    10,
    '우유단백바',
    'UNSAFE',
    '우유 단백질 관련 성분이 포함되어 있어 섭취를 피하는 것이 좋습니다.'
);


-- ---------------------------------------------------------
-- 6. 분석에서 실제 탐지된 알레르기 성분
--
-- 실제 탐지된 성분만 이 테이블에 INSERT한다.
-- 탐지되지 않은 경우 UNMATCH 행을 만들지 않는다.
-- 조회 함수에서 탐지 행이 없으면 UNMATCH로 판단
-- ---------------------------------------------------------


INSERT INTO detected_allergens (
    analysis_id,
    allergy_id,
    detected_ingredient,
    risk_type
)
VALUES

-- analysis 1 / 초코우유 / user1
(1, 1, '우유분말', 'MATCH'),

-- analysis 3 / 땅콩쿠키 / user2
(3, 4, '땅콩', 'MATCH'),
(3, 5, '계란', 'MATCH'),

-- analysis 5 / 새우볶음밥 / user3
(5, 6, '새우추출물', 'MATCH'),

-- analysis 6 / 복숭아음료 / user4
(6, 7, '복숭아농축액', 'MATCH'),

-- analysis 7 / 호두과자 / user5
(7, 8, '호두', 'MATCH'),
(7, 4, '땅콩분말', 'MATCH'),

-- analysis 8 / 메밀면 / user6S
(8, 9, '메밀가루', 'MATCH'),
(8, 2, '밀', 'MATCH'),

-- analysis 9 / 크림파스타 / user7
(9, 1, '우유', 'MATCH'),
(9, 5, '계란', 'MATCH'),

-- analysis 10 / 두유 / user8
(10, 3, '대두레시틴', 'MATCH'),

-- analysis 12 / 우유단백바 / user10
(12, 1, '우유단백', 'MATCH');