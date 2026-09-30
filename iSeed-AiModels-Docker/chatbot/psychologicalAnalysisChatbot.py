import os
import sys
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
import markdown
try:
    from .guideChatbot import get_common_llm  # 공통 LLM 함수 사용
except ImportError:
    # 스크립트 직접 실행 시(relative import 실패) fallback
    from guideChatbot import get_common_llm

# 그림별 해석에서 챗봇에 넘길 항목과 순서.
#   /analyze 가 실제로 돌려주는 interpretation 키 기준입니다.
#   (예전 코드는 존재하지 않는 "전체_요약" 키만 찾아서 그림별 해석이 LLM에 전혀 전달되지 않았습니다)
_INTERP_KEYS = ("전체_요약", "인상적_해석", "정서_영역_소견", "심리_상태_소견")
_MAX_SECTION_CHARS = 600


def _as_text(value) -> str:
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, dict):
        if "내용" in value and isinstance(value["내용"], str):
            return value["내용"].strip()
        return " ".join(_as_text(v) for v in value.values() if _as_text(v))
    if isinstance(value, list):
        return " ".join(_as_text(v) for v in value if _as_text(v))
    return ""


def _clip(text: str, limit: int = _MAX_SECTION_CHARS) -> str:
    return text if len(text) <= limit else text[:limit].rstrip() + "…"


def _build_analysis_context_text(analysis_context: dict) -> str:
    """그림 분석 결과를 LLM이 참고할 수 있는 텍스트로 요약합니다."""
    if not analysis_context:
        return ""
    parts = []
    # 기본 정보
    if analysis_context.get("childName"):
        parts.append(f"분석 대상: {analysis_context['childName']}")
    if analysis_context.get("age"):
        parts.append(f"나이: {analysis_context['age']}세")
    if analysis_context.get("overallScore") is not None:
        parts.append(f"종합 점수(T-Score, 또래 평균 50): {analysis_context['overallScore']}점")
    if analysis_context.get("developmentStage"):
        parts.append(f"발달 단계: {analysis_context['developmentStage']}")
    if analysis_context.get("emotionalState"):
        parts.append(f"정서 상태: {analysis_context['emotionalState']}")

    # T-Score 세부 (에너지 / 위치 안정성 / 표현력)
    scores = analysis_context.get("drawingScores")
    if isinstance(scores, dict):
        items = [f"{k}: {v}" for k, v in scores.items() if isinstance(v, (int, float))]
        if items:
            parts.append("\n[그림 지표 T-Score]\n" + ", ".join(items))

    # 심리 점수
    psych = analysis_context.get("psychologyScores") or analysis_context.get("psychology_scores")
    if psych and isinstance(psych, dict):
        psych_str = ", ".join(f"{k}: {v}점" for k, v in psych.items())
        parts.append(f"\n[심리 지표 점수]\n{psych_str}")

    # 전체 종합 해석 (/analyze 의 전체_심리_결과)
    overall = analysis_context.get("overall")
    summary = analysis_context.get("summary") or (
        overall.get("종합_요약") if isinstance(overall, dict) else ""
    )
    if summary:
        parts.append(f"\n[전체 해석 요약]\n{_clip(_as_text(summary), 1200)}")
    if isinstance(overall, dict):
        for key, label in (("긍정적인_측면", "긍정적인 측면"), ("주의_사항", "살펴볼 부분")):
            text = _as_text(overall.get(key))
            if text:
                parts.append(f"\n[{label}]\n{_clip(text)}")

    # 나무/집/남자/여자별 해석
    interp = analysis_context.get("interpretations") or analysis_context.get("interpretation")
    if interp and isinstance(interp, dict):
        labels = {"tree": "나무", "house": "집", "man": "남자사람", "woman": "여자사람"}
        for key, val in interp.items():
            if not val or not isinstance(val, dict):
                continue
            label = labels.get(key, key)
            interp_obj = val.get("interpretation") if isinstance(val.get("interpretation"), dict) else val
            lines = []
            for k in _INTERP_KEYS:
                text = _as_text(interp_obj.get(k))
                if text:
                    lines.append(f"- {k.replace('_', ' ')}: {_clip(text)}")
            if lines:
                parts.append(f"\n[{label} 그림 해석]\n" + "\n".join(lines))

    # 추천된 마음활동 (iSeed)
    activities = analysis_context.get("activities")
    if isinstance(activities, list) and activities:
        names = [str(a.get("title")) for a in activities if isinstance(a, dict) and a.get("title")]
        if names:
            parts.append("\n[추천된 마음활동]\n" + ", ".join(names))

    return "\n".join(parts) if parts else ""


def get_analysis_aware_prompt():
    """그림 분석 결과를 포함한 상담용 프롬프트"""
    template = """당신은 'iSeed(아이씨드)' 웹사이트의 **아동 그림 심리 분석 상담 도우미**입니다.

아래에 **이 사용자 아이의 그림 분석 결과**가 제공되어 있습니다. 사용자는 이 결과를 바탕으로 추가 질문을 하고 있습니다.

[그림 분석 결과]
{analysis_text}

[역할]
- 그림 분석 결과를 바탕으로 사용자의 질문에 답합니다.
- "결과에서는 X라고 나왔는데, 제가 보기엔 아이가 Y인데요?"처럼 **분석 결과와 실제 관찰이 다를 때**의 질문에 특히 유의해 주세요.
  → 그림 검사(HTP)는 특정 시점의 표현이므로, 실제 일상에서의 모습과 다를 수 있음을 설명해 주세요.
  → 그림에서 낮게 나온 지표라도 일상에서는 잘 나타날 수 있는 이유(그림 그릴 때의 상태, 환경, 그림 표현의 한계 등)를 설명해 주세요.
- 분석 결과의 의미를 쉽게 풀어 설명하고, 궁금한 점에 대해 친절히 답변합니다.
- 도움이 될 때는 [추천된 마음활동]을 가정에서 해볼 수 있는 방법으로 안내해도 좋습니다.
- 너무 장황하게 대답하지 말고 400토큰 전후로 핵심만 대답해 주세요.
- 답변은 **공손한 존댓말**(~하시면 됩니다, ~해 주세요)로 작성합니다.
- "우울증입니다", "불안장애입니다"처럼 **진단하거나 단정하지 마세요.** "~한 정서 신호가 관찰되었습니다" 처럼 표현합니다.
- 전문 상담을 대체하지 않으며 참고용임을 안내하고, 비슷한 신호가 계속 보이면 전문가 상담을 권해 주세요.

[사용자 질문]
{question}
"""
    return ChatPromptTemplate.from_template(template)


def get_answer_for_more_question_about_analysis(question: str, analysis_context: dict | None = None) -> str:
    print('심리 분석 질문 챗봇 작동 시작')
    analysis_text = _build_analysis_context_text(analysis_context or {})
    if not analysis_text.strip():
        # 예전에는 이 경우 chain 이 정의되지 않아 UnboundLocalError(500)가 났습니다.
        analysis_text = "(분석 결과 정보를 불러오지 못했습니다. 일반적인 HTP 그림검사 관점에서 답변해 주세요.)"

    prompt = get_analysis_aware_prompt()
    llm = get_common_llm()
    chain = prompt | llm | StrOutputParser() | RunnableLambda(lambda x: markdown.markdown(x))

    return chain.invoke({
        "analysis_text": analysis_text,
        "question": question,
    })
