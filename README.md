# CanIEat

식품 성분 및 알레르기 안전 분석 웹 앱입니다.

## 실행 방법

```bash
npm install
cp .env.example .env   # VITE_GEMINI_API_KEY 설정
npm run dev            # 개발 서버 (http://localhost:5173)
```

## 웹 앱 배포

```bash
npm run build          # dist/ 폴더 생성
npm run preview        # 빌드 결과 미리보기
```

- Vercel, Netlify 등 정적 호스팅에 `dist` 폴더를 배포하면 됩니다.
- SPA 라우팅을 위해 `vercel.json`, `public/_redirects`가 포함되어 있습니다.
- 모바일 브라우저에서 홈 화면에 추가하면 PWA처럼 사용할 수 있습니다.

## 주요 기능

- 식품 성분 분석 및 알레르기 위험도 판단
- 회원가입/로그인 및 알레르기 프로필 관리 (localStorage 저장)
- Gemini AI 기반 식품 성분 질문
- 모바일 반응형 UI 및 다크 모드
=======
this is project for web app that analyze and decide whether you can eat or not
