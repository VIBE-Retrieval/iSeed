"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TreeDeciduous,
  Home,
  Users,
  Brain,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Heart,
} from "lucide-react";

/* ── helpers ───────────────────────────────────────────── */

function cleanChildName(fullName: string): string {
  if (!fullName || typeof fullName !== "string") return "아이";
  let s = fullName.trim();
  for (const suf of [" 아동", " 군", " 양"]) {
    if (s.endsWith(suf)) s = s.slice(0, -suf.length).trim();
  }
  return s || "아이";
}

function toCallName(fullName: string): string {
  const name = cleanChildName(fullName);
  if (name === "아이") return "아이";
  const given = name.length > 1 ? name.slice(1) : name;
  if (!given) return "아이";
  const code = given.charCodeAt(given.length - 1);
  const hasBatchim =
    code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return given + (hasBatchim ? "이" : "");
}

/** 해석 객체에서 가장 읽기 좋은 텍스트 추출 */
function extractMainText(interp: unknown, depth = 0): string {
  if (depth > 4) return "";
  if (!interp) return "";
  if (typeof interp === "string") return interp.trim();
  if (typeof interp !== "object") return "";
  const obj = interp as Record<string, unknown>;
  // 요약성 필드 우선
  const priorityFields = [
    "인상적_해석",
    "정서_영역_소견",
    "전체_요약",
    "발달_단계_소견",
    "종합_소견",
    "내용",
  ];
  for (const field of priorityFields) {
    const val = obj[field];
    if (typeof val === "string" && val.trim()) return val.trim();
    if (typeof val === "object" && val) {
      const sub = (val as Record<string, unknown>)["내용"];
      if (typeof sub === "string" && sub.trim()) return sub.trim();
    }
  }
  // 첫 번째 값으로 재귀
  for (const val of Object.values(obj)) {
    const text = extractMainText(val, depth + 1);
    if (text) return text;
  }
  return "";
}

/** N세 남/여아 표현을 아이 이름으로 치환 */
function replaceAgeGender(text: string, callName: string): string {
  return text
    .replace(/\d+세\s*남아/g, callName)
    .replace(/\d+세\s*여아/g, callName);
}

/** API 추천 카테고리(영문) → 표시용 한글 라벨 */
const RECOMMENDATION_CATEGORY_LABELS: Record<string, string> = {
  emotional_psychological_support: "정서·심리 지원",
  interpersonal_social: "대인관계·사회성",
  parenting_daily_activities: "양육·일상 활동",
  analysis_based: "분석 기반 추천",
};

function getRecommendationCategoryLabel(category: string): string {
  if (!category || typeof category !== "string") return category;
  const exact = RECOMMENDATION_CATEGORY_LABELS[category];
  if (exact) return exact;
  const key = category.trim().toLowerCase();
  const entry = Object.entries(RECOMMENDATION_CATEGORY_LABELS).find(
    ([k]) => k.toLowerCase() === key,
  );
  return entry ? entry[1] : category;
}

/* ── types ─────────────────────────────────────────────── */

interface AnalysisData {
  child?: { name?: string; age?: string | number; gender?: string };
  results?: {
    tree?: { interpretation?: unknown; analysis?: unknown };
    house?: { interpretation?: unknown; analysis?: unknown };
    man?: { interpretation?: unknown; analysis?: unknown };
    woman?: { interpretation?: unknown; analysis?: unknown };
  };
  전체_심리_결과?: {
    종합_요약?: string;
    인상적_분석?: string;
    구조적_분석_요약?: string;
    표상적_분석_종합?: string;
  };
  comparison?: { overall_score?: number; development?: { stage?: string } };
  recommendations?: { category: string; items: string[] }[];
}

interface StoryPage {
  icon: React.ReactNode;
  bg: string;
  accent: string;
  label: string;
  title: string;
  body: string;
  extra?: string;
}

/* ── main component ─────────────────────────────────────── */

interface Props {
  open: boolean;
  data: AnalysisData | null;
  onClose: () => void; // 결과 페이지로 이동
}

export function AnalysisStoryModal({ open, data, onClose }: Props) {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);
  const [visible, setVisible] = useState(false);

  /* 모달 열릴 때 첫 페이지로 초기화 */
  useEffect(() => {
    if (open) {
      setPage(0);
      setDirection("next");
      setTimeout(() => setVisible(true), 30);
    } else {
      setVisible(false);
    }
  }, [open]);

  /* ── 스토리 페이지 생성 ── */
  const pages: StoryPage[] = buildPages(data);
  const total = pages.length;
  const current = pages[page];

  const go = useCallback(
    (dir: "next" | "prev") => {
      if (animating) return;
      const next = dir === "next" ? page + 1 : page - 1;
      if (next < 0 || next >= total) return;
      setDirection(dir);
      setAnimating(true);
      setTimeout(() => {
        setPage(next);
        setAnimating(false);
      }, 280);
    },
    [animating, page, total],
  );

  /* 키보드 탐색 */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") go("next");
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") go("prev");
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, go, onClose]);

  if (!open) return null;

  const isLast = page === total - 1;

  return (
    /* ── overlay ── */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.35s ease",
      }}
    >
      {/* ── book card ── */}
      <div
        className="relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: "white",
          maxHeight: "90vh",
          minHeight: "520px",
          transform: visible ? "scale(1)" : "scale(0.94)",
          transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* ── 상단 컬러 배너 ── */}
        <div
          className={`${current.bg} px-8 pt-8 pb-6 flex flex-col items-center text-center`}
        >
          {/* 진행 점 */}
          <div className="flex gap-1.5 mb-5">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (i !== page && !animating) {
                    setDirection(i > page ? "next" : "prev");
                    setAnimating(true);
                    setTimeout(() => {
                      setPage(i);
                      setAnimating(false);
                    }, 280);
                  }
                }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === page ? 20 : 8,
                  height: 8,
                  background:
                    i === page
                      ? "rgba(255,255,255,0.95)"
                      : "rgba(255,255,255,0.4)",
                }}
                aria-label={`${i + 1}페이지`}
              />
            ))}
          </div>

          {/* 아이콘 */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ background: "rgba(255,255,255,0.25)" }}
          >
            {current.icon}
          </div>

          {/* 라벨 + 제목 */}
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">
            {current.label}
          </p>
          <h2 className="text-2xl font-bold text-white leading-snug">
            {current.title}
          </h2>
        </div>

        {/* ── 본문 영역 ── */}
        <div
          className="flex-1 overflow-y-auto px-8 py-6"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating
              ? `translateX(${direction === "next" ? 30 : -30}px)`
              : "translateX(0)",
            transition: "opacity 0.28s ease, transform 0.28s ease",
          }}
        >
          <p className="text-base leading-relaxed text-gray-700 whitespace-pre-wrap">
            {current.body || "분석 내용을 불러오는 중이에요."}
          </p>

          {current.extra && (
            <div className="mt-5 rounded-2xl p-4 bg-amber-50 border border-amber-200">
              <p className="text-sm font-semibold text-amber-700 mb-1 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" />
                추천 활동
              </p>
              <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-wrap">
                {current.extra}
              </p>
            </div>
          )}
        </div>

        {/* ── 하단 버튼 ── */}
        <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between gap-3">
          {/* 이전 */}
          <button
            onClick={() => go("prev")}
            disabled={page === 0 || animating}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </button>

          {/* 페이지 번호 */}
          <span className="text-xs text-gray-400 tabular-nums">
            {page + 1} / {total}
          </span>

          {/* 다음 / 결과 보기 */}
          {isLast ? (
            <button
              onClick={onClose}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all ${current.accent}`}
            >
              전체 결과 보기
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => go("next")}
              disabled={animating}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md disabled:opacity-60 transition-all ${current.accent}`}
            >
              다음
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── page builder ───────────────────────────────────────── */

function buildPages(data: AnalysisData | null): StoryPage[] {
  const pages: StoryPage[] = [];

  const childName = cleanChildName(data?.child?.name || "");
  const callName = toCallName(data?.child?.name || "");
  const age = data?.child?.age ? `${data.child.age}세` : "";
  const gender =
    data?.child?.gender === "male" ||
    data?.child?.gender === "남" ||
    data?.child?.gender === "남자"
      ? "남자아이"
      : data?.child?.gender
        ? "여자아이"
        : "";
  const score = data?.comparison?.overall_score;

  /* 1. 오프닝 */
  const scoreLine =
    typeof score === "number" && score > 0
      ? `\n\n종합 점수는 ${score}점이에요.`
      : "";

  pages.push({
    icon: <Sparkles className="w-8 h-8 text-white" />,
    bg: "bg-gradient-to-br from-violet-500 to-purple-700",
    accent: "bg-violet-600 hover:bg-violet-700",
    label: "분석 완료",
    title: `${callName}의 그림 이야기`,
    body: `안녕하세요! 방금 AI가 ${callName}${age ? `(${age} ${gender})` : ""}의 그림을 꼼꼼히 살펴봤어요.${scoreLine}\n\n지금부터 그림 속에 담긴 이야기를 하나씩 들려드릴게요. 다음 버튼을 눌러 함께 살펴봐요! 📖`,
  });

  const results = data?.results || {};

  /* 2–5. 그림별 해석 */
  const drawings: {
    key: keyof typeof results;
    label: string;
    title: string;
    icon: React.ReactNode;
    bg: string;
    accent: string;
    intro: (n: string) => string;
  }[] = [
    {
      key: "tree",
      label: "나무 그림",
      title: "나무 그림 이야기 🌳",
      icon: <TreeDeciduous className="w-8 h-8 text-white" />,
      bg: "bg-gradient-to-br from-emerald-500 to-teal-700",
      accent: "bg-emerald-600 hover:bg-emerald-700",
      intro: (n) =>
        `${n}가 그린 나무를 보면, 아이의 자아상과 성장 에너지를 엿볼 수 있어요.\n\n`,
    },
    {
      key: "house",
      label: "집 그림",
      title: "집 그림 이야기 🏠",
      icon: <Home className="w-8 h-8 text-white" />,
      bg: "bg-gradient-to-br from-sky-500 to-blue-700",
      accent: "bg-sky-600 hover:bg-sky-700",
      intro: (n) =>
        `${n}가 그린 집은 가정과 안전감에 대한 마음을 담고 있어요.\n\n`,
    },
    {
      key: "man",
      label: "남자사람 그림",
      title: "남자사람 그림 이야기 🧍",
      icon: <Users className="w-8 h-8 text-white" />,
      bg: "bg-gradient-to-br from-orange-400 to-rose-600",
      accent: "bg-orange-500 hover:bg-orange-600",
      intro: (n) =>
        `${n}가 그린 남자사람은 주변 인물이나 자아 인식과 관련이 있어요.\n\n`,
    },
    {
      key: "woman",
      label: "여자사람 그림",
      title: "여자사람 그림 이야기 🧍‍♀️",
      icon: <Users className="w-8 h-8 text-white" />,
      bg: "bg-gradient-to-br from-pink-400 to-fuchsia-600",
      accent: "bg-pink-500 hover:bg-pink-600",
      intro: (n) =>
        `${n}가 그린 여자사람에서도 아이의 감정과 관계 인식이 드러나요.\n\n`,
    },
  ];

  for (const d of drawings) {
    const result = results[d.key];
    const rawText =
      extractMainText(result?.interpretation) ||
      extractMainText(result?.analysis);
    const text = rawText
      ? replaceAgeGender(rawText, callName)
      : "이 그림에 대한 분석 내용이 없어요.";
    pages.push({
      icon: d.icon,
      bg: d.bg,
      accent: d.accent,
      label: d.label,
      title: d.title,
      body: d.intro(callName) + text,
    });
  }

  /* 6. 종합 심리 분석 */
  const whole = data?.전체_심리_결과;
  const wholeSummary =
    whole?.종합_요약 ||
    whole?.인상적_분석 ||
    whole?.표상적_분석_종합 ||
    whole?.구조적_분석_요약;
  if (wholeSummary) {
    pages.push({
      icon: <Brain className="w-8 h-8 text-white" />,
      bg: "bg-gradient-to-br from-indigo-500 to-blue-800",
      accent: "bg-indigo-600 hover:bg-indigo-700",
      label: "종합 심리 분석",
      title: `${callName}의 마음 이야기 💝`,
      body: replaceAgeGender(wholeSummary, callName),
    });
  }

  /* 7. 추천 활동 */
  const recs = data?.recommendations;
  if (Array.isArray(recs) && recs.length > 0) {
    const recText = recs
      .slice(0, 2)
      .map((r) => {
        const catLabel = getRecommendationCategoryLabel(r.category || "");
        const items = Array.isArray(r.items)
          ? r.items
              .slice(0, 3)
              .map((item, i) => `${i + 1}. ${item}`)
              .join("\n")
          : "";
        return catLabel ? `【${catLabel}】\n${items}` : items;
      })
      .filter(Boolean)
      .join("\n\n");

    pages.push({
      icon: <Lightbulb className="w-8 h-8 text-white" />,
      bg: "bg-gradient-to-br from-amber-400 to-orange-600",
      accent: "bg-amber-500 hover:bg-amber-600",
      label: "추천 활동",
      title: "이렇게 해보세요 💡",
      body: `${callName}를 위해 AI가 특별히 추천하는 활동이에요.\n\n함께 해보시면 ${callName}의 정서 발달에 큰 도움이 될 거예요!`,
      extra: recText,
    });
  }

  /* 8. 마무리 */
  pages.push({
    icon: <Heart className="w-8 h-8 text-white" />,
    bg: "bg-gradient-to-br from-rose-400 to-pink-700",
    accent: "bg-rose-500 hover:bg-rose-600",
    label: "분석 완료",
    title: "더 자세히 살펴볼까요? 📋",
    body: `지금까지 ${callName}의 그림 이야기를 함께 살펴봤어요.\n\n전체 결과 페이지에서는 그림별 구성요소, 또래 비교 차트, 심리 발달 점수, 상세 해석 등을 한눈에 확인하실 수 있어요.\n\n'전체 결과 보기' 버튼을 눌러 자세한 내용을 확인해보세요! 🌟`,
  });

  return pages;
}
