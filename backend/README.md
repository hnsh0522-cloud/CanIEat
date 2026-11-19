# Backend

## 인증 토큰

- `POST /login/`은 30분 유효한 Access Token을 응답으로 반환하고, 14일 유효한 Refresh Token을 HttpOnly 쿠키로 설정합니다.
- `POST /refresh`는 쿠키의 Refresh Token을 검증해 새 Access Token을 발급합니다. 프런트엔드는 인증 요청에서 401을 받으면 한 번 갱신을 시도한 뒤 원 요청을 재시도합니다.
- `POST /logout`은 브라우저의 Refresh Token 쿠키를 삭제합니다.
- HTTPS 운영 환경에서는 `REFRESH_TOKEN_COOKIE_SECURE=true`로 설정해야 합니다. Kubernetes 설정은 이를 활성화합니다. 로컬 HTTP 개발 환경에서는 기본값 `false`를 사용합니다.

토큰 유형을 구분하는 `type` 클레임이 없는 기존 토큰은 새 검증 로직에서 거부됩니다. 배포 후 기존 로그인 세션은 다시 로그인해야 합니다.

## 식품 분석 기능

- `POST /aiAsk/extract-food-info`는 JPEG, PNG 또는 WEBP 이미지(최대 10MB)를 받아 OpenRouter의 `qwen/qwen3-vl-30b-a3b-instruct`로 식품명, 업체명, 품목보고번호, 소비기한, 원료 및 표시된 영양성분을 추출합니다. 사진에서 확인되지 않는 정보는 추측하지 않으며, 프런트엔드는 결과를 분석 입력란에 채웁니다. 이 기능에도 `OPENROUTER_API_KEY` 설정이 필요합니다. 비전 모델 제공자 오류는 502로 반환하고 백엔드 로그에 기록합니다.
- `POST /aiAsk/canIEat`은 식품명, 제조일·소비기한, 원재료, 알레르기 및 개인 주의사항을 바탕으로 AI 분석을 수행하며, 선택 입력 `consumption_amount`(예: `1개 (30g)`)도 분석에 전달합니다. 결과에는 알레르기 성분 매칭, 소비기한 판정, 주의사항 및 분석 불확실성이 반영되며, 종합 위험도는 `safe`, `caution`, `unsafe` 중 하나입니다.
- `GET /getFoodDetail/`은 `food_name`, `report_number`, `company_name` 쿼리 매개변수로 식품 상세 정보를 조회합니다.
  - 식품안전나라 검색 결과를 우선하며, 식약처 영양성분 API에서 같은 품목보고번호가 확인되면 해당 식품을 선택합니다. 식약처 결과나 키가 없으면 식품안전나라 결과를 사용합니다.
  - 응답의 `ingredients`에는 식품안전나라 원재료와, 매칭된 식약처 결과에서 값이 있는 영양성분(`AMT_NUM`)이 함께 포함됩니다. 영양성분은 `{ "name": "에너지(kcal)", "amount": "507 (기준량: 100g)" }` 형태입니다.
  - 식품안전나라와 식약처 API는 조회 건수 기준 모든 페이지를 검색해 품목보고번호를 비교합니다. 페이지당 100건씩 요청하며, 조회 전체 건수나 페이지 수는 제한하지 않습니다. 외부 API 요청에는 클라이언트 타임아웃을 지정하지 않으므로 응답이 지연되면 요청이 오래 유지될 수 있습니다.
  - 로컬에서는 `backend/.env`에 재발급한 `MFDS_FOOD_API_SERVICE_KEY`를 설정하세요. 기존 `DATA_GO_KR_SERVICE_KEY` 환경 변수도 사용할 수 있습니다. 키가 없으면 백엔드 경고 로그를 남기고 식품안전나라 결과만 사용합니다.
  - Kubernetes에서 식약처 API를 사용하려면 `canieat-secrets` Secret에 `MFDS_FOOD_API_SERVICE_KEY` 항목을 추가하세요. 이 항목은 선택 사항입니다.
- 분석 결과 저장·조회·삭제 API는 로그인한 사용자만 사용할 수 있습니다.
  - `POST /analysis/save`: 분석 결과를 사용자 기록으로 저장합니다. 제품명, 위험도, 감지 성분, 알레르기 매칭 결과 및 결과 설명을 받습니다.
  - `GET /analysis/load`: 로그인한 사용자의 분석 기록을 조회합니다.
  - `DELETE /analysis/delete`: 요청 본문의 `analysis_ids`에 지정한 분석 기록을 삭제합니다. 다른 사용자의 기록은 사용자 ID 기준으로 분리됩니다.

## 회원 및 사용자 정보

- `POST /register/`로 이메일, 비밀번호, 닉네임을 받아 계정을 등록하고, `POST /login/`으로 로그인합니다.
- `GET /MyPage/loadUserState`는 로그인한 사용자의 알레르기와 개인 주의사항을 조회합니다.
- `POST /MyPage/saveUserState`는 알레르기 목록과 개인 주의사항 목록을 갱신합니다. 알레르기 이름은 서버에 등록된 알레르기 항목이어야 합니다.
- 마이페이지와 분석 기록 API는 Access Token 인증이 필요합니다. 사용자 식별은 요청 본문의 이메일이 아니라 검증된 토큰의 사용자 정보로 처리합니다.
- 현재 백엔드에는 닉네임·이메일·비밀번호 변경 및 회원 탈퇴 API가 등록되어 있지 않습니다.
