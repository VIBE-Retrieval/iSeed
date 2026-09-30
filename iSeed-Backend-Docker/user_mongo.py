"""
회원 / 아이 정보 (MongoDB, Beanie).

예전에는 MySQL(users, children 테이블)에 저장했지만 iSeed 에서는 MongoDB 로 옮겼습니다.
- 사용자·아이 번호는 기존처럼 **정수(int)** 로 유지합니다.
  (drawing_analyses.user_id, 프론트 /auth/me 의 id 등이 정수 ID 를 쓰기 때문)
- 번호는 counters 컬렉션으로 1씩 증가시켜 발급합니다.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from beanie import Document, Indexed
from pydantic import Field
from pymongo import ReturnDocument


def _now() -> datetime:
    return datetime.now(timezone.utc)


class UserDoc(Document):
    user_id: Indexed(int, unique=True)
    name: str
    email: Indexed(str, unique=True)
    password: str
    profile_image_url: str = "base"
    agree_terms: bool = False
    agree_privacy: bool = False
    agree_marketing: bool = False
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)

    class Settings:
        name = "users"


class ChildDoc(Document):
    child_id: Indexed(int, unique=True)
    user_id: Indexed(int)
    name: str
    age: int
    gender: str  # 'male' | 'female'
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)

    class Settings:
        name = "children"


class Counter(Document):
    """정수 ID 발급용. _id 는 시퀀스 이름('users', 'children')."""
    id: str  # type: ignore[assignment]
    seq: int = 0

    class Settings:
        name = "counters"


@dataclass
class AuthUser:
    """
    인증된 사용자 (엔드포인트에서 context["user"] 로 쓰는 객체).
    예전 SQLAlchemy User 와 같은 속성 이름(id, name, email ...)을 유지해
    기존 엔드포인트 코드가 그대로 동작하도록 합니다.
    """
    id: int
    name: str
    email: str
    password: str
    profile_image_url: str
    created_at: datetime

    @classmethod
    def from_doc(cls, doc: UserDoc) -> "AuthUser":
        return cls(
            id=doc.user_id,
            name=doc.name,
            email=doc.email,
            password=doc.password,
            profile_image_url=doc.profile_image_url,
            created_at=doc.created_at,
        )


async def _legacy_max_user_id() -> int:
    """
    기존 MySQL 시절 user_id 로 저장된 분석 기록과 번호가 겹치지 않도록,
    Mongo 에 남아 있는 분석 기록의 최대 user_id 를 찾는다.
    (새 회원이 다른 사람의 과거 분석 기록을 보게 되는 일을 막기 위함)
    """
    db = UserDoc.get_motor_collection().database
    best = 0
    for coll_name in ("drawing_analyses", "analysis_logs"):
        doc = await db[coll_name].find_one(
            {"user_id": {"$type": "number"}}, sort=[("user_id", -1)], projection={"user_id": 1}
        )
        if doc and isinstance(doc.get("user_id"), (int, float)):
            best = max(best, int(doc["user_id"]))
    return best


async def next_sequence(name: str) -> int:
    """counters 컬렉션에서 원자적으로 다음 번호를 받는다."""
    coll = Counter.get_motor_collection()
    if name == "users" and await coll.find_one({"_id": name}) is None:
        # 최초 1회: 과거 분석 기록의 user_id 보다 큰 번호부터 시작
        start = await _legacy_max_user_id()
        await coll.update_one({"_id": name}, {"$setOnInsert": {"seq": start}}, upsert=True)
    doc: dict[str, Any] = await coll.find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return int(doc["seq"])


async def find_user_by_email(email: str) -> UserDoc | None:
    return await UserDoc.find_one(UserDoc.email == email)


async def find_user_by_id(user_id: int) -> UserDoc | None:
    return await UserDoc.find_one(UserDoc.user_id == user_id)


async def create_user(
    *,
    name: str,
    email: str,
    password_hash: str,
    profile_image_url: str = "base",
    agree_terms: bool = False,
    agree_privacy: bool = False,
    agree_marketing: bool = False,
) -> UserDoc:
    doc = UserDoc(
        user_id=await next_sequence("users"),
        name=name,
        email=email,
        password=password_hash,
        profile_image_url=profile_image_url,
        agree_terms=agree_terms,
        agree_privacy=agree_privacy,
        agree_marketing=agree_marketing,
    )
    await doc.insert()
    return doc
