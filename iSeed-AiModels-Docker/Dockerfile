# AI Models Dockerfile (FastAPI + AI/ML) - 그림 분석 및 챗봇만 포함
FROM python:3.11-slim

WORKDIR /app

# 시스템 패키지 설치 (AI 모델 관련)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# pip 업그레이드
RUN pip install --upgrade pip

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --use-deprecated=legacy-resolver || \
    pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 필요한 디렉토리 생성
RUN mkdir -p data image_to_json/uploads image_to_json/result jsonToLlm/results

EXPOSE 8080

# uvicorn으로 FastAPI 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
