from datetime import datetime, timedelta, timezone
import base64
import hashlib
import jwt
from fastapi import Depends, Header, HTTPException, status
import bcrypt

from config import settings
from user_mongo import AuthUser, find_user_by_id

AUTH_ERROR = {"message": "인증 에러"}


def create_jwt_token(user_id: str) -> str:
    payload = {
        "id": user_id,
        "exp": datetime.now(timezone.utc)
        + timedelta(seconds=settings.jwt_expires_sec),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def _normalize_password(password: str) -> bytes:
    """
    bcrypt 의 72바이트 제한을 피하기 위해 SHA-256 으로 전처리한 뒤 base64 로 인코딩 (항상 44바이트 ASCII).

    예전에는 SHA-256 digest(32바이트 원시 바이트)를 그대로 bcrypt 에 넣었는데,
    digest 에 NUL(0x00) 바이트가 섞이면 bcrypt 가 "password may not contain NUL bytes" 로 실패해
    비밀번호 약 8개 중 1개는 회원가입 자체가 불가능했습니다.
    """
    return base64.b64encode(hashlib.sha256(password.encode("utf-8")).digest())


def _legacy_normalize_password(password: str) -> bytes:
    """예전 방식(원시 digest). 이 방식으로 저장된 기존 해시를 검증할 때만 사용."""
    return hashlib.sha256(password.encode("utf-8")).digest()


def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(_normalize_password(password), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    stored = hashed.encode("utf-8")
    if bcrypt.checkpw(_normalize_password(password), stored):
        return True
    # 예전 방식으로 저장된 해시 호환 (NUL 바이트가 없는 경우에만 bcrypt 가 받아줌)
    legacy = _legacy_normalize_password(password)
    if b"\x00" in legacy:
        return False
    try:
        return bcrypt.checkpw(legacy, stored)
    except ValueError:
        return False


async def _user_from_token(authorization: str | None) -> tuple[AuthUser | None, str | None]:
    """Bearer 토큰 → MongoDB users 컬렉션에서 사용자 조회."""
    if not (authorization and authorization.startswith("Bearer ")):
        return None, None

    token = authorization.split(" ", 1)[1].strip()
    try:
        decoded = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None, None

    try:
        user_id = int(decoded.get("id"))
    except (TypeError, ValueError):
        return None, None

    doc = await find_user_by_id(user_id)
    if not doc:
        return None, None
    return AuthUser.from_doc(doc), token


async def get_current_user_context(authorization: str | None = Header(default=None)):
    user, token = await _user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=AUTH_ERROR)
    return {"user": user, "token": token}


async def get_optional_user_context(authorization: str | None = Header(default=None)):
    user, token = await _user_from_token(authorization)
    return {"user": user, "token": token}
