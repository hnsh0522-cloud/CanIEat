INSERT INTO users (email, password_hash, nickname)
VALUES
('test1@example.com', 'hashed_password_test1', 'test_user1'),
('test2@example.com', 'hashed_password_test2', 'test_user2'),
('test3@example.com', 'hashed_password_test3', 'test_user3'),
('test4@example.com', 'hashed_password_test4', 'test_user4');


INSERT INTO allergies (allergy_name, description)
VALUES
('우유', '우유 및 유제품에 포함된 성분에 대한 알레르기'),
('밀', '밀가루 및 글루텐 관련 성분에 대한 알레르기'),
('대두', '콩 또는 대두 성분에 대한 알레르기'),
('땅콩', '땅콩 성분에 대한 알레르기'),
('계란', '계란 및 난류 성분에 대한 알레르기');


INSERT INTO user_allergies (user_id, allergy_id, severity, memo)
VALUES
(1, 1, 'HIGH', '우유 성분 섭취 시 주의 필요'),
(1, 2, 'MEDIUM', '밀 성분 주의'),
(1, 3, 'LOW', '대두 성분 약간 주의'),
(2, 4, 'HIGH', '땅콩 성분 섭취 금지'),
(2, 5, 'MEDIUM', '계란 성분 주의');


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
);

INSERT INTO detected_allergens (
    analysis_id,
    allergy_id,
    detected_ingredient,
    risk_type
)
VALUES
(1, 1, '우유분말', 'SIMILAR'),
(1, 2, '밀가루', 'SIMILAR'),
(1, 3, '대두단백', 'SIMILAR'),
(3, 4, '땅콩분말', 'SIMILAR'),
(3, 5, '계란', 'MATCH');





