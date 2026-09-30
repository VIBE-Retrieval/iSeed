# iSeed Frontend

Next.js 16 웹 서비스입니다. (포트 3000)

## 주요 화면

| 경로 | 화면 |
|------|------|
| `/` | 홈 |
| `/analysis` → `/analysis/analyzing` → `/analysis/result` | 마음검사 → 분석 진행 → 마음 리포트 |
| `/activities`, `/activities/[id]` | 마음활동 목록, 게임 |
| `/mypage` | 자녀 관리, 분석 기록, 나의 마음 씨앗 |
| `/login`, `/signup` | 로그인, 회원가입 |

## 구조

| 경로 | 내용 |
|------|------|
| `lib/iseed/config.ts` | 브랜드 문구, 메뉴 노출 플래그, 안내 문구 |
| `lib/iseed/seed.ts` | 마음 씨앗 성장 단계·포인트 (브라우저 저장) |
| `lib/activities/registry.ts` | 마음활동 목록 |
| `components/activities/` | 게임 실행 호스트와 게임 4종 |
| `public/games/emotion-jenga/` | 3D 게임 「감정 젠가」 (three.js), iframe 으로 연동 |

## 마음활동 추가하기

1. `components/activities/games/` 에 컴포넌트를 만들고 활동이 끝나면 `onComplete()` 호출
2. `lib/activities/registry.ts` 의 `ACTIVITIES`, `PLAYABLE_IDS` 에 등록
3. `components/activities/game-host.tsx` 의 `GAME_MAP` 에 추가
4. AI 추천에도 넣으려면 `iSeed-AiModels-Docker/recommendation_service.py` 의 `ACTIVITY_CATALOG` 에 같은 id 등록

## 실행

```bash
npm ci
npm run dev        # http://localhost:3000
```

`NEXT_PUBLIC_API_BASE_URL`(기본 `http://localhost:8000`), `NEXT_PUBLIC_AIMODELS_BASE_URL`(기본 `http://localhost:8080`)은 빌드 시점에 들어갑니다.
Docker 로 빌드할 때는 `docker-compose.yml` 이 자동으로 넣어 줍니다.
