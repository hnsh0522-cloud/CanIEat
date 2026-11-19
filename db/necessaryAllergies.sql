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

-- [우유 관련] (대표 ID 찾아서 매핑)
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('산양유', (SELECT allergy_id FROM allergies WHERE allergy_name = '우유')),
('염소유', (SELECT allergy_id FROM allergies WHERE allergy_name = '우유')),
('치즈', (SELECT allergy_id FROM allergies WHERE allergy_name = '우유')),
('버터', (SELECT allergy_id FROM allergies WHERE allergy_name = '우유')),
('분유', (SELECT allergy_id FROM allergies WHERE allergy_name = '우유')),
('크림', (SELECT allergy_id FROM allergies WHERE allergy_name = '우유'));

-- [육류 관련 교차반응]
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('베이컨', (SELECT allergy_id FROM allergies WHERE allergy_name = '돼지고기')),
('햄', (SELECT allergy_id FROM allergies WHERE allergy_name = '돼지고기')),
('양고기', (SELECT allergy_id FROM allergies WHERE allergy_name = '돼지고기')),
('오리고기', (SELECT allergy_id FROM allergies WHERE allergy_name = '닭고기')),
('칠면조', (SELECT allergy_id FROM allergies WHERE allergy_name = '닭고기')),
('메추리', (SELECT allergy_id FROM allergies WHERE allergy_name = '닭고기'));

-- [갑각류 및 해산물 관련]
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('랍스터', (SELECT allergy_id FROM allergies WHERE allergy_name = '새우')),
('문어', (SELECT allergy_id FROM allergies WHERE allergy_name = '오징어')),
('낙지', (SELECT allergy_id FROM allergies WHERE allergy_name = '오징어')),
('바지락', (SELECT allergy_id FROM allergies WHERE allergy_name = '조개류')),
('가리비', (SELECT allergy_id FROM allergies WHERE allergy_name = '조개류'));

-- [견과류 및 콩류 관련]
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('피칸', (SELECT allergy_id FROM allergies WHERE allergy_name = '호두')),
('캐슈넛', (SELECT allergy_id FROM allergies WHERE allergy_name = '호두')),
('피스타치오', (SELECT allergy_id FROM allergies WHERE allergy_name = '호두')),
('완두콩', (SELECT allergy_id FROM allergies WHERE allergy_name = '대두')),
('강낭콩', (SELECT allergy_id FROM allergies WHERE allergy_name = '대두'));

-- [난류 및 과일류 관련]
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('메추리알', (SELECT allergy_id FROM allergies WHERE allergy_name = '난류')),
('오리알', (SELECT allergy_id FROM allergies WHERE allergy_name = '난류')),
('자두', (SELECT allergy_id FROM allergies WHERE allergy_name = '복숭아')),
('살구', (SELECT allergy_id FROM allergies WHERE allergy_name = '복숭아')),
('사과', (SELECT allergy_id FROM allergies WHERE allergy_name = '토마토'));

-- ==========================================
-- 추가 교차반응 및 하위 세부 성분 등록 쿼리
-- ==========================================

-- [밀 관련 곡물 교차반응]
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('보리', (SELECT allergy_id FROM allergies WHERE allergy_name = '밀')),
('호밀', (SELECT allergy_id FROM allergies WHERE allergy_name = '밀')),
('귀리', (SELECT allergy_id FROM allergies WHERE allergy_name = '밀'));

-- [땅콩 및 대두(콩과 식물) 교차반응 확장]
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('렌틸콩', (SELECT allergy_id FROM allergies WHERE allergy_name = '땅콩')),
('병아리콩', (SELECT allergy_id FROM allergies WHERE allergy_name = '땅콩')),
('루핀콩', (SELECT allergy_id FROM allergies WHERE allergy_name = '땅콩'));

-- [갑각류 및 어패류/연체동물 교차반응 (트로포마이오신 공유)]
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('소라', (SELECT allergy_id FROM allergies WHERE allergy_name = '조개류'));

-- [견과류(Tree Nuts) 교차반응]
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('마카다미아', (SELECT allergy_id FROM allergies WHERE allergy_name = '호두')),
('브라질너트', (SELECT allergy_id FROM allergies WHERE allergy_name = '호두'));

-- [과일 및 채소 교차반응 (라텍스 및 구강알레르기증후군 연계)]
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('키위', (SELECT allergy_id FROM allergies WHERE allergy_name = '복숭아')),
('바나나', (SELECT allergy_id FROM allergies WHERE allergy_name = '복숭아')),
('아보카도', (SELECT allergy_id FROM allergies WHERE allergy_name = '토마토'));





-- ==========================================
-- 3단계: 하위 성분이 부족한 대표 알러지 보완 등록 (최소 5개 확보용)
-- ==========================================

-- [메밀 관련 교차반응] (마디풀과 및 유사 곡물/채소)
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('타르트류', (SELECT allergy_id FROM allergies WHERE allergy_name = '메밀')),
('루바브', (SELECT allergy_id FROM allergies WHERE allergy_name = '메밀')),
('퀴노아', (SELECT allergy_id FROM allergies WHERE allergy_name = '메밀')),
('아마란스', (SELECT allergy_id FROM allergies WHERE allergy_name = '메밀'));

-- [잣 관련 교차반응] (기타 나무견과류 및 씨앗류)
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('잣기름', (SELECT allergy_id FROM allergies WHERE allergy_name = '잣')),
('해바라기씨', (SELECT allergy_id FROM allergies WHERE allergy_name = '잣')),
('호박씨', (SELECT allergy_id FROM allergies WHERE allergy_name = '잣')),
('참깨', (SELECT allergy_id FROM allergies WHERE allergy_name = '잣')),
('들깨', (SELECT allergy_id FROM allergies WHERE allergy_name = '잣'));

-- [고등어 관련 교차반응] (등푸른 생선 및 유사 어류 - 파르알부민 단백질 공유)
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('참치', (SELECT allergy_id FROM allergies WHERE allergy_name = '고등어')),
('정어리', (SELECT allergy_id FROM allergies WHERE allergy_name = '고등어')),
('꽁치', (SELECT allergy_id FROM allergies WHERE allergy_name = '고등어')),
('청어', (SELECT allergy_id FROM allergies WHERE allergy_name = '고등어')),
('연어', (SELECT allergy_id FROM allergies WHERE allergy_name = '고등어'));

-- [쇠고기 관련 교차반응] (포유류 육류 및 부산물)
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('송아지고기', (SELECT allergy_id FROM allergies WHERE allergy_name = '쇠고기')),
('소곱창', (SELECT allergy_id FROM allergies WHERE allergy_name = '쇠고기')),
('사골육수', (SELECT allergy_id FROM allergies WHERE allergy_name = '쇠고기')),
('젤라틴', (SELECT allergy_id FROM allergies WHERE allergy_name = '쇠고기')),
('우유단백분말', (SELECT allergy_id FROM allergies WHERE allergy_name = '쇠고기'));

-- [굴 / 전복 / 홍합 등 패류·연체동물 확장]
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('홍합추출물', (SELECT allergy_id FROM allergies WHERE allergy_name = '굴')),
('석화', (SELECT allergy_id FROM allergies WHERE allergy_name = '굴')),
('소라살', (SELECT allergy_id FROM allergies WHERE allergy_name = '굴')),
('전복죽', (SELECT allergy_id FROM allergies WHERE allergy_name = '굴')),
('성게알', (SELECT allergy_id FROM allergies WHERE allergy_name = '굴'));

INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('오징어젓갈', (SELECT allergy_id FROM allergies WHERE allergy_name = '전복')),
('개불', (SELECT allergy_id FROM allergies WHERE allergy_name = '전복')),
('우렁이', (SELECT allergy_id FROM allergies WHERE allergy_name = '전복')),
('다슬기', (SELECT allergy_id FROM allergies WHERE allergy_name = '전복'));

INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('꼬막', (SELECT allergy_id FROM allergies WHERE allergy_name = '홍합')),
('대합', (SELECT allergy_id FROM allergies WHERE allergy_name = '홍합')),
('맛조개', (SELECT allergy_id FROM allergies WHERE allergy_name = '홍합')),
('홍합탕', (SELECT allergy_id FROM allergies WHERE allergy_name = '홍합')),
('참소라', (SELECT allergy_id FROM allergies WHERE allergy_name = '홍합'));

-- [토마토 관련 교차반응] (가지과 식물 및 라텍스 연계 과채류)
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('감자', (SELECT allergy_id FROM allergies WHERE allergy_name = '토마토')),
('가지', (SELECT allergy_id FROM allergies WHERE allergy_name = '토마토')),
('피망', (SELECT allergy_id FROM allergies WHERE allergy_name = '토마토')),
('파프리카', (SELECT allergy_id FROM allergies WHERE allergy_name = '토마토')),
('고추', (SELECT allergy_id FROM allergies WHERE allergy_name = '토마토'));

-- [아황산류 관련 교차반응] (보존제 및 아황산염 함유 식품군)
INSERT INTO allergies (allergy_name, parent_allergy_id) VALUES 
('와인', (SELECT allergy_id FROM allergies WHERE allergy_name = '아황산류')),
('말린과일', (SELECT allergy_id FROM allergies WHERE allergy_name = '아황산류')),
('맥주', (SELECT allergy_id FROM allergies WHERE allergy_name = '아황산류')),
('과일농축액', (SELECT allergy_id FROM allergies WHERE allergy_name = '아황산류')),
('식초', (SELECT allergy_id FROM allergies WHERE allergy_name = '아황산류'));