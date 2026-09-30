from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker

from config import settings

DATABASE_URL = URL.create(
    "mysql+pymysql",
    username=settings.db_user,
    password=settings.db_password,
    host=settings.db_host,
    port=settings.db_port,
    database=settings.db_name,
)

connect_args = {"ssl": {"check_hostname": False}, "connect_timeout": 5}  # force TLS
if settings.db_ssl_ca:
    connect_args = {"ssl": {"ca": settings.db_ssl_ca}, "connect_timeout": 5}
# iSeed: 회원/아이 정보는 MongoDB 로 이전. MySQL 은 커뮤니티(현재 숨김) 전용이며,
#        접속 불가 시 기동이 오래 걸리지 않도록 타임아웃을 둡니다.

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    future=True,
    connect_args=connect_args,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db():
    from db_models import Base as ModelsBase

    ModelsBase.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
