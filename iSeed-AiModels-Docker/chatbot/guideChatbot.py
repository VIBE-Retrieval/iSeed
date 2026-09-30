import hashlib
import os
import re
import shutil
import threading

from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter, MarkdownHeaderTextSplitter
from langchain_chroma import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from langchain_community.document_loaders import TextLoader

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
GUIDE_MD_PATH = os.path.join(CURRENT_DIR, "guides", "member_website_guide.md")

# main.py 가 .env 를 읽기 전에 이 모듈을 import 하므로, 아래 설정값을 읽기 전에 직접 로드
load_dotenv(os.path.join(CURRENT_DIR, "..", ".env"))

# 가이드 챗봇 전용 벡터 DB 위치.
#   예전에는 "./chroma_db"(실행 위치 기준 상대경로)를 썼는데, Docker 이미지에서
#   빈 폴더가 미리 만들어져 있어 "이미 있음 → 로드" 로 빠지며 검색 결과가 항상 0건이었습니다.
#   → 모듈 기준 절대경로로 고정하고, 비어 있거나 가이드 문서가 바뀌면 다시 만듭니다.
GUIDE_CHROMA_PATH = os.getenv("GUIDE_CHROMA_PATH") or os.path.join(CURRENT_DIR, "guide_chroma")
GUIDE_COLLECTION = "iseed_guide"
_HASH_FILE = ".source_hash"

# 임베딩 모델: 그림 해석 RAG 와 동일한 Gemini 임베딩 사용.
#   예전 sentence-transformers/all-MiniLM-L6-v2 는 영어 전용이라 한국어 질문 검색 적중률이
#   낮았습니다 (가이드 질문 8개 기준 top-3 적중 3/8 → Gemini 8/8).
GUIDE_EMBEDDING_MODEL = os.getenv("RAG_EMBEDDING_MODEL", "models/gemini-embedding-001")

SUPPORT_EMAIL = os.getenv("SUPPORT_EMAIL", "aimind@gmail.com")

# 챗봇 LLM 모델.
#   예전 "models/gemini-flash-latest" 는 구글이 가리키는 모델을 수시로 바꾸는 별칭이라,
#   어느 순간 무료 한도가 하루 20회뿐인 최신 모델로 바뀌면서 챗봇이 429 로 멈췄습니다.
#   → 그림 해석과 같은 고정 모델을 쓰고, 필요하면 CHATBOT_MODEL 로 따로 지정합니다.
CHATBOT_MODEL = os.getenv("CHATBOT_MODEL") or os.getenv("GEMINI_MODEL") or "gemini-3.5-flash-lite"


# ===== 공통 환경/모델 함수 =====
def load_common_env():
    """
    API 키 및 환경 변수 로드.
    그림 해석 파이프라인과 같은 우선순위(GEMINI_API_KEYS → GEMINI_API_KEY → GOOGLE_API_KEY)로 키를 고릅니다.
    """
    env_path = os.path.join(CURRENT_DIR, "..", ".env")
    load_dotenv(env_path)
    for k in os.getenv("GEMINI_API_KEYS", "").split(","):
        if k.strip():
            return k.strip()
    return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")


def get_common_llm(temperature=0.2):
    """LLM 모델 생성 공통 함수"""
    # 키를 명시적으로 넘깁니다. 넘기지 않으면 langchain 이 환경변수 GOOGLE_API_KEY 를
    # GEMINI_API_KEY 보다 우선해서, 두 값이 다를 때 그림 해석과 다른 키를 쓰게 됩니다.
    return ChatGoogleGenerativeAI(
        model=CHATBOT_MODEL,
        temperature=temperature,
        google_api_key=load_common_env(),
        # 429(할당량 초과) 때 재시도가 할당량을 더 소모하지 않도록 횟수 제한
        max_retries=2,
    )


def get_common_embeddings():
    """임베딩 모델 생성 공통 함수"""
    api_key = load_common_env()
    return GoogleGenerativeAIEmbeddings(model=GUIDE_EMBEDDING_MODEL, google_api_key=api_key)


def load_guide_docs():
    # 사이트 이용 가이드 md 파일 load
    loader = TextLoader(GUIDE_MD_PATH, encoding='utf-8')
    docs = loader.load()
    return docs


def split_markdown_docs(docs):
    # 마크다운 split 기준 (페이지 단위와 상세 섹션 단위를 모두 포함)
    header_split_criterion = [
        ("##", "Page"),        # 대주제: 문서 제목
        ("###", "Section"),     # 중주제: 화면 (마음검사, 마음 리포트, 마음활동 등)
        ("####", "Subsection"),  # 소주제: 화면 안의 영역/기능
    ]
    # 마크다운에서 '##', '###'를 기준으로 1차 분할
    markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=header_split_criterion)
    header_splits = markdown_splitter.split_text(docs[0].page_content)
    # 내용이 너무 길 경우를 대비해 2차 분할
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100
    )
    splits = text_splitter.split_documents(header_splits)
    return splits


def _guide_source_hash() -> str:
    """가이드 문서 + 임베딩 모델이 바뀌면 인덱스를 다시 만들기 위한 지문."""
    with open(GUIDE_MD_PATH, "rb") as f:
        digest = hashlib.sha256(f.read()).hexdigest()
    return f"{digest}:{GUIDE_EMBEDDING_MODEL}"


def _read_saved_hash() -> str:
    try:
        with open(os.path.join(GUIDE_CHROMA_PATH, _HASH_FILE), encoding="utf-8") as f:
            return f.read().strip()
    except OSError:
        return ""


def get_vectorstore(splits, embeddings):
    """
    벡터 DB 로드 또는 생성.
    - 저장된 인덱스가 있고, 문서/모델 지문이 같고, 실제로 벡터가 들어 있으면 그대로 사용
    - 그 외(없음 / 비어 있음 / 문서 변경)에는 새로 만든다
    """
    current_hash = _guide_source_hash()
    if os.path.isdir(GUIDE_CHROMA_PATH) and _read_saved_hash() == current_hash:
        try:
            vectorstore = Chroma(
                persist_directory=GUIDE_CHROMA_PATH,
                embedding_function=embeddings,
                collection_name=GUIDE_COLLECTION,
            )
            if vectorstore._collection.count() > 0:
                return vectorstore
        except Exception as e:
            print(f"[guide] 기존 인덱스 로드 실패, 재생성합니다: {e}")

    print(f"[guide] 가이드 인덱스 생성 중... ({len(splits)} chunks)")
    shutil.rmtree(GUIDE_CHROMA_PATH, ignore_errors=True)
    vectorstore = Chroma.from_documents(
        documents=splits,
        embedding=embeddings,
        collection_name=GUIDE_COLLECTION,
        persist_directory=GUIDE_CHROMA_PATH,
    )
    with open(os.path.join(GUIDE_CHROMA_PATH, _HASH_FILE), "w", encoding="utf-8") as f:
        f.write(current_hash)
    return vectorstore


# 요청마다 문서 분할·임베딩 모델·벡터 DB 를 새로 만들지 않도록 프로세스 단위로 캐시
_retriever = None
_retriever_lock = threading.Lock()


def get_guide_retriever():
    global _retriever
    if _retriever is None:
        with _retriever_lock:
            if _retriever is None:
                splits = split_markdown_docs(load_guide_docs())
                vectorstore = get_vectorstore(splits, get_common_embeddings())
                _retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
    return _retriever


def extract_search_query(question: str) -> str:
    """
    사용자 질문에서 검색에 도움이 되는 핵심 키워드를 뽑아서
    RAG 검색에 사용할 쿼리 문자열을 만들어 줍니다.
    """
    # 한글/영문/숫자 토큰만 추출
    tokens = re.findall(r"[가-힣A-Za-z0-9]+", question)

    # 기초적인 불용어(조사/접속어 등) 제거
    stopwords = {
        "는", "은", "이", "가", "을", "를", "에", "에서", "으로", "로",
        "도", "만", "까지", "부터", "하고", "근데", "그리고", "그냥",
        "혹시", "정말", "진짜", "좀", "조금", "너무", "어떻게", "왜",
        "거", "요",
    }

    keywords = [t for t in tokens if t not in stopwords and len(t) > 1]

    # 키워드가 하나도 안 남으면 원문을 그대로 사용
    if not keywords:
        return question
    # 키워드들을 공백으로 이어서 검색용 쿼리로 사용 (중복 제거)
    return " ".join(dict.fromkeys(keywords))


def get_guide_prompt():
    # 프롬프트 템플릿
    template = """당신은 'iSeed(아이씨드)' 웹사이트의 **전문 이용 가이드 챗봇**입니다.
iSeed는 아이의 집·나무·사람(HTP) 그림에서 마음 신호를 찾아 보호자용 마음 리포트와 맞춤 마음활동을 제공하는 아동 정서지원 서비스입니다.
아래의 `문서 탐색 결과`는 사이트 이용 가이드 문서를 RAG로 검색한 결과이며,
웹사이트의 실제 화면 구조(헤더, 홈, 로그인/회원가입, 마음검사, 분석 진행, 마음 리포트, 마음활동, 나의 마음 씨앗, 마이페이지, 설정, 자주 묻는 질문 등)를 설명하고 있습니다.

[역할]
- 당신은 **이 문서를 가장 잘 아는 안내 담당자**로서, 사용자가 웹사이트를 어떻게 이용하면 좋을지 구체적으로 설명합니다.

[응답 규칙]
1. 반드시 **문서 탐색 결과(context)** 안에 있는 정보와 표현을 우선적으로 사용하세요.
2. 사용자의 질문과 가장 관련 있는 섹션(###), 하위 섹션(####)의 내용을 골라, 그 내용을 **자연스러운 한국어로 재구성**해서 설명하세요.
3. 질문이 문서 범위를 벗어나는 경우, **추측해서 지어내지 말고**, 문서에서 가장 가까운 관련 내용을 안내해 주세요.
4. 버튼/위치/경로에 대해서는 **"어느 화면에서, 어떤 메뉴/버튼을 눌러야 하는지"** 를 중심으로 단계별로 설명해 주세요.
5. 답변은 반드시 **공손한 존댓말(예: ~하시면 됩니다, ~해 주세요)** 로 작성하세요.
6. 답변할 때 너무 길게 하지 말고 정확히 핵심만 전달해 주시고, 문서 탐색 결과에서 찾을 수 없거나 모르겠을 때는 주관적으로 대답하지 말고 문의 메일({support_email})을 안내하세요.
7. 답변을 할 때 줄바꿈, 문단 간의 간격을 적절히 사용해서 사용자가 보기 편하게 작성해 주세요.
8. 분석 결과를 '진단'이라고 표현하지 마세요. iSeed의 분석은 전문적인 심리 진단을 대체하지 않는 보조 자료입니다.

[문서 탐색 결과]
{context}

[사용자 질문]
{question}
"""
    return ChatPromptTemplate.from_template(template).partial(support_email=SUPPORT_EMAIL)


def ask_to_website_guide_chatbot(question):
    print('가이드 챗봇 작동 시작')
    # RAG Chain
    prompt = get_guide_prompt()
    llm = get_common_llm()

    """
    사용자 질문 → 키워드 추출 → 해당 키워드로 RAG 검색 실행.
    """
    retriever = get_guide_retriever()

    rag_chain = (
        # RunnablePassthrough(): 사용자의 질문을 가공 없이 그대로 전달
        # { "context": [찾은 문서들], "question": "사용자의 질문" }

        # retriever는 관련 문서를 찾아 리스트로 반환합니다.
        RunnableParallel({

            # context: 키워드 추출 함수를 거친 뒤 retriever로 전달
            "context": RunnableLambda(extract_search_query) | retriever,

            #  question: 가공되지 않은 원본 질문 그대로 prompt 전달
            "question": RunnablePassthrough()
        })
        | prompt
        | llm
        # 복잡한 llm 응답 데이터에서 사용자가 읽을 답변 텍스트만 추출, 출력해주는 parser
        | StrOutputParser()
    )
    return rag_chain.invoke(question)
