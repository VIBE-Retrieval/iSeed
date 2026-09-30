# iSeed Backend

회원, 자녀 정보, 분석 기록을 관리하는 FastAPI 서버입니다. (포트 8000)

## 하는 일

| 기능 | 엔드포인트 |
|------|-----------|
| 회원가입 · 로그인 | `POST /auth/signup`, `POST /auth/login`, `POST /auth/me` |
| 소셜 로그인 | `GET /auth/kakao/login`, `GET /auth/google/login` (+ callback) |
| 자녀 관리 | `GET /children`, `POST /children` |
| 분석 기록 | `POST /drawing-analyses`, `GET /drawing-analyses`, `GET /drawing-analyses/{id}` |
| 프로필 이미지 | `PUT /users/me/profile-image` |
| 상태 | `GET /health` |

## 저장소

- **MongoDB** (Beanie): `users`, `children`, `counters`, `drawing_analyses`, `analysis_logs`
  - 사용자·자녀 번호는 정수로 발급 (`counters` 컬렉션)
  - 비밀번호는 `bcrypt(base64(sha256(password)))` 로 저장
- **AWS S3**: 프로필 이미지, 분석 결과 이미지
- MySQL 코드는 커뮤니티 기능(현재 메뉴 숨김)에만 남아 있으며, 접속할 수 없어도 서버는 정상 기동합니다.

## 환경 변수 (`.env`)

```ini
JWT_SECRET=임의의긴문자열
JWT_EXPIRES_SEC=172800
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=iseed
# 선택
S3_BUCKET= / S3_REGION= / S3_ACCESS_KEY_ID= / S3_SECRET_ACCESS_KEY=
KAKAO_CLIENT_ID= / KAKAO_CLIENT_SECRET= / GOOGLE_CLIENT_ID= / GOOGLE_CLIENT_SECRET=
AIMODELS_BASE_URL=http://localhost:8080
FRONTEND_BASE_URL=http://localhost:3000
```

## 단독 실행

```bash
docker build -t iseed-backend .
docker run -p 8000:8000 --env-file .env iseed-backend
```
