import json
import os
from dotenv import load_dotenv
from tqdm import tqdm

from gemini_integration import resolve_gemini_api_key
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document

# .env 로드
load_dotenv()

def create_vector_db(json_file, db_path=None):
    """HTP 지표 JSON을 벡터화해 ChromaDB에 저장. db_path 미지정 시 ./htp_knowledge_base 사용."""
    if not os.path.exists(json_file):
        print(f"❌ '{json_file}' 파일을 찾을 수 없습니다.")
        return None
    db_path = db_path or "./htp_knowledge_base"

    with open(json_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    api_key = resolve_gemini_api_key()
    if not api_key:
        print("❌ GEMINI_API_KEY 또는 GEMINI_API_KEYS가 필요합니다.")
        return None
    embeddings = GoogleGenerativeAIEmbeddings(
        model=os.getenv("RAG_EMBEDDING_MODEL", "models/gemini-embedding-001"),
        google_api_key=api_key
    )

    documents = []
    print(f"📦 {len(data)}개의 지표를 벡터화 준비 중...")
    for item in tqdm(data, desc="Documents 생성"):
        page_content = f"대상 요소: {item['element']}\n특징: {item['feature']}\n해석: {item['interpretation']}"
        metadata = {
            "element": item["element"],
            "category": item["category"],
            "source": item["source"],
            "page": str(item.get("page", "") or ""),
        }
        documents.append(Document(page_content=page_content, metadata=metadata))

    print(f"🚀 ChromaDB 적재 시작... (위치: {db_path})")
    vector_db = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory=db_path
    )
    print(f"✅ 적재 완료! 총 {len(data)}개의 지표가 벡터 DB에 저장되었습니다.")
    return vector_db


if __name__ == "__main__":
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else os.path.join("results", "htp_final_dataset.json")
    create_vector_db(path)