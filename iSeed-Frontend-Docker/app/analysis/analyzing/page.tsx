"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Brain, Users, FileText, Lightbulb } from "lucide-react";
import { AnalysisStoryModal } from "@/components/analysis/analysis-story-modal";

const aimodelsBaseUrl =
  process.env.NEXT_PUBLIC_AIMODELS_BASE_URL ?? "http://localhost:8080";
const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const analysisSteps = [
  {
    id: 1,
    label: "구성요소 분석 중...",
    icon: Sparkles,
    tip: "아이들은 그림을 통해 언어로 표현하기 어려운 감정을 나타내요.",
  },
  {
    id: 2,
    label: "발달 단계 평가 중...",
    icon: Brain,
    tip: "그림의 크기와 위치는 아이의 자신감과 관련이 있을 수 있어요.",
  },
  {
    id: 3,
    label: "또래 비교 중...",
    icon: Users,
    tip: "색상 선택은 아이의 현재 감정 상태를 반영할 수 있어요.",
  },
  {
    id: 4,
    label: "종합 분석 중...",
    icon: FileText,
    tip: "그림에서 사람의 크기는 그 사람에 대한 감정적 중요도를 나타내기도 해요.",
  },
];

const tips = [
  "아이들은 그림을 통해 언어로 표현하기 어려운 감정을 나타내요.",
  "그림의 크기와 위치는 아이의 자신감과 관련이 있을 수 있어요.",
  "색상 선택은 아이의 현재 감정 상태를 반영할 수 있어요.",
  "그림에서 사람의 크기는 그 사람에 대한 감정적 중요도를 나타내기도 해요.",
  "집 그림에서 문과 창문은 외부 세계와의 소통 의지를 나타낼 수 있어요.",
  "나무 그림은 아이의 자아상과 성장 욕구를 반영할 수 있어요.",
  "그림을 그리는 순서도 중요한 분석 요소가 될 수 있어요.",
  "같은 주제의 그림도 시간이 지나면서 변화하는 것이 자연스러워요.",
];

/** 배경 파티클 위치를 SSR/CSR 불일치 없이 생성 */
function useParticles(count: number) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(i * 37 + 13) % 100}%`,
        delay: `${(i * 0.7) % 3}s`,
        duration: `${2.5 + (i % 3)}s`,
        size: 3 + (i % 4),
      })),
    [count],
  );
}

export default function AnalyzingPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [tipFading, setTipFading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedDurationMs, setCompletedDurationMs] = useState<number | null>(
    null,
  );
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyData, setStoryData] = useState<any>(null);

  const particles = useParticles(12);

  const dataUrlToFile = (dataUrl: string, filename: string) => {
    const [header, data] = dataUrl.split(",");
    const mimeMatch = header?.match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const binary = atob(data);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      array[i] = binary.charCodeAt(i);
    }
    return new File([array], filename, { type: mime });
  };

  /* ── Tip rotation with fade ── */
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipFading(true);
      setTimeout(() => {
        setCurrentTip((prev) => (prev + 1) % tips.length);
        setTipFading(false);
      }, 400);
    }, 7000);
    return () => clearInterval(tipInterval);
  }, []);

  /* ── Analysis fetch ── */
  useEffect(() => {
    const globalStore = globalThis as typeof globalThis & {
      __analysisPayload?: any;
      __analysisFiles?: (File | null)[];
      __analysisFetchStarted?: boolean;
    };
    const payload = globalStore.__analysisPayload;
    const files = globalStore.__analysisFiles || [];
    if (!payload) {
      router.push("/analysis");
      return;
    }
    if (globalStore.__analysisFetchStarted) {
      return;
    }
    globalStore.__analysisFetchStarted = true;

    const images: string[] = payload.images || [];
    const slots: { label: string; objectKey: string }[] = payload.slots || [];
    const childInfo = payload.childInfo || {};

    if (
      images.length !== 4 ||
      slots.length !== 4 ||
      images.some((img) => !img)
    ) {
      setError("분석에 필요한 이미지가 부족합니다.");
      globalStore.__analysisFetchStarted = false;
      return;
    }

    const formData = new FormData();
    images.forEach((dataUrl, index) => {
      const slot = slots[index];
      const sourceFile = files[index];
      const file = sourceFile || dataUrlToFile(dataUrl, `${slot.label}.png`);
      formData.append(slot.objectKey, file);
    });
    formData.append("child_name", childInfo.name || "");
    formData.append("child_age", childInfo.age || "");
    formData.append("child_gender", childInfo.gender || "");

    const analysisStartedAt = Date.now();
    setElapsedSeconds(0);
    setCompletedDurationMs(null);
    setProgress(0);

    const expectedDurationMs = 30_000;
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - analysisStartedAt;
      const p = Math.min(95, (elapsed / expectedDurationMs) * 95);
      setProgress(p);
    }, 80);
    const elapsedInterval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - analysisStartedAt) / 1000));
    }, 1000);

    fetch(`${aimodelsBaseUrl}/analyze`, {
      method: "POST",
      body: formData,
    })
      .then(async (response) => {
        if (!response.ok) {
          const detail = await response.text();
          throw new Error(detail || "분석 요청 실패");
        }
        return response.json();
      })
      .then(async (data) => {
        const globalStore = globalThis as typeof globalThis & {
          __analysisResponse?: any;
          __analysisImages?: string[];
          __analysisBoxImages?: Record<string, string | null>;
        };

        globalStore.__analysisResponse = data;
        globalStore.__analysisImages = images;
        globalStore.__analysisBoxImages = {
          tree: data?.results?.tree?.box_image_base64 || null,
          house: data?.results?.house?.box_image_base64 || null,
          man: data?.results?.man?.box_image_base64 || null,
          woman: data?.results?.woman?.box_image_base64 || null,
        };
        try {
          sessionStorage.setItem(
            "analysisBoxImages",
            JSON.stringify(globalStore.__analysisBoxImages),
          );
        } catch (_) {}

        const storageData = JSON.parse(JSON.stringify(data));
        if (storageData?.results) {
          Object.keys(storageData.results).forEach((key: string) => {
            if (storageData.results[key]) {
              storageData.results[key].box_image_base64 = null;
            }
          });
        }
        sessionStorage.setItem("analysisResponse", JSON.stringify(storageData));
        const analysisDurationMs = Date.now() - analysisStartedAt;
        clearInterval(progressInterval);
        clearInterval(elapsedInterval);
        setCompletedDurationMs(analysisDurationMs);
        try {
          const g = globalThis as typeof globalThis & {
            __analysisDurationMs?: number;
          };
          g.__analysisDurationMs = analysisDurationMs;
          sessionStorage.setItem(
            "analysisDurationMs",
            String(analysisDurationMs),
          );
        } catch (_) {}
        setProgress(100);

        // MongoDB + S3 저장: 로그인 유저면 BackEnd /drawing-analyses 호출
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("auth_token") ||
              sessionStorage.getItem("auth_token")
            : null;
        if (token) {
          try {
            const meRes = await fetch(`${apiBaseUrl}/auth/me`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              const userId = meData.id;
              if (userId != null) {
                const results = data?.results || {};
                const rawImg = (o: unknown) =>
                  o && typeof o === "object" ? o : {};
                const one = (key: "tree" | "house" | "man" | "woman") => {
                  const r = results[key];
                  const imageJson = rawImg(r?.image_json);
                  const legacyJson = rawImg((r as { legacy_json?: unknown })?.legacy_json);
                  const out: Record<string, unknown> = {
                    image_json: JSON.parse(JSON.stringify(imageJson)),
                  };
                  if (legacyJson && Object.keys(legacyJson).length > 0) {
                    out.legacy_json = JSON.parse(JSON.stringify(legacyJson));
                  }
                  return out;
                };
                const elementAnalysis = {
                  tree: one("tree"),
                  house: one("house"),
                  man: one("man"),
                  woman: one("woman"),
                };
                const boxImagesBase64: Record<string, string | null> = {
                  tree: results.tree?.box_image_base64 ?? null,
                  house: results.house?.box_image_base64 ?? null,
                  man: results.man?.box_image_base64 ?? null,
                  woman: results.woman?.box_image_base64 ?? null,
                };
                const psychologicalInterpretation: Record<
                  string,
                  { interpretation?: unknown; analysis?: unknown }
                > = {};
                (["tree", "house", "man", "woman"] as const).forEach((k) => {
                  psychologicalInterpretation[k] = {
                    interpretation: results[k]?.interpretation,
                    analysis: results[k]?.analysis,
                  };
                });
                const saveRes = await fetch(`${apiBaseUrl}/drawing-analyses`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    user_id: userId,
                    child_info: data?.child || {},
                    element_analysis: elementAnalysis,
                    box_images_base64: boxImagesBase64,
                    psychological_interpretation: psychologicalInterpretation,
                    comparison: data?.comparison || {},
                    recommendations: Array.isArray(
                      (data as any)?.recommendations,
                    )
                      ? (data as any).recommendations
                      : [],
                    overall_psychology_result:
                      (data as any)?.전체_심리_결과 &&
                      typeof (data as any).전체_심리_결과 === "object"
                        ? (data as any).전체_심리_결과
                        : {},
                  }),
                });
                if (!saveRes.ok) {
                  const errText = await saveRes.text();
                  console.error("[분석 저장 실패]", saveRes.status, errText);
                }
              }
            }
          } catch (e) {
            console.error("[분석 저장 중 예외]", e);
          }
        }

        // 분석 완료 → 스토리 모달 표시
        setStoryData(data);
        setTimeout(() => {
          setStoryOpen(true);
        }, 500);
      })
      .catch((err: Error) => {
        clearInterval(progressInterval);
        clearInterval(elapsedInterval);
        setError(err.message || "분석 요청 중 오류가 발생했습니다.");
      })
      .finally(() => {
        const g = globalThis as typeof globalThis & {
          __analysisFetchStarted?: boolean;
        };
        g.__analysisFetchStarted = false;
      });
  }, [router]);

  useEffect(() => {
    if (progress < 25) setCurrentStep(0);
    else if (progress < 50) setCurrentStep(1);
    else if (progress < 75) setCurrentStep(2);
    else setCurrentStep(3);
  }, [progress]);

  const StepIcon = analysisSteps[currentStep]?.icon ?? Sparkles;

  return (
    <>
    <AnalysisStoryModal
      open={storyOpen}
      data={storyData}
      onClose={() => {
        setStoryOpen(false);
        router.push("/analysis/result");
      }}
    />
    <div className="analyzing-bg fixed inset-0 flex items-center justify-center p-4 overflow-hidden">
      {/* ── Floating particles ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p, i) => (
          <span
            key={i}
            className="analyzing-particle absolute rounded-full bg-primary/20"
            style={{
              left: p.left,
              bottom: "-10px",
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-4xl analyzing-fade-up">
        {/* ── Glass card ── */}
        <div className="rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-black/10 dark:shadow-black/30">
          <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-black/[0.06] dark:divide-white/[0.06]">
            {/* ══ Left panel: Icon + Progress ══ */}
            <div className="flex-1 p-8 sm:p-10 flex flex-col items-center justify-center">
              {/* ── Animated icon area ── */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  {/* Outer pulsing ring */}
                  <div className="analyzing-ring-pulse absolute -inset-4 rounded-full border-2 border-primary/20" />
                  <div
                    className="analyzing-ring-pulse absolute -inset-8 rounded-full border border-primary/10"
                    style={{ animationDelay: "1s" }}
                  />

                  {/* Heartbeat glow layers (같은 1.6s 키프레임으로 심장박동과 동기화) */}
                  <div className="analyzing-heartbeat-glow absolute -inset-5 rounded-3xl bg-primary/40 blur-xl" />
                  <div className="analyzing-heartbeat-glow absolute -inset-10 rounded-3xl bg-primary/20 blur-2xl" />

                  {/* Float wrapper */}
                  <div className="analyzing-icon-float">
                    {/* Heartbeat icon container */}
                    <div className="analyzing-heartbeat relative h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                      <StepIcon className="h-11 w-11 text-primary-foreground" />

                      {/* Orbiting dot */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="analyzing-orbit-dot h-2.5 w-2.5 rounded-full bg-primary/60 shadow-sm shadow-primary/40" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Title ── */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-1.5">
                  그림을 분석하고 있어요
                </h1>
                <p className="text-muted-foreground text-sm">
                  AI가 아이의 그림을 세심하게 분석 중입니다
                </p>
              </div>

              {/* ── Progress bar ── */}
              <div className="w-full max-w-sm">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground font-medium">
                    분석 진행률
                  </span>
                  <span className="font-bold text-primary tabular-nums">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="relative">
                  <Progress value={progress} className="h-3 rounded-full" />
                  {progress < 100 && (
                    <div className="analyzing-shimmer absolute inset-0 rounded-full overflow-hidden pointer-events-none" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2.5 tabular-nums">
                  {completedDurationMs != null
                    ? `분석 완료 · 소요 시간 ${completedDurationMs >= 60000 ? `${Math.floor(completedDurationMs / 60000)}분 ` : ""}${Math.round((completedDurationMs % 60000) / 1000)}초`
                    : `소요 시간 ${Math.floor(elapsedSeconds / 60)}분 ${elapsedSeconds % 60}초`}
                </p>
              </div>

              {error && (
                <div className="mt-4 w-full max-w-sm rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>

            {/* ══ Right panel: Steps + Tip ══ */}
            <div className="flex-1 p-8 sm:p-10 flex flex-col justify-center">
              {/* ── Steps ── */}
              <div className="space-y-2.5 mb-6">
                {analysisSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isComplete = index < currentStep;

                  return (
                    <div
                      key={step.id}
                      className={`analyzing-step-enter flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-primary/10 dark:bg-primary/15 border border-primary/25 shadow-sm"
                          : isComplete
                            ? "bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/30"
                            : "opacity-40 border border-transparent"
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : isComplete
                              ? "bg-emerald-500 text-white"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isComplete ? (
                          <svg
                            className="analyzing-check-draw h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium transition-colors ${
                          isActive
                            ? "text-foreground"
                            : isComplete
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-muted-foreground"
                        }`}
                      >
                        {isComplete
                          ? step.label.replace("중...", "완료")
                          : step.label}
                      </span>
                      {isActive && (
                        <div className="ml-auto flex gap-1">
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Tip ── */}
              <div className="rounded-2xl p-4 border border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/20">
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                    <Lightbulb className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                      알고 계셨나요?
                    </p>
                    <p
                      className={`text-sm text-amber-700 dark:text-amber-400/90 leading-relaxed transition-opacity duration-400 ${
                        tipFading ? "opacity-0" : "opacity-100"
                      }`}
                    >
                      {tips[currentTip]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
