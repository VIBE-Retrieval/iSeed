# iSeed 아키텍처 상세

원본 프로젝트(AiMind)의 AI 분석 파이프라인을 **그대로 보존**하고,
그 위에 iSeed 브랜드 · 마음활동 · 씨앗 성장 레이어를 얹은 구조입니다.

---

## 1. 그림 분석 파이프라인 (원본 그대로 보존)

`POST /analyze` (AiModels, 포트 8080)

입력: 그림 4장 (`tree`, `house`, `man`, `woman`) + `child_name`, `child_age`, `child_gender`

```
for 각 그림 in [나무, 집, 남자사람, 여자사람]:
  │
  ├─ 1. 업로드 저장            main.py::_save_upload_file
  │     → jsonToLlm/results/{이름}_{나이}_{성별}_{시각}/
  │
  ├─ 2. YOLO 객체 탐지          image_to_json/image_to_json.py::run(output_format="rag")
  │     가중치: image_to_json/{object}_weights/{male|female}/best.pt
  │     → 구성요소 좌표/크기/포함관계 JSON + 박스 이미지(base64)
  │
  ├─ 3. 포맷 변환               jsonToLlm/legacy_converter.py
  │     is_new_format() → convert_new_to_legacy()
  │
  ├─ 4. RAG 검색                jsonToLlm/gemini_integration.py::get_rag_context
  │     ChromaDB(HTP_DB_PATH) + GoogleGenerativeAIEmbeddings(RAG_EMBEDDING_MODEL = gemini-embedding-001)
  │     similarity_search(k=10) → 참고 지표 텍스트 + 출처 논문 목록
  │
  ├─ 5. LLM 해석                gemini_integration.py::analyze_and_interpret
  │     GEMINI_MODEL(기본 gemini-3.5-flash-lite), temperature=0.2, max_output_tokens=8192
  │     프롬프트: jsonToLlm/interpretation_prompts.py
  │     → 인상적_해석 / 구조적_해석 / 표상적_해석 / 심리_상태_소견 / 추천_사항
  │
  └─ 6. 이미지 지표             analysis_metrics.py::compute_image_metrics
        → 면적비, 위치, 선 강도 등

──────────────────────────────────────────────────────────────
7. 또래 비교        analysis_metrics.py::compute_peer_summary_by_folder
                    data/label_stats_by_group.json (연령×성별 통계)

8. T-Score 산출     drawing_score.py::compute_scores_for_analysis
                    drawing_norm_dist_stats.csv
                    → 에너지 / 위치 안정성 / 표현력 점수, 종합 점수, 발달 단계

9. 전체 종합 해석   gemini_integration.py::generate_overall_psychology
                    RAG 재검색 + 4장 해석 종합
                    → 종합_요약 / 인상적_분석 / 구조적_분석_요약 /
                      표상적_분석_종합 / 긍정적인_측면 / 주의_사항

10. 추천 사항 집계  main.py (LLM 출력의 추천_사항을 3개 카테고리로 병합)

11. 🆕 마음활동 추천  recommendation_service.py::build_activity_recommendations
                     ※ 위 결과를 "읽기만" 하는 후처리 레이어
──────────────────────────────────────────────────────────────
→ 응답 JSON + jsonToLlm/results/{run}/전체결과_*.json 저장
```

### 응답 스키마 (주요 필드)

```jsonc
{
  "success": true,
  "child": { "name": "…", "age": "7", "gender": "여" },
  "results": {
    "tree|house|man|woman": {
      "label": "나무",
      "image_json": { /* YOLO 결과 */ },
      "legacy_json": { /* 변환본 */ },
      "interpretation": { "인상적_해석": "…", "구조적_해석": {…}, "표상적_해석": {…},
                          "심리_상태_소견": "…", "추천_사항": {…} },
      "analysis": {…},
      "box_image_base64": "data:image/jpeg;base64,…",
      "metrics": {…}
    }
  },
  "comparison": {
    "peer": {…}, "development": { "stage": "…" },
    "overall_score": 34.9, "emotional_state": "…",
    "drawing_scores": { "aggregated": { "에너지_점수": …, "위치_안정성_점수": …, "표현력_점수": … } }
  },
  "recommendations": [ { "category": "emotional_psychological_support", "items": ["…"] } ],
  "전체_심리_결과": { "종합_요약": "…", "긍정적인_측면": [], "주의_사항": [] },

  // 🆕 iSeed 추가 (기존 필드는 그대로)
  "activity_recommendations": {
    "signals":    [ { "category": "ANXIETY", "label": "…", "score": 4.7, "reason": "…", "keywords": [] } ],
    "activities": [ { "id": "calm-cloud", "title": "…", "category_label": "…", "reason": "…",
                      "duration_min": 3, "growth_point": 20, "implemented": true } ],
    "notes": [ "…" ],
    "disclaimer": "…"
  }
}
```

> **호환성:** `activity_recommendations` 는 **추가만** 된 필드입니다.
> 생성에 실패해도 `try/except` 로 감싸져 있어 기존 응답은 절대 깨지지 않습니다.

---

## 2. 마음활동 추천 엔진 (신규, 분리형)

`iSeed-AiModels-Docker/recommendation_service.py`

**설계 원칙: LLM 프롬프트를 건드리지 않는다.**
분석이 끝난 뒤 그 결과 텍스트/점수만 읽어서 판단합니다.

```
입력: results(그림별 interpretation 전체 텍스트) + comparison(T-Score) + 전체_심리_결과
  │
  ├─ 키워드 사전 매칭          KEYWORD_LEXICON (카테고리별 한국어 표현)
  │    "불안·긴장·위축·덧칠" → ANXIETY
  │    "표현·생략·폐쇄·창문 없" → EXPRESSION  …
  │
  ├─ T-Score 보정              에너지<45 → SELF_ESTEEM+, ANXIETY+
  │                            위치안정성<45 → ANXIETY++
  │                            표현력<45 → EXPRESSION++, EMOTION+
  │
  ├─ 카테고리 랭킹
  │
  └─ 활동 선정                 ACTIVITY_CATALOG에서 상위 카테고리 순으로
                               구현된(implemented=True) 활동 우선 3개
```

5개 카테고리: `ANXIETY` / `EMOTION` / `EXPRESSION` / `SELF_ESTEEM` / `SOCIAL`

관련 엔드포인트:
- `GET  /activities` — 전체 활동 카탈로그
- `POST /activities/recommend` — 분석 결과를 주면 추천만 다시 계산
- `GET  /rag/status` — ChromaDB 적재 상태

---

## 3. 씨앗 성장 (Frontend)

`lib/iseed/seed.ts` — 현재는 브라우저 `localStorage` 기반 MVP.

```ts
{
  seedLevel: 2,
  seedStage: "SPROUT",
  growthPoint: 40,
  completedActivities: [ { activityId, title, category, growthPoint, memo, completedAt } ],
  createdAt, lastAnalysisAt, childName
}
```

| 단계 | 누적 포인트 |
|------|------------|
| 🌱 SEED (씨앗) | 0 |
| 🌿 SPROUT (새싹) | 40 |
| 🍃 LEAF (잎) | 100 |
| 🌳 TREE (마음나무) | 200 |

- 첫 리포트 열람 시 `ensureSeed()` 로 씨앗 생성 + `lastAnalysisAt` 갱신
- 활동 완료 시 `completeActivity()` 로 포인트 적립, 단계 상승 판정
- `nextCheckupDate()` — 마지막 검사 + 8주를 재검사 권장 시점으로 안내
- **서버 저장으로 확장하기 쉽도록** `loadSeed`/`saveSeed` 두 함수만 교체하면 되게 분리

---

## 4. RAG / ChromaDB

| 항목 | 값 |
|------|-----|
| 임베딩 모델 | `RAG_EMBEDDING_MODEL` (기본 `models/gemini-embedding-001`) |
| 벡터 스토어 | ChromaDB (langchain-chroma) |
| 컬렉션 | `langchain` (기본) |
| 컨테이너 경로 | `/app/rag/chroma` (`HTP_DB_PATH`) |
| 호스트 경로 | `rag/chroma` |
| 지표 수 | 1,851건 |
| 원문 | `rag/papers/` 논문 PDF 6편 |
| 문서 포맷 | `대상 요소: {element}\n특징: {feature}\n해석: {interpretation}` |
| 메타데이터 | `element`, `category`, `source`(논문 파일명), `page` |

**경로 우선순위:** `HTP_DB_PATH` 환경변수 → 없으면 `jsonToLlm/htp_knowledge_base`
(원본 기본 경로이므로, 환경변수를 지우면 원본과 100% 동일하게 동작합니다.)

**DB가 비어 있어도 분석은 정상 동작합니다.**
`get_rag_context()` 가 `("", [])` 를 반환하고 LLM 해석만 수행합니다 (원본 설계 그대로).

---

## 5. Frontend 라우트

| 경로 | 상태 | 설명 |
|------|------|------|
| `/` | 노출 | 홈 (Hero + 성장 여정 섹션) |
| `/analysis` | 노출 | 그림 4장 업로드 |
| `/analysis/analyzing` | 노출 | 분석 진행 (AiModels `/analyze` 호출) |
| `/analysis/result` | 노출 | **iSeed 마음 리포트** (4탭 + 씨앗 + 추천 활동) |
| `/activities` | 🆕 노출 | 마음활동 목록 |
| `/activities/[id]` | 🆕 노출 | 개별 게임 실행 |
| `/mypage` | 노출 | 마이페이지 (씨앗 카드 포함) |
| `/login`, `/signup` | 노출 | 인증 (Backend 필요) |
| `/community/**` | **숨김** | 맘스퀘어 |
| `/counseling` | **숨김** | 주변 상담소 |
| `/solutions` | **숨김** | 맞춤 솔루션 |

"숨김" = 헤더/푸터/홈 메뉴에서 제거. 페이지·API·컴포넌트는 모두 보존되어 있고
`lib/iseed/config.ts` 의 플래그 한 줄로 되살릴 수 있습니다.

---

## 6. 챗봇 파이프라인

`POST /chatbot` (AiModels) — 프론트 오른쪽 아래 `iSeed 마음 도우미` 가 직접 호출합니다.
요청에 `analysis_context` 가 있으면 후속 질문 챗봇, 없으면 가이드 챗봇으로 라우팅됩니다.

### 6-1. 사이트 이용 가이드 챗봇 (`chatbot/guideChatbot.py`)

```
질문 → 키워드 추출(불용어 제거)
     → 가이드 벡터DB 검색 (chatbot/guide_chroma, k=5)
        · 원본: chatbot/guides/member_website_guide.md (현재 iSeed 화면 기준)
        · 마크다운 헤더(##/###/####) 단위 분할 → 800자 청크 (47개)
        · 임베딩: RAG_EMBEDDING_MODEL (그림 해석 RAG 와 동일)
     → 프롬프트(검색 결과 + 질문) → CHATBOT_MODEL → 답변(markdown → HTML)
```

- 인덱스는 **첫 질문 때 자동 생성**, 가이드 문서나 임베딩 모델이 바뀌면 자동 재생성 (해시 비교)
- 문서 분할·임베딩·벡터DB 는 프로세스당 1번만 로드 (요청마다 재생성하지 않음)

### 6-2. 분석 결과 후속 질문 챗봇 (`chatbot/psychologicalAnalysisChatbot.py`)

마음 리포트 화면에서 챗봇을 열면 프론트가 현재 분석 결과를 함께 보냅니다.

| 필드 | 출처 (/analyze 응답) |
|------|------|
| `childName`, `age` | `child` |
| `overallScore`, `developmentStage`, `emotionalState` | `comparison` |
| `drawingScores` | `comparison.drawing_scores.aggregated` (에너지 / 위치 안정성 / 표현력) |
| `overall`, `summary` | `전체_심리_결과` (종합 요약, 긍정적인 측면, 주의 사항) |
| `interpretations` | 그림별 `interpretation` 만 (인상적 해석, 정서 영역 소견 등) |
| `activities` | `activity_recommendations.activities` (추천 마음활동 제목) |

→ 텍스트로 정리해 프롬프트에 넣고 `CHATBOT_MODEL` 로 답변. 진단·단정 표현 금지를 프롬프트에 명시.

---

## 7. 회원 / 인증 (Backend, MongoDB)

| 컬렉션 | 내용 |
|------|------|
| `users` | `user_id`(정수, 고유), `email`(고유), `password`(bcrypt), `name`, 약관 동의, 프로필 이미지 |
| `children` | `child_id`(정수), `user_id`, `name`, `age`(7~13), `gender` |
| `counters` | 정수 ID 발급용 시퀀스 (`users`, `children`) |
| `drawing_analyses` | 로그인 사용자의 분석 기록 (`user_id` 로 연결) |

- 정수 ID 를 유지해서 기존 분석 기록·프론트 코드와 호환됩니다.
- 첫 사용자 번호는 기존 분석 기록의 최대 `user_id` 다음부터 발급 → 과거 기록과 섞이지 않음.
- 비밀번호: `bcrypt(base64(sha256(pw)))`. 예전 방식(`bcrypt(sha256 raw digest)`) 해시도 로그인 가능.
- JWT: `{"id": user_id}`, HS256, `JWT_SECRET` / `JWT_EXPIRES_SEC`.
- MySQL 은 커뮤니티(메뉴 숨김) 코드에만 남아 있으며, 접속 불가여도 서버는 정상 기동합니다.
