"""
iSeed RAG(ChromaDB) 초기화 스크립트
====================================

논문에서 추출한 HTP 지표 데이터셋(htp_final_dataset.json)을 임베딩해
ChromaDB 벡터 스토어를 만듭니다.

⚠️ 기존 DB가 이미 적재되어 있으면 **아무것도 하지 않고 종료**합니다.
   (임베딩 API 호출 비용/시간을 낭비하지 않기 위함)
   강제로 다시 만들려면 --force 를 주세요.

임베딩 모델 / 문서 포맷 / 메타데이터는 원본 store_to_chroma.py 와 동일하게 유지합니다.
(= 분석 파이프라인이 기대하는 형식 그대로)

사용법
------
  # 호스트에서 (python 3.11 + 의존성 설치 필요)
  python rag/scripts/init_rag.py

  # 도커 컨테이너 안에서 (권장 - 의존성이 이미 설치됨)
  docker compose run --rm aimodels python /app/rag/scripts/init_rag.py

옵션
----
  --force        기존 DB가 있어도 다시 만듭니다 (기존 DB는 .bak 으로 보관)
  --dataset PATH 지표 JSON 경로 (기본: rag/dataset/htp_final_dataset.json)
  --db PATH      ChromaDB 경로 (기본: 환경변수 HTP_DB_PATH 또는 rag/chroma)
  --limit N      앞의 N개만 적재 (빠른 검증용)
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sqlite3
import sys
from pathlib import Path

# Windows 콘솔(cp949)에서 이모지/한글이 깨지지 않도록
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

HERE = Path(__file__).resolve().parent
RAG_ROOT = HERE.parent                      # .../rag
PROJECT_ROOT = RAG_ROOT.parent              # .../iSeed

# .env 자동 로드 (루트 → AiModels 순). 컨테이너에서는 env_file 로 이미 주입됨.
try:
    from dotenv import load_dotenv

    for _env in (
        PROJECT_ROOT / ".env",
        PROJECT_ROOT / "iSeed-AiModels-Docker" / ".env",
        Path("/app/.env"),
    ):
        if _env.exists():
            load_dotenv(_env, override=False)
except Exception:
    pass

DEFAULT_DATASET = RAG_ROOT / "dataset" / "htp_final_dataset.json"
# 색인과 검색이 같은 모델을 쓰도록 gemini_integration.py 와 동일한 기본값/환경변수 사용
EMBEDDING_MODEL = os.getenv("RAG_EMBEDDING_MODEL", "models/gemini-embedding-001")
DEFAULT_DB = Path(os.getenv("HTP_DB_PATH") or (RAG_ROOT / "chroma"))


def count_embeddings(db_path: Path) -> int:
    """ChromaDB 에 실제 적재된 벡터 수를 센다. (없으면 0)"""
    sqlite_path = db_path / "chroma.sqlite3"
    if not sqlite_path.exists():
        return 0
    try:
        conn = sqlite3.connect(str(sqlite_path))
        n = conn.execute("SELECT COUNT(*) FROM embeddings").fetchone()[0]
        conn.close()
        return int(n)
    except Exception:
        return 0


def resolve_api_key() -> str | None:
    """GEMINI_API_KEYS(콤마 구분) 또는 GEMINI_API_KEY / GOOGLE_API_KEY."""
    keys = os.getenv("GEMINI_API_KEYS", "")
    for k in keys.split(","):
        if k.strip():
            return k.strip()
    for name in ("GEMINI_API_KEY", "GOOGLE_API_KEY"):
        v = os.getenv(name, "").strip()
        if v:
            return v
    return None


def load_dataset(path: Path, limit: int | None) -> list[dict]:
    if not path.exists():
        print(f"❌ 지표 데이터셋을 찾을 수 없습니다: {path}")
        print("   논문 PDF에서 지표를 새로 추출하려면 rag/scripts/htp_indicator_parser.py 를 먼저 실행하세요.")
        sys.exit(1)
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list) or not data:
        print(f"❌ 데이터셋 형식이 올바르지 않습니다: {path}")
        sys.exit(1)
    return data[:limit] if limit else data


def _reset_vector_segments(db_path: Path) -> None:
    """HNSW 세그먼트 디렉터리를 제거해 sqlite 로부터 재구축되게 한다."""
    import sqlite3 as _sq

    sqlite_path = db_path / "chroma.sqlite3"
    try:
        conn = _sq.connect(str(sqlite_path))
        seg_ids = [r[0] for r in conn.execute("SELECT id FROM segments WHERE scope = 'VECTOR'")]
        conn.close()
    except Exception:
        seg_ids = []
    for sid in seg_ids:
        d = db_path / sid
        if d.is_dir():
            shutil.rmtree(d, ignore_errors=True)
    # 잔여 UUID 디렉터리도 정리
    for d in db_path.iterdir():
        if d.is_dir() and len(d.name) == 36 and d.name.count("-") == 4:
            shutil.rmtree(d, ignore_errors=True)


def _verify_index(db_path: Path, embeddings) -> bool:
    """컬렉션을 열어 count() 가 동작하는지 확인 (임베딩 API 호출 없음)."""
    try:
        from langchain_chroma import Chroma

        vdb = Chroma(persist_directory=str(db_path), embedding_function=embeddings)
        return vdb._collection.count() > 0
    except Exception as e:
        print(f"   (인덱스 확인 실패: {e})")
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description="iSeed RAG(ChromaDB) 초기화")
    parser.add_argument("--force", action="store_true", help="기존 DB가 있어도 재구축")
    parser.add_argument("--dataset", default=str(DEFAULT_DATASET))
    parser.add_argument("--db", default=str(DEFAULT_DB))
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()

    dataset_path = Path(args.dataset)
    db_path = Path(args.db)

    print("=" * 60)
    print("  iSeed RAG 초기화")
    print("=" * 60)
    print(f"  지표 데이터셋 : {dataset_path}")
    print(f"  ChromaDB 경로 : {db_path}")

    # 1) 이미 적재되어 있으면 skip
    existing = count_embeddings(db_path)
    print(f"  현재 적재 벡터 : {existing}개")
    if existing > 0 and not args.force:
        print("\n✅ 이미 구축된 ChromaDB 가 있습니다. 재생성하지 않고 종료합니다.")
        print("   (강제로 다시 만들려면 --force)")
        return 0

    # 2) 의존성 확인
    try:
        from langchain_chroma import Chroma
        from langchain_core.documents import Document
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
    except ImportError as e:
        print(f"\n❌ 필요한 패키지가 없습니다: {e}")
        print("   컨테이너 안에서 실행하는 것을 권장합니다:")
        print("   docker compose run --rm aimodels python /app/rag/scripts/init_rag.py")
        return 1

    # 3) API 키
    api_key = resolve_api_key()
    if not api_key:
        print("\n❌ GEMINI_API_KEY (또는 GEMINI_API_KEYS / GOOGLE_API_KEY) 가 필요합니다.")
        print("   .env 파일에 키를 넣고 다시 실행하세요.")
        return 1

    # 4) 데이터셋 로드
    data = load_dataset(dataset_path, args.limit)
    print(f"\n📦 {len(data)}개의 HTP 지표를 임베딩합니다...")

    # 5) 기존 DB 백업 후 제거 (--force)
    if db_path.exists() and args.force:
        backup = db_path.parent / (db_path.name + ".bak")
        if backup.exists():
            shutil.rmtree(backup, ignore_errors=True)
        shutil.move(str(db_path), str(backup))
        print(f"   기존 DB를 백업했습니다 → {backup}")
    db_path.mkdir(parents=True, exist_ok=True)

    # 6) 문서 생성 (원본 store_to_chroma.py 와 동일한 포맷 유지)
    documents = []
    for item in data:
        page_content = (
            f"대상 요소: {item.get('element','')}\n"
            f"특징: {item.get('feature','')}\n"
            f"해석: {item.get('interpretation','')}"
        )
        metadata = {
            "element": item.get("element", ""),
            "category": item.get("category", ""),
            "source": item.get("source", ""),
            "page": str(item.get("page", "") or ""),
        }
        documents.append(Document(page_content=page_content, metadata=metadata))

    print(f"   임베딩 모델 : {EMBEDDING_MODEL}")
    embeddings = GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL,
        google_api_key=api_key,
    )

    # 7) 배치 적재 (임베딩 API rate limit 대비)
    BATCH = 100
    vector_db = None
    for i in range(0, len(documents), BATCH):
        chunk = documents[i : i + BATCH]
        if vector_db is None:
            vector_db = Chroma.from_documents(
                documents=chunk,
                embedding=embeddings,
                persist_directory=str(db_path),
            )
        else:
            vector_db.add_documents(chunk)
        print(f"   {min(i + BATCH, len(documents))}/{len(documents)} 적재 완료")

    # 8) HNSW 인덱스 정합성 확인 + 자가 복구
    #    chromadb 1.x 는 벡터 본체를 sqlite 에 쓰고 HNSW 인덱스를 별도 디렉터리에 둡니다.
    #    프로세스가 인덱스를 flush 하기 전에 끝나면 세그먼트 디렉터리가 불완전해져
    #    이후 검색이 "Error loading hnsw index" 로 실패합니다.
    #    (검색 쪽은 예외를 삼키므로 RAG가 조용히 꺼진 것처럼 보입니다.)
    #    → 세그먼트 디렉터리를 지우면 sqlite 의 임베딩으로부터 자동 재구축됩니다.
    del vector_db
    try:
        import chromadb.api.client as _chroma_client

        _chroma_client.SharedSystemClient.clear_system_cache()
    except Exception:
        pass

    if _verify_index(db_path, embeddings):
        print("   인덱스 정상")
    else:
        print("   HNSW 인덱스가 불완전합니다. 세그먼트를 재생성합니다...")
        _reset_vector_segments(db_path)
        if _verify_index(db_path, embeddings):
            print("   인덱스 재생성 완료")
        else:
            print("   인덱스 재생성 실패 - --force 로 다시 시도해 주세요.")
            return 1

    final = count_embeddings(db_path)
    print(f"\n✅ 완료! ChromaDB 에 {final}개의 벡터가 적재되었습니다.")
    print(f"   위치: {db_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
