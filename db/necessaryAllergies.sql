-- ==========================================
-- 1단계: 대표 알러지 22종 등록 (부모)
-- ==========================================
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('메밀', NULL),
('밀', NULL),
('땅콩', NULL),
('대두', NULL),
('호두', NULL),
('잣', NULL),
('돼지고기', NULL),
('닭고기', NULL),
('쇠고기', NULL),
('고등어', NULL),
('게', NULL),
('새우', NULL),
('오징어', NULL),
('조개류', NULL),
('굴', NULL),
('전복', NULL),
('홍합', NULL),
('난류', NULL),
('우유', NULL),
('복숭아', NULL),
('토마토', NULL),
('아황산류', NULL);


-- ==========================================
-- 2단계: 주요 교차반응 및 하위 세부 성분 등록 (자식)
-- (부모의 allergy_id를 서브쿼리로 안전하게 매핑)
-- ==========================================

-- ==========================================
-- 1. 우유 관련
-- ==========================================
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('산양유', (SELECT allergy_id FROM allergies WHERE allergy_name = '우유')),
('염소유', (SELECT allergy_id FROM allergies WHERE allergy_name = '우유')),
('치즈', (SELECT allergy_id FROM allergies WHERE allergy_name = '우유')),
('버터', (SELECT allergy_id FROM allergies WHERE allergy_name = '우유')),
('분유', (SELECT allergy_id FROM allergies WHERE allergy_name = '우유')),
('크림', (SELECT allergy_id FROM allergies WHERE allergy_name = '우유'));


-- ==========================================
-- 2. 육류 관련
-- ==========================================

-- 돼지고기 가공식품
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('베이컨', (SELECT allergy_id FROM allergies WHERE allergy_name = '돼지고기')),
('햄', (SELECT allergy_id FROM allergies WHERE allergy_name = '돼지고기'));

-- 닭고기와 다른 조류 육류
-- 조류 간 단백질 유사성에 따른 교차반응 가능성
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('오리고기', (SELECT allergy_id FROM allergies WHERE allergy_name = '닭고기')),
('칠면조', (SELECT allergy_id FROM allergies WHERE allergy_name = '닭고기')),
('메추리', (SELECT allergy_id FROM allergies WHERE allergy_name = '닭고기'));

-- 쇠고기 관련
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('소곱창', (SELECT allergy_id FROM allergies WHERE allergy_name = '쇠고기')),
('젤라틴', (SELECT allergy_id FROM allergies WHERE allergy_name = '쇠고기'));


-- ==========================================
-- 3. 갑각류 및 해산물 관련
-- ==========================================

-- 갑각류 간 교차반응
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('랍스터', (SELECT allergy_id FROM allergies WHERE allergy_name = '새우'));

-- 두족류 간 교차반응
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('문어', (SELECT allergy_id FROM allergies WHERE allergy_name = '오징어')),
('낙지', (SELECT allergy_id FROM allergies WHERE allergy_name = '오징어')),
('오징어젓갈', (SELECT allergy_id FROM allergies WHERE allergy_name = '오징어'));

-- 조개류 및 연체동물 간 교차반응
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('바지락', (SELECT allergy_id FROM allergies WHERE allergy_name = '조개류')),
('가리비', (SELECT allergy_id FROM allergies WHERE allergy_name = '조개류')),
('소라', (SELECT allergy_id FROM allergies WHERE allergy_name = '조개류'));

-- 굴 관련
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('홍합추출물', (SELECT allergy_id FROM allergies WHERE allergy_name = '굴')),
('석화', (SELECT allergy_id FROM allergies WHERE allergy_name = '굴')),
('소라살', (SELECT allergy_id FROM allergies WHERE allergy_name = '굴'));

-- 전복 관련
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('우렁이', (SELECT allergy_id FROM allergies WHERE allergy_name = '전복')),
('다슬기', (SELECT allergy_id FROM allergies WHERE allergy_name = '전복'));

-- 홍합 관련
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('꼬막', (SELECT allergy_id FROM allergies WHERE allergy_name = '홍합')),
('대합', (SELECT allergy_id FROM allergies WHERE allergy_name = '홍합')),
('맛조개', (SELECT allergy_id FROM allergies WHERE allergy_name = '홍합')),
('홍합탕', (SELECT allergy_id FROM allergies WHERE allergy_name = '홍합')),
('참소라', (SELECT allergy_id FROM allergies WHERE allergy_name = '홍합'));


-- ==========================================
-- 4. 견과류 및 콩류 관련
-- ==========================================

-- 호두와 피칸의 강한 교차반응
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('피칸', (SELECT allergy_id FROM allergies WHERE allergy_name = '호두'));

-- 대두와 다른 콩과 식물
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('완두콩', (SELECT allergy_id FROM allergies WHERE allergy_name = '대두')),
('강낭콩', (SELECT allergy_id FROM allergies WHERE allergy_name = '대두'));

-- 땅콩과 다른 콩과 식물
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('렌틸콩', (SELECT allergy_id FROM allergies WHERE allergy_name = '땅콩')),
('병아리콩', (SELECT allergy_id FROM allergies WHERE allergy_name = '땅콩')),
('루핀콩', (SELECT allergy_id FROM allergies WHERE allergy_name = '땅콩'));


-- ==========================================
-- 5. 난류 관련
-- ==========================================
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('메추리알', (SELECT allergy_id FROM allergies WHERE allergy_name = '난류')),
('오리알', (SELECT allergy_id FROM allergies WHERE allergy_name = '난류'));


-- ==========================================
-- 6. 과일 관련
-- ==========================================

-- 복숭아와 장미과 과일 간 교차반응 가능성
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('자두', (SELECT allergy_id FROM allergies WHERE allergy_name = '복숭아')),
('살구', (SELECT allergy_id FROM allergies WHERE allergy_name = '복숭아'));


-- ==========================================
-- 7. 밀 관련 곡물
-- ==========================================
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('보리', (SELECT allergy_id FROM allergies WHERE allergy_name = '밀')),
('호밀', (SELECT allergy_id FROM allergies WHERE allergy_name = '밀')),
('귀리', (SELECT allergy_id FROM allergies WHERE allergy_name = '밀'));


-- ==========================================
-- 8. 고등어 및 다른 생선
-- ==========================================
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('참치', (SELECT allergy_id FROM allergies WHERE allergy_name = '고등어')),
('정어리', (SELECT allergy_id FROM allergies WHERE allergy_name = '고등어')),
('꽁치', (SELECT allergy_id FROM allergies WHERE allergy_name = '고등어')),
('청어', (SELECT allergy_id FROM allergies WHERE allergy_name = '고등어')),
('연어', (SELECT allergy_id FROM allergies WHERE allergy_name = '고등어'));


-- ==========================================
-- 9. 토마토 및 가지과 식물
-- ==========================================
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('감자', (SELECT allergy_id FROM allergies WHERE allergy_name = '토마토')),
('가지', (SELECT allergy_id FROM allergies WHERE allergy_name = '토마토')),
('피망', (SELECT allergy_id FROM allergies WHERE allergy_name = '토마토')),
('파프리카', (SELECT allergy_id FROM allergies WHERE allergy_name = '토마토')),
('고추', (SELECT allergy_id FROM allergies WHERE allergy_name = '토마토'));


-- ==========================================
-- 10. 아황산류 함유 가능 식품
-- ==========================================
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES
('와인', (SELECT allergy_id FROM allergies WHERE allergy_name = '아황산류')),
('맥주', (SELECT allergy_id FROM allergies WHERE allergy_name = '아황산류')),
('과일농축액', (SELECT allergy_id FROM allergies WHERE allergy_name = '아황산류')),
('식초', (SELECT allergy_id FROM allergies WHERE allergy_name = '아황산류'));