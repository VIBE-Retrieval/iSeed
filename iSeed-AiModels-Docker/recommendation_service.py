"""
iSeed 마음활동 추천 엔진 (Recommendation Layer)

이 모듈은 **기존 AI 심리분석 파이프라인과 완전히 분리된 후처리 레이어**입니다.
- LLM 프롬프트를 수정하지 않습니다.
- 기존 /analyze 응답(results, comparison, 전체_심리_결과)을 "읽기만" 합니다.
- 분석 결과 텍스트/점수에서 신호를 추출해, 아이에게 권할 마음활동을 고릅니다.

따라서 이 모듈을 제거하거나 실패해도 기존 분석 결과는 전혀 달라지지 않습니다.
(main.py에서 try/except로 감싸 호출합니다.)

카테고리
    ANXIETY      불안 / 긴장 완화
    EMOTION      감정 인식
    EXPRESSION   자기표현
    SELF_ESTEEM  자기효능감
    SOCIAL       사회적 감정 이해
"""

from __future__ import annotations

from typing import Any, Dict, List

# --------------------------------------------------------------------------
# 1. 카테고리 정의
# --------------------------------------------------------------------------

CATEGORIES: Dict[str, Dict[str, str]] = {
    "ANXIETY": {
        "label": "불안 / 긴장 완화",
        "description": "긴장을 낮추고 몸과 마음을 편안하게 하는 활동",
    },
    "EMOTION": {
        "label": "감정 인식",
        "description": "지금 내 마음이 어떤 색인지 알아차리는 활동",
    },
    "EXPRESSION": {
        "label": "자기표현",
        "description": "마음속 이야기를 밖으로 꺼내 보는 활동",
    },
    "SELF_ESTEEM": {
        "label": "자기효능감",
        "description": "'나는 할 수 있어'라는 마음을 키우는 활동",
    },
    "SOCIAL": {
        "label": "사회적 감정 이해",
        "description": "친구와 가족의 마음을 헤아려 보는 활동",
    },
}

# --------------------------------------------------------------------------
# 2. 키워드 사전 (분석 텍스트 → 카테고리 신호)
#    HTP 해석에서 실제로 자주 등장하는 한국어 표현 기준
# --------------------------------------------------------------------------

KEYWORD_LEXICON: Dict[str, List[str]] = {
    "ANXIETY": [
        "불안", "긴장", "초조", "걱정", "위축", "경직", "두려움", "공포",
        "스트레스", "방어", "예민", "불안정", "압박", "짙은 선", "진한 필압",
        "덧칠", "음영", "지우", "떨리는 선", "강박",
    ],
    "EMOTION": [
        "정서", "감정", "기분", "우울", "슬픔", "외로", "공허", "무기력",
        "감정 표현", "정서적", "情緖", "감정 조절", "기복", "내면",
    ],
    "EXPRESSION": [
        "표현", "표현력", "소통", "말", "언어", "생략", "단순", "빈약",
        "세부 묘사", "디테일", "창의", "상상", "개방", "폐쇄", "닫힌",
        "창문 없", "문 없", "입 생략", "표현이 적",
    ],
    "SELF_ESTEEM": [
        "자존감", "자신감", "효능", "성취", "열등", "위축된 자아", "자아",
        "작게", "작은 크기", "작은 그림", "에너지", "활력", "무력",
        "자기상", "자기 인식", "낮은 자기",
    ],
    "SOCIAL": [
        "대인", "관계", "사회성", "친구", "또래", "가족", "애착", "소속",
        "고립", "거리감", "단절", "상호작용", "협력", "타인",
    ],
}

# --------------------------------------------------------------------------
# 3. 마음활동 카탈로그
#    implemented=True 인 활동만 프론트에서 바로 실행됩니다.
#    새 게임을 추가하려면 이 목록에 항목을 하나 더 넣고,
#    프론트 iSeed-Frontend-Docker/lib/activities/registry.ts 에 같은 id를 등록하세요.
# --------------------------------------------------------------------------

ACTIVITY_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "calm-cloud",
        "title": "마음 구름 날리기",
        "category": "ANXIETY",
        "summary": "숨을 천천히 들이마시고 내쉬며 마음속 구름을 날려 보내요.",
        "duration_min": 3,
        "growth_point": 20,
        "implemented": True,
    },
    {
        "id": "mood-color",
        "title": "오늘의 마음 색깔",
        "category": "EMOTION",
        "summary": "지금 내 마음과 가장 닮은 색을 골라 기록해요.",
        "duration_min": 2,
        "growth_point": 15,
        "implemented": True,
    },
    {
        "id": "friend-feeling",
        "title": "친구의 마음은 어떨까?",
        "category": "SOCIAL",
        "summary": "상황 카드를 보고 친구가 느낄 감정을 함께 찾아봐요.",
        "duration_min": 4,
        "growth_point": 25,
        "implemented": True,
    },
    {
        "id": "emotion-jenga",
        "title": "감정 젠가",
        "category": "EXPRESSION",
        "summary": "보호자와 번갈아 블록을 뽑고, 블록 색에 맞는 마음 질문에 대답해요.",
        "duration_min": 15,
        "growth_point": 30,
        "implemented": True,
    },
    {
        "id": "story-seed",
        "title": "내 그림 이야기 들려주기",
        "category": "EXPRESSION",
        "summary": "내가 그린 그림에 이름을 붙이고 이야기를 만들어요.",
        "duration_min": 5,
        "growth_point": 25,
        "implemented": False,
    },
    {
        "id": "brave-badge",
        "title": "오늘의 용기 배지",
        "category": "SELF_ESTEEM",
        "summary": "오늘 해낸 작은 일을 찾아 스스로에게 배지를 달아줘요.",
        "duration_min": 3,
        "growth_point": 20,
        "implemented": False,
    },
]

# 카테고리별 기본(항상 후보) 활동 – 신호가 약해도 최소 1개는 제안
DEFAULT_ORDER = ["EMOTION", "EXPRESSION", "ANXIETY", "SOCIAL", "SELF_ESTEEM"]


# --------------------------------------------------------------------------
# 4. 텍스트 수집 / 점수 계산
# --------------------------------------------------------------------------


def _collect_text(node: Any, bucket: List[str]) -> None:
    """dict/list/str 를 재귀적으로 훑어 문자열만 모읍니다."""
    if isinstance(node, str):
        s = node.strip()
        if s:
            bucket.append(s)
    elif isinstance(node, dict):
        for value in node.values():
            _collect_text(value, bucket)
    elif isinstance(node, list):
        for value in node:
            _collect_text(value, bucket)


def _interpretation_text(results: Dict[str, Any]) -> str:
    """그림별 해석(interpretation)에서 분석 문장만 뽑아 하나의 텍스트로."""
    bucket: List[str] = []
    for key in ("tree", "house", "man", "woman"):
        item = (results or {}).get(key) or {}
        if not isinstance(item, dict):
            continue
        interpretation = item.get("interpretation")
        if isinstance(interpretation, dict):
            for section_key, section in interpretation.items():
                # 추천_사항은 LLM이 이미 만든 '보호자 추천'이므로 신호로도 사용
                _collect_text(section, bucket)
    return "\n".join(bucket)


def _overall_text(overall: Any) -> str:
    bucket: List[str] = []
    _collect_text(overall, bucket)
    return "\n".join(bucket)


def _score_from_keywords(text: str) -> Dict[str, float]:
    """카테고리별 키워드 등장 횟수 기반 점수."""
    scores = {cat: 0.0 for cat in CATEGORIES}
    if not text:
        return scores
    for cat, words in KEYWORD_LEXICON.items():
        hit = 0
        for w in words:
            if w and w in text:
                hit += text.count(w)
        scores[cat] += float(hit)
    return scores


def _score_from_tscores(comparison: Dict[str, Any], scores: Dict[str, float]) -> List[str]:
    """
    T-Score(에너지/위치안정성/표현력)를 신호로 반영.
    T-Score는 평균 50, 낮을수록 지원이 필요한 영역.
    """
    notes: List[str] = []
    drawing_scores = (comparison or {}).get("drawing_scores") or {}
    agg = drawing_scores.get("aggregated") if isinstance(drawing_scores, dict) else None
    if not isinstance(agg, dict):
        return notes

    def _num(v):
        try:
            return float(v)
        except (TypeError, ValueError):
            return None

    energy = _num(agg.get("에너지_점수"))
    stability = _num(agg.get("위치_안정성_점수"))
    expression = _num(agg.get("표현력_점수"))

    if energy is not None and energy < 45:
        scores["SELF_ESTEEM"] += (45 - energy) / 5.0
        scores["ANXIETY"] += (45 - energy) / 10.0
        notes.append("그림의 에너지 지표가 또래 평균보다 낮게 관찰되었습니다.")
    if stability is not None and stability < 45:
        scores["ANXIETY"] += (45 - stability) / 4.0
        notes.append("그림의 위치 안정성 지표가 또래 평균보다 낮게 관찰되었습니다.")
    if expression is not None and expression < 45:
        scores["EXPRESSION"] += (45 - expression) / 4.0
        scores["EMOTION"] += (45 - expression) / 10.0
        notes.append("그림의 표현력 지표가 또래 평균보다 낮게 관찰되었습니다.")
    return notes


def _reason_for(category: str, keyword_hits: List[str], notes: List[str]) -> str:
    """보호자에게 보여줄 추천 사유 (단정적 진단 표현을 쓰지 않습니다)."""
    base = {
        "ANXIETY": "그림에서 긴장·불안과 관련된 정서 신호가 관찰되어, 몸과 마음을 이완하는 활동을 권합니다.",
        "EMOTION": "감정을 알아차리고 이름 붙이는 연습이 도움이 될 수 있는 신호가 관찰되었습니다.",
        "EXPRESSION": "표현이 조심스러운 편으로 관찰되어, 편안하게 표현해 보는 활동을 권합니다.",
        "SELF_ESTEEM": "자기 효능감을 북돋는 경험이 도움이 될 수 있는 신호가 관찰되었습니다.",
        "SOCIAL": "또래·가족 관계에서의 감정 이해를 연습해 보면 좋을 신호가 관찰되었습니다.",
    }[category]
    if keyword_hits:
        base += " (관찰 키워드: " + ", ".join(keyword_hits[:4]) + ")"
    return base


def _matched_keywords(text: str, category: str) -> List[str]:
    if not text:
        return []
    found = []
    for w in KEYWORD_LEXICON.get(category, []):
        if w in text and w not in found:
            found.append(w)
    return found


# --------------------------------------------------------------------------
# 5. 공개 API
# --------------------------------------------------------------------------


def build_activity_recommendations(
    results: Dict[str, Any],
    comparison: Dict[str, Any] | None = None,
    overall: Dict[str, Any] | None = None,
    limit: int = 3,
) -> Dict[str, Any]:
    """
    분석 결과로부터 마음활동 추천 목록을 만듭니다.

    Args:
        results: /analyze 의 results (그림별 interpretation 포함)
        comparison: /analyze 의 comparison (drawing_scores 포함)
        overall: /analyze 의 전체_심리_결과
        limit: 추천 개수

    Returns:
        {
          "signals": [{"category","label","score","reason","keywords"} ...],
          "activities": [{"id","title","category","category_label","summary",
                          "duration_min","growth_point","implemented","reason"} ...],
          "notes": [str, ...]
        }
        실패해도 예외를 던지지 않고 빈 구조를 돌려줍니다.
    """
    try:
        text = "\n".join(
            [_interpretation_text(results or {}), _overall_text(overall or {})]
        )
        scores = _score_from_keywords(text)
        notes = _score_from_tscores(comparison or {}, scores)

        ranked = sorted(
            CATEGORIES.keys(),
            key=lambda c: (-scores.get(c, 0.0), DEFAULT_ORDER.index(c) if c in DEFAULT_ORDER else 99),
        )

        # 신호가 전혀 없으면 기본 순서로 대체 (항상 활동을 제안하기 위함)
        if all(scores.get(c, 0.0) <= 0 for c in CATEGORIES):
            ranked = list(DEFAULT_ORDER)

        signals = []
        for cat in ranked:
            kws = _matched_keywords(text, cat)
            signals.append(
                {
                    "category": cat,
                    "label": CATEGORIES[cat]["label"],
                    "score": round(scores.get(cat, 0.0), 2),
                    "reason": _reason_for(cat, kws, notes),
                    "keywords": kws[:6],
                }
            )

        # 카테고리 순위에 맞춰 활동 선정 (구현된 활동 우선)
        activities: List[Dict[str, Any]] = []
        used_ids = set()
        for stage in (True, False):  # 1차: implemented=True, 2차: 나머지
            for cat in ranked:
                if len(activities) >= limit:
                    break
                for act in ACTIVITY_CATALOG:
                    if act["category"] != cat or act["id"] in used_ids:
                        continue
                    if act["implemented"] is not stage:
                        continue
                    used_ids.add(act["id"])
                    activities.append(
                        {
                            **act,
                            "category_label": CATEGORIES[cat]["label"],
                            "category_description": CATEGORIES[cat]["description"],
                            "reason": _reason_for(cat, _matched_keywords(text, cat), notes),
                        }
                    )
                    break
            if len(activities) >= limit:
                break

        return {
            "signals": signals[:5],
            "activities": activities[:limit],
            "notes": notes,
            "disclaimer": (
                "이 추천은 그림에서 관찰된 정서 신호를 바탕으로 한 보조적 제안이며, "
                "전문적인 심리 진단을 대체하지 않습니다."
            ),
        }
    except Exception as e:  # 추천 실패가 분석 응답을 깨뜨리지 않도록
        print(f"[recommendation_service] 추천 생성 실패(무시): {e}")
        return {"signals": [], "activities": [], "notes": [], "disclaimer": ""}


def list_all_activities() -> List[Dict[str, Any]]:
    """전체 마음활동 카탈로그 (프론트 활동 목록 화면용)."""
    out = []
    for act in ACTIVITY_CATALOG:
        cat = act["category"]
        out.append(
            {
                **act,
                "category_label": CATEGORIES[cat]["label"],
                "category_description": CATEGORIES[cat]["description"],
            }
        )
    return out
