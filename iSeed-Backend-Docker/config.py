import os
from dotenv import load_dotenv

load_dotenv()


def required(key: str, default_value=None):
    value = os.getenv(key, default_value)
    if value is None or value == "":
        raise ValueError(f"키 {key}는 undefined!!")
    return value


class Settings:
    # iSeed: 외부 인프라(MySQL/S3) 없이도 서버가 기동되도록 기본값을 둡니다.
    # 값이 채워져 있으면 기존과 100% 동일하게 동작합니다.
    jwt_secret = required("JWT_SECRET", "iseed-dev-secret-change-me")
    jwt_expires_sec = int(required("JWT_EXPIRES_SEC", 172800))
    bcrypt_salt_rounds = int(required("BCRYPT_SALT_ROUNDS", 12))
    host_port = int(required("HOST_PORT", 9090))
    db_host = required("DB_HOST", "localhost")
    db_port = int(required("DB_PORT", 3306))
    db_name = required("DB_NAME", "iSeed")
    db_user = required("DB_USER", "iseed")
    db_password = os.getenv("DB_PASSWORD", "")
    # Optional: path to CA bundle for TLS connections
    db_ssl_ca = os.getenv("DB_SSL_CA")
    s3_bucket = os.getenv("S3_BUCKET", "")
    s3_region = os.getenv("S3_REGION", "ap-northeast-2")
    s3_access_key_id = os.getenv("S3_ACCESS_KEY_ID", "")
    s3_secret_access_key = os.getenv("S3_SECRET_ACCESS_KEY", "")
    # Optional: CDN or custom public base URL for objects
    s3_public_base_url = os.getenv("S3_PUBLIC_BASE_URL")

    # MongoDB (AI 분석 로그 등)
    # ⚠️ 실제 접속 문자열은 코드가 아니라 .env 에 둡니다.
    mongodb_uri = os.getenv("MONGODB_URI", "")
    mongodb_db_name = os.getenv("MONGODB_DB_NAME", "iseed")


settings = Settings()
