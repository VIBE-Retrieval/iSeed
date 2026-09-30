# iSeed AI Models

그림 분석, 해석, 마음활동 추천, 챗봇을 담당하는 FastAPI 서버입니다. (포트 8080)

## 하는 일

| 기능 | 엔드포인트 | 설명 |
|------|-----------|------|
| 그림 분석 | `POST /analyze` | 그림 4장 → YOLOv8 요소 탐지 → 구조화 → T-Score·또래 비교 → RAG 근거 검색 → Gemini 해석 → 마음활동 추천 |
| 점수 재계산 | `POST /analyze/score` | 저장된 분석 결과로 T-Score 다시 계산 |
| 챗봇 | `POST /chatbot` | `analysis_context` 가 있으면 분석 결과 후속 질문, 없으면 이용 가이드 |
| 마음활동 | `GET /activities`, `POST /activities/recommend` | 활동 카탈로그, 추천만 다시 계산 |
| 상태 | `GET /health`, `GET /rag/status` | 서버 상태, ChromaDB 적재·인덱스 상태 |

## 폴더

| 경로 | 내용 |
|------|------|
| `main.py` | API 엔드포인트 |
| `image_to_json/` | YOLOv8 추론. 가중치는 `{tree,house,man,woman}_weights/{male,female}/best.pt` |
| `jsonToLlm/` | 형식 변환, 구조화 분석, RAG 검색, Gemini 해석 (`gemini_integration.py`, `interpretation_prompts.py`) |
| `analysis_metrics.py`, `drawing_score.py` | 이미지 지표, T-Score 계산 (`drawing_norm_dist_stats.csv`) |
| `data/` | 또래 비교 통계 (`label_stats_by_group.json`) |
| `recommendation_service.py` | 분석 결과 후처리로 마음활동 추천 (프롬프트와 분리) |
| `chatbot/` | 이용 가이드 챗봇, 후속 질문 챗봇, 가이드 문서 |

## 환경 변수 (`.env`)

```ini
GEMINI_API_KEY=발급받은키
GOOGLE_API_KEY=발급받은키
GEMINI_API_KEYS=발급받은키          # 콤마로 여러 개 넣으면 503/429 때 순환
AIMODELS_PORT=8080
# 선택
GEMINI_MODEL=gemini-3.5-flash-lite  # 해석·챗봇 모델
RAG_EMBEDDING_MODEL=models/gemini-embedding-001
HTP_DB_PATH=../rag/chroma           # 비우면 jsonToLlm/htp_knowledge_base
```

## 단독 실행

```bash
docker build -t iseed-aimodels .
docker run -p 8080:8080 --env-file .env -v "$(pwd)/../rag/chroma:/app/rag/chroma" -e HTP_DB_PATH=/app/rag/chroma iseed-aimodels
```

보통은 저장소 루트에서 `docker compose up --build` 로 함께 실행합니다.
