# 원본(AiMind) → iSeed 변경 내역

원본 위치: `C:\Honey\Projects\mid-term\deploy` — **읽기 전용. 어떤 파일도 수정하지 않았습니다.**
신규 위치: `C:\공모전\GovTech 공모전\iSeed` — 완전히 독립된 복사본

복사 방식: `robocopy /E` (제외: `.git`, `venv`, `node_modules`, `.next`, `__pycache__`, `*.pyc`)
`deploy.zip`(1.7GB), `QA.txt`, `ppt.txt` 등 배포와 무관한 파일은 복사하지 않았습니다.

---

## 1. 폴더 매핑

| 원본 | iSeed |
|------|-------|
| `AiMind-AiModels-Docker` | `iSeed-AiModels-Docker` |
| `Aimind-Backend-Docker` | `iSeed-Backend-Docker` |
| `Aimind-Frontend-Docker` | `iSeed-Frontend-Docker` |
| `AiMind-OCR-Docker` | `iSeed-OCR-Docker` |
| *(신규)* | `rag/` — ChromaDB·논문·데이터셋·스크립트를 한곳에 모음 |
| *(신규)* | `docs/`, `docker-compose.yml`, `.env.example`, `start.ps1`, `stop.ps1`, `README.md` |

폴더명 변경이 안전한 이유: 파이썬 import는 모두 각 프로젝트 내부 상대 경로이고,
폴더명은 `docker-compose.yml` 의 build context 에서만 참조됩니다. (compose도 함께 수정)

---

## 2. 신규 파일

### AiModels
| 파일 | 내용 |
|------|------|
| `recommendation_service.py` | 마음활동 추천 엔진 (분석 결과 **후처리**, LLM 프롬프트 무수정) |

### Frontend
| 파일 | 내용 |
|------|------|
| `lib/iseed/config.ts` | 브랜드 상수 + Feature Flag + 면책 문구 |
| `lib/iseed/seed.ts` | 씨앗 성장 상태 (SEED→SPROUT→LEAF→TREE) |
| `lib/activities/registry.ts` | 마음활동 레지스트리 (카테고리 메타 포함) |
| `components/iseed/seed-card.tsx` | "나의 마음 씨앗" 카드 |
| `components/activities/game-host.tsx` | 게임 실행 + 포인트 적립 호스트 |
| `components/activities/games/calm-cloud.tsx` | 게임1 마음 구름 날리기 (호흡 4-2-6, 4사이클) |
| `components/activities/games/mood-color.tsx` | 게임2 오늘의 마음 색깔 (감정 5종 + 강도) |
| `components/activities/games/friend-feeling.tsx` | 게임3 친구의 마음은 어떨까? (상황 4개) |
| `components/home/seed-journey-section.tsx` | 홈 성장 여정 섹션 |
| `app/activities/page.tsx` | 마음활동 목록 |
| `app/activities/[id]/page.tsx` | 개별 활동 실행 |

### 루트
`docker-compose.yml`, `.env.example`, `.gitignore`, `start.ps1`, `stop.ps1`, `README.md`,
`docs/ARCHITECTURE.md`, `docs/CHANGES.md`,
`rag/scripts/init_rag.py`, `rag/chroma/`, `rag/papers/`, `rag/dataset/`

---

## 3. 수정 파일

### AiModels — `main.py` (추가만, 기존 로직 무수정)
1. `from recommendation_service import build_activity_recommendations, list_all_activities`
2. `HTP_DB_PATH = os.getenv("HTP_DB_PATH") or str(JSON_TO_LLM_DIR / "htp_knowledge_base")`
   → RAG 경로를 환경변수로 덮어쓸 수 있게. **미설정 시 원본과 동일 경로**
3. `rag_db_path=str(JSON_TO_LLM_DIR / "htp_knowledge_base")` → `rag_db_path=HTP_DB_PATH` (2곳)
4. `/analyze` 응답에 `activity_recommendations` 필드 **추가** (try/except 로 감쌈)
5. 저장 JSON(`전체결과_*.json`)에도 동일 필드 추가
6. 엔드포인트 신규: `GET /activities`, `POST /activities/recommend`, `GET /rag/status`

> 그림 전처리 · YOLO 탐지 · 특징 추출 · RAG 검색 · LLM 프롬프트 · 해석 파싱 ·
> T-Score 계산 · 또래 비교 · 전체 종합 해석 — **한 줄도 수정하지 않았습니다.**

### AiModels — `jsonToLlm/gemini_integration.py`, `jsonToLlm/store_to_chroma.py`
- 하드코딩된 임베딩 모델 `models/embedding-001` → `RAG_EMBEDDING_MODEL` 환경변수
  (기본값 `models/gemini-embedding-001`). **구글이 구모델 제공을 중단해 404가 나던 문제 수정.**
  자세한 내용은 아래 "6. 발견 사항" 참고. 그 외 프롬프트·해석 로직은 무수정.

### AiModels — `.dockerignore`
- `data/` 제외 규칙 삭제 → 또래 비교 통계(`label_stats_by_group.json`, 11MB)가
  이미지에 포함되어 **발달 비교 탭의 또래 비교가 Docker 환경에서도 동작**합니다.
  (원본 Docker 이미지에서는 이 파일이 빠져 해당 기능이 조용히 비활성 상태였습니다.)

### Backend — `config.py`, `main.py` (기동 안정화)
- 외부 MySQL / MongoDB / S3 설정이 없어도 **서버가 기동**되도록 기본값 + try/except
- 하드코딩되어 있던 MongoDB 접속 문자열을 코드에서 제거 (`.env` 로 이동)
- 값이 정상적으로 채워져 있으면 **원본과 100% 동일하게 동작**합니다.

### Frontend — 브랜드 치환 (17개 파일)
`아이마음` → `iSeed`, `/aimind.png|ico` → `/iseed.png|ico`
(원본 이미지 파일은 삭제하지 않고 `iseed.*` 사본을 추가)

주요 문구 변경:
| 위치 | 변경 |
|------|------|
| `app/layout.tsx` | title/description/favicon → iSeed(아이씨드) |
| `components/home/hero-section.tsx` | "아이의 작은 마음 신호를 발견하고, 함께 키워요 iSeed" / CTA "마음 씨앗 찾기 시작" |
| `components/layout/header.tsx` | 로고 + 네비게이션(Feature Flag 적용), "그림 분석"→"마음검사", "마음활동" 추가 |
| `components/layout/footer.tsx` | 슬로건, 플래그 기반 링크, 면책 문구 |
| `app/analysis/result/page.tsx` | 제목 "○○이의 iSeed 마음 리포트", 씨앗 카드, 추천 마음활동, 면책 문구, CTA 교체 |
| `app/analysis/result/AnalysisPdfDocument.tsx` | PDF 푸터 "— iSeed 마음 리포트" |
| `app/mypage/page.tsx` | 개요 탭에 씨앗 카드, 그림일기 탭 플래그 처리 |
| `app/page.tsx` | 홈 섹션을 플래그로 제어 + 성장 여정 섹션 추가 |
| `components/chatbot/chatbot-modal.tsx` | "iSeed 마음 도우미" |

### Frontend — `app/api/analysis-result/[filename]/route.ts`
- 원본 프로젝트 절대경로(`C:\Honey\Projects\mid-term\AiMind-AiModels\...`) 하드코딩 제거
- `ANALYSIS_RESULT_DIR` / `ANALYSIS_TEST_DIR` 환경변수로 분리, 미설정 시 404
- 운영 플로우는 AiModels의 base64 응답을 쓰므로 영향 없음

---

## 4. 숨긴 기능 (삭제 아님)

`lib/iseed/config.ts` 의 `FEATURES` 플래그를 `true` 로 바꾸면 즉시 복구됩니다.

| 기능 | 플래그 | 코드 상태 |
|------|--------|----------|
| 그림일기 OCR (`/diary-ocr`, 마이페이지 탭) | `diaryOcr: false` | 페이지·컴포넌트·API 모두 보존 |
| 맘스퀘어 커뮤니티 (`/community/**`) | `community: false` | 보존 |
| 주변 상담소 (`/counseling`) | `counseling: false` | 보존 |
| 맞춤 솔루션 (`/solutions`) | `solutions: false` | 보존 |
| OCR 서비스 컨테이너 | compose `profiles: ["ocr"]` | `--profile ocr` 로 실행 가능 |

Backend 의 `/diary-ocr`, `/community/*` API 는 그대로 살아 있습니다.

---

## 5. 표현 정책 (심리 분석 안내)

단정적 진단 표현을 쓰지 않습니다. `lib/iseed/config.ts::DISCLAIMER` 에 정의:

- 짧은 문구 — "이 결과는 전문적인 심리 진단을 대체하지 않습니다." (푸터, 활동 추천)
- 긴 문구 — 리포트 추천 탭 / 마음활동 페이지에 카드로 노출
- 추천 사유 문구는 모두 "**정서 신호가 관찰되었습니다**" 형태로 작성

**분석 엔진의 출력 자체는 전혀 변형하지 않습니다.** 사용자에게 보여주는 안내 문구만 추가했습니다.

---

## 6. 발견 사항 (중요)

### 원본 ChromaDB가 비어 있었습니다
원본 트리의 ChromaDB 4곳을 모두 검사한 결과 **모두 스키마만 있고 벡터는 0건**이었습니다.

```
AiMind\servers\ai\chroma_db\chroma.sqlite3                        embeddings = 0
AiMind\servers\ai\jsonToLlm\htp_knowledge_base\chroma.sqlite3     embeddings = 0
deploy\AiMind-AiModels-Docker\chroma_db\chroma.sqlite3            embeddings = 0
deploy\AiMind-AiModels-Docker\jsonToLlm\htp_knowledge_base\...    embeddings = 0
```

즉 원본 배포본에서 RAG 검색은 항상 빈 결과를 돌려주고 있었고
(`get_rag_context()` 가 예외 없이 `("", [])` 반환), LLM 해석만 수행되고 있었습니다.

**대응:** 원본 DB 파일을 그대로 `rag/chroma` 로 복사해 두고(기존 동작 유지),
지표 데이터셋 1,851건(`rag/dataset/htp_final_dataset.json`)과
`rag/scripts/init_rag.py` 를 함께 제공합니다.
아래 한 줄로 RAG를 **실제로 동작**시킬 수 있습니다.

```bash
docker compose run --rm aimodels python /app/rag/scripts/init_rag.py
```

적재 포맷·메타데이터는 원본 `store_to_chroma.py` 와 동일합니다.
(임베딩 모델만 현행 모델로 교체 — 아래 항목 참고)

> RAG를 채우면 리포트에 논문 근거가 추가되므로 LLM 해석 문장이 달라집니다.
> 그래서 **기본 동작은 원본 그대로 두고**, 별도 명령으로만 구축하도록 분리했습니다.

### 임베딩 모델이 제공 중단되어 있었습니다 (RAG가 동작하지 않던 근본 원인)

`jsonToLlm/gemini_integration.py` 와 `store_to_chroma.py` 는 임베딩 모델로
`models/embedding-001` 을 하드코딩하고 있었는데, 구글이 이 모델의 제공을 중단했습니다.

```
404 NOT_FOUND: models/embedding-001 is not found for API version v1beta,
               or is not supported for embedContent.
```

색인(`store_to_chroma.py`)이 이 오류로 실패했기 때문에 ChromaDB가 비어 있었고,
검색(`get_rag_context`)도 같은 오류를 내지만 `except: return "", []` 로 삼켜져
**RAG가 조용히 꺼진 상태**였습니다.

**대응:**
- `RAG_EMBEDDING_MODEL` 환경변수 도입 (기본값 `models/gemini-embedding-001` — 현행 모델)
- `gemini_integration.py`(검색 2곳) · `store_to_chroma.py` · `init_rag.py`(색인) 모두 동일 변수 사용
- `.env.example` / `docker-compose.yml` 에 기본값 명시
- ⚠️ **색인과 검색이 반드시 같은 모델**이어야 합니다. 모델을 바꾸면 `init_rag.py --force` 로 재색인하세요.

**결과:** `rag/chroma` 에 HTP 지표 **1,851건**이 실제로 적재되었고,
`GET /rag/status` 가 `ready: true` 를 반환합니다.

### ChromaDB HNSW 인덱스가 디스크에 flush 되지 않는 문제

chromadb 1.x 는 벡터 본체를 `chroma.sqlite3` 에 쓰고, 검색용 HNSW 인덱스는
`<persist_dir>/<segment-uuid>/` 에 별도 파일로 둡니다.
색인 프로세스가 인덱스를 flush 하기 전에 종료되면 이 디렉터리가 불완전해지고,
이후 검색이 다음 오류로 실패합니다.

```
chromadb.errors.InternalError: Error executing plan:
  Error sending backfill request to compactor: Error loading hnsw index
```

`get_rag_context()` 는 이 예외도 삼키므로(`except: return "", []`)
**벡터는 1,851건 들어 있는데 검색 결과는 항상 0건**인 상태가 됩니다.

**대응:**
- `rag/scripts/init_rag.py` — 적재 후 클라이언트를 해제하고 인덱스 정합성을 검증,
  깨져 있으면 벡터 세그먼트 디렉터리를 지워 sqlite 로부터 **자동 재구축**
- `GET /rag/status` — `index_ok` 필드 추가. 인덱스를 실제로 열어 보고 판정하므로
  "벡터는 있는데 검색이 안 되는" 상태를 `ready: false` 로 잡아냅니다.
  손상 시 `index_error` 와 복구 방법(`hint`)을 함께 반환합니다.

**검증:** 실제 검색이 논문 근거를 반환하는 것을 확인했습니다.

```
쿼리: "나무 기둥이 가늘고 위축된 느낌"
 - 작고 외소한 나무 기둥에 외상의 흔적이 많음 → 무기력·위축, 우울 잠재
   (어린이의 HTP 검사 반응에 대한 해석과 특징연구.pdf)
 - 크기 비율 33% 이하 → 열등감·무력감 시사
   (인공지능 객체검출모델 기반 집-나무-사람(HTP) 그림검사의 형식적 해석 연구.pdf)
```

---

## 7. 2차 정리 (2026-09-29)

### 7-1. 그림일기 OCR 완전 삭제
공모전 AI 기능을 **챗봇 2종 + 그림 해석** 으로 확정하면서 OCR 은 숨김이 아니라 삭제했습니다.

| 영역 | 삭제 내용 |
|------|----------|
| 서비스 | `iSeed-OCR-Docker/` 폴더 전체 (231MB) |
| Backend | `/diary-ocr`, `/diary-ocr/extract`, `/diary-ocr/extract-stream` 엔드포인트, `DiaryOcrEntry` 모델, `upload_diary_ocr_image_to_s3`, `OCR_BASE_URL`, `analysis_logs.ocr_json` 필드 |
| Frontend | `/diary-ocr` 페이지, `/api/ocr` 라우트, `components/diary-ocr.tsx`, `components/mypage/diary-ocr.tsx`, 마이페이지 그림일기 탭, 홈 `DiaryShowcase`, 메뉴·플래그(`diaryOcr`), 미사용 `RAG_USER_GUIDE.txt` |
| 설정 | compose `ocr` 서비스·프로필, `OCR_PORT`, `start.ps1 -WithOcr`, `stop.ps1` 프로필 |
| 챗봇 | 가이드 문서의 OCR 섹션, OCR 키워드 보강 로직 |

> MongoDB 의 `diary_ocr` 컬렉션(10건)은 **데이터라서 지우지 않았습니다.** 코드에서는 더 이상 읽지 않습니다.

### 7-2. 회원가입·로그인 MySQL → MongoDB
- 원인: RDS 호스트가 DNS 조회조차 되지 않음 (인스턴스 없음). MongoDB Atlas 는 정상.
- `users`, `children`, `counters` 컬렉션 신설 (`user_mongo.py`). 정수 ID 유지로 프론트 무수정.
- 대상: 회원가입, 로그인, `/auth/me`, 카카오·구글 로그인, 아이 등록/목록, 프로필 이미지.
- MySQL 은 커뮤니티(숨김) 에만 남음. 기동 시 접속 타임아웃 5초.
- 기존 MySQL 회원 계정은 옮기지 못했습니다 (RDS 접속 불가).

### 7-3. 원본 비밀번호 해시 버그 수정
- `hash_password` 가 SHA-256 **원시 바이트**를 bcrypt 에 넣어, digest 에 NUL(0x00) 이 섞이면
  `password may not contain NUL bytes` 로 실패 → **비밀번호 약 8개 중 1개는 가입 불가**.
- 수정: `base64(sha256)` 로 인코딩 후 bcrypt. 예전 방식 해시도 로그인되도록 호환 유지.
- 검증: 무작위 300개 전부 성공 (예전 방식이었다면 실패했을 33개 포함).

### 7-4. 가이드 챗봇
| 문제 | 수정 |
|------|------|
| 벡터DB 경로가 `./chroma_db`(상대경로)이고, 폴더가 "있기만 하면" 로드 → Docker 에 빈 폴더가 미리 생성되어 **검색 결과가 항상 0건** | 모듈 기준 절대경로 `chatbot/guide_chroma`, 비어 있거나 문서가 바뀌면 재생성 |
| 임베딩 `all-MiniLM-L6-v2`(영어 전용) → 한국어 질문 검색 적중 **3/8** | Gemini 임베딩으로 교체 → **8/8** (런타임 HuggingFace 모델 다운로드도 불필요) |
| 요청마다 문서 분할·임베딩 모델·벡터DB 재생성 | 프로세스당 1회 캐시 |
| 가이드 문서가 초기 시안 기준 (그림 1장 업로드, OCR, 커뮤니티 등) | 현재 iSeed 화면 기준으로 새로 작성 (마음검사·리포트·마음활동·씨앗·FAQ) |
| 프롬프트 브랜드 "아이마음", OCR 언급 | iSeed 로 변경, 진단 표현 금지 규칙 추가 |
| 미사용 `iSeed-AiModels-Docker/chroma_db/` (벡터 0건) | 삭제 |

### 7-5. 분석 결과 후속 질문 챗봇
| 문제 | 수정 |
|------|------|
| 그림별 해석을 존재하지 않는 `전체_요약` 키로만 찾아서 **해석 내용이 LLM 에 전혀 전달되지 않음** | 실제 키(인상적_해석, 정서_영역_소견 등) 사용 |
| 전체 종합 해석(`전체_심리_결과`), T-Score 세부, 정서 상태를 프론트가 보내지 않음 | 프론트 `chatbot-modal.tsx` 에서 추가 전송, 대용량 필드(image_json 등)는 제외 |
| 분석 텍스트가 비면 `chain` 미정의로 `UnboundLocalError` → 500 | 안내 문구로 대체해 정상 응답 |
| 프론트 대체 응답(API 실패 시)이 숨긴 메뉴(상담소·맘스퀘어)를 안내 | 마음검사·마음활동 안내로 교체 |

### 7-6. Gemini 모델 / 키
| 문제 | 수정 |
|------|------|
| 그림 해석이 `gemini-2.5-flash-lite` 하드코딩 → **신규 사용자 키로는 404** | `GEMINI_MODEL` 환경변수, 기본 `gemini-3.5-flash-lite` (구글 권장 후속 모델) |
| 챗봇이 `gemini-flash-latest` 별칭 → 구글이 `gemini-3.8-flash`(무료 **하루 20회**)로 바꾸면서 429 | 고정 모델 `CHATBOT_MODEL`(기본 = `GEMINI_MODEL`), 재시도 2회로 제한 |
| 챗봇은 `GOOGLE_API_KEY`, 해석은 `GEMINI_API_KEYS` 를 써서 키가 다르면 기능마다 다른 키 사용 | 챗봇도 해석과 같은 우선순위로 키를 명시 전달 |
| compose `environment` 의 `${GEMINI_API_KEY:-}` 가 루트 .env 에 값이 없으면 **빈 문자열로 키를 덮어씀** | 해당 줄 제거 (env_file 만 사용) |

> ⚠️ 그림 해석 모델이 바뀌었으므로 해석 문장은 원본과 달라질 수 있습니다. 원본 모델은 신규 키로 호출할 수 없어 불가피합니다.

### 7-7. 마음활동 게임 4 「감정 젠가」 추가 (2026-09-30)

보호자와 아이가 함께하는 three.js 3D 게임을 마음활동으로 통합했습니다.

| 항목 | 내용 |
|------|------|
| 게임 본체 | `iSeed-Frontend-Docker/public/games/emotion-jenga/index.html` (받은 파일 사본, 단독 실행도 가능) |
| 원본 대비 수정 | 한 판이 끝나면 iSeed 에 결과를 알리는 `notifyISeed()` 함수 **1개만 추가** (질문 1개 이상일 때만, 같은 출처로만 전송) |
| 화면 연동 | `components/activities/games/emotion-jenga.tsx` — iframe 으로 표시, 종료 메시지를 받아 씨앗 +30점, 마이크·전체 화면 허용 |
| 등록 | `lib/activities/registry.ts`(분야: 자기표현, 약 15분, +30점), `game-host.tsx`, AiModels `recommendation_service.py` 카탈로그 |
| 가이드 챗봇 | 가이드 문서에 감정 젠가 섹션 추가 (인덱스 자동 재생성 확인, 48조각) |

- 효과: 그동안 **자기표현 분야에는 실행 가능한 활동이 없어서** 분석에서 자기표현 신호가 가장 강해도 추천되지 않았음 → 이제 1순위로 추천됨
  (실제 분석 결과로 확인: 자기표현 52.3점 → 추천 1순위 감정 젠가)
- 외부 의존: three.js r128(cdnjs), 구글 폰트 — 인터넷 연결 필요
- 음성 인식은 Chrome·Edge 에서 지원, 미지원 브라우저는 `다 말했어요` 버튼으로 진행

검증
- 시작 → 보호자 안내 → 게임 시작(엄마 차례) → 질문 표시 → `다 말했어요` 별 3개 → 차례 전환 → `그만` → 오늘의 탑 리포트
- iSeed 씨앗 0 → 30점, 기록 "질문 1개 · 별 3개 · 1분 (열린 감정: 슬픔·걱정 1)", 화면에 "+30 자랐어요" 표시
- 질문 0개로 바로 종료 시 포인트 미지급 확인
- 가이드 챗봇 "감정 젠가는 어떻게 하는 거예요?" → 규칙·색깔별 질문·마이크 안내까지 정확히 답변

### 7-8. 파비콘 교체 (2026-09-30)
- `app/favicon.ico` 에 남아 있던 Next.js 기본 아이콘(검은 원·흰 삼각형)을 iSeed 아이콘으로 교체
- `app/favicon.ico`, `public/iseed.ico` 모두 원본 `public/iseed.png` 로 다중 크기(16·32·48·64·128·256px) ICO 재생성
  (기존 iseed.ico 는 256px 한 가지뿐이라 탭 크기에서 흐릿할 수 있었음)
