-- 사용자별 알레르기 조회
SELECT
    u.nickname AS user_name,
    a.allergy_name AS allergy_name,
    ua.severity AS severity,
    ua.memo AS memo
FROM user_allergies ua
JOIN users u ON ua.user_id = u.user_id
JOIN allergies a ON ua.allergy_id = a.allergy_id
ORDER BY u.user_id;


-- 분석 기록 조회
SELECT
    u.nickname AS user_name,
    ar.analysis_id AS analysis_id,
    ar.risk_level AS risk_level,
    ar.result_message AS analysis_message,
    ar.created_at AS created_at
FROM analysis_records ar
JOIN users u ON ar.user_id = u.user_id
ORDER BY ar.created_at DESC;



-- 분석에서 발견된 알레르기 성분 조회
SELECT
    ar.analysis_id AS analysis_id,
    u.nickname AS user_name,
    a.allergy_name AS allergy_name,
    da.detected_ingredient AS detected_ingredient,
    da.risk_type AS risk_type,
    ar.risk_level AS risk_level
FROM detected_allergens da
JOIN analysis_records ar ON da.analysis_id = ar.analysis_id
JOIN users u ON ar.user_id = u.user_id
JOIN allergies a ON da.allergy_id = a.allergy_id
ORDER BY ar.analysis_id;



-- 최종 분석 결과 전체 조회
SELECT
    u.nickname AS user_name,
    ar.analysis_id AS analysis_id,
    ar.risk_level AS risk_level,
    COALESCE(a.allergy_name, 'none') AS detected_allergy,
    COALESCE(da.detected_ingredient, 'none') AS detected_ingredient,
    COALESCE(da.risk_type, 'none') AS risk_type,
    ar.result_message AS analysis_message,
    ar.created_at AS created_at
FROM analysis_records ar
JOIN users u ON ar.user_id = u.user_id
LEFT JOIN detected_allergens da ON ar.analysis_id = da.analysis_id
LEFT JOIN allergies a ON da.allergy_id = a.allergy_id
ORDER BY ar.analysis_id;


-- 사용자별 먹지 못하는 음식 조회
SELECT
    u.nickname AS user_name,
    uaf.avoid_food_id AS avoid_food_id,
    uaf.food_name AS food_name,
    uaf.reason AS reason,
    uaf.created_at AS created_at
FROM user_avoid_foods uaf
JOIN users u ON uaf.user_id = u.user_id
WHERE uaf.user_id = 1
ORDER BY uaf.created_at DESC;
