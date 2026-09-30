"use client";

export const dynamic = "force-dynamic";

import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SeedCard } from "@/components/iseed/seed-card";
import { DISCLAIMER, FEATURES } from "@/lib/iseed/config";
import { ensureSeed } from "@/lib/iseed/seed";
import { CATEGORY_META, isPlayable } from "@/lib/activities/registry";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  Share2,
  ArrowRight,
  Eye,
  TrendingUp,
  Brain,
  Lightbulb,
  Heart,
  Users,
  BarChart3,
  Home,
  TreeDeciduous,
  User,
  FileText,
  LayoutGrid,
  Layers,
  Sparkles,
  Cloud,
  ThumbsUp,
  Check,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
const OBJECT_KEYS = ["tree", "house", "man", "woman"] as const;
const OBJECT_LABELS: Record<string, string> = {
  tree: "나무",
  house: "집",
  man: "남자사람",
  woman: "여자사람",
};

/** URL을 API 프록시로 가져와 base64 data URL로 변환 (PDF용, CORS 회피) */
async function urlToDataUrlForPdf(url: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** 캡처 영역 내 img의 src를 data URL로 변환해 html2canvas에서 이미지가 보이도록 함 */
async function resolveImagesToDataUrls(container: HTMLElement): Promise<void> {
  const imgs = container.querySelectorAll<HTMLImageElement>("img");
  await Promise.all(
    Array.from(imgs).map((img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return Promise.resolve();
      if (src.startsWith("blob:")) {
        return fetch(src)
          .then((r) => r.blob())
          .then(
            (blob) =>
              new Promise<string>((resol, rej) => {
                const r = new FileReader();
                r.onload = () => resol(r.result as string);
                r.onerror = () => rej(r.error);
                r.readAsDataURL(blob);
              }),
          )
          .then((dataUrl) => {
            img.src = dataUrl;
            return new Promise<void>((resol) => {
              img.onload = () => resol();
              img.onerror = () => resol();
              if (img.complete) resol();
            });
          })
          .catch(() => {});
      }
      if (src.startsWith("http://") || src.startsWith("https://")) {
        return urlToDataUrlForPdf(src).then((dataUrl) => {
          if (dataUrl) {
            img.src = dataUrl;
            return new Promise<void>((resol) => {
              img.onload = () => resol();
              img.onerror = () => resol();
              if (img.complete) resol();
            });
          }
        });
      }
      return Promise.resolve();
    }),
  );
}

/** "OO 아동", "OO 군" 등에서 호칭 접미사 제거 후 이름만 반환 */
function cleanChildName(fullName: string): string {
  if (!fullName || typeof fullName !== "string") return "아이";
  let s = fullName.trim();
  const suffixes = [" 아동", " 군", " 양"];
  for (const suf of suffixes) {
    if (s.endsWith(suf)) s = s.slice(0, -suf.length).trim();
  }
  return s || "아이";
}

/** 이름을 "OO이의" 형식으로 (받침 있으면 "이의", 없으면 "의") */
function toDisplayNameWithSuffix(fullName: string): string {
  const name = cleanChildName(fullName);
  if (name === "아이") return "아이";
  const givenName = name.length > 1 ? name.slice(1) : name;
  if (!givenName) return "아이";
  const lastChar = givenName[givenName.length - 1];
  const code = lastChar.charCodeAt(0);
  const hasBatchim =
    code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return givenName + (hasBatchim ? "이의" : "의");
}

/** 이름만 "OO이" 형식 (호칭용, 의 없음) */
function toCallName(fullName: string): string {
  const name = cleanChildName(fullName);
  if (name === "아이") return "아이";
  const givenName = name.length > 1 ? name.slice(1) : name;
  if (!givenName) return "아이";
  const lastChar = givenName[givenName.length - 1];
  const code = lastChar.charCodeAt(0);
  const hasBatchim =
    code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return givenName + (hasBatchim ? "이" : "");
}

/** "OO이는" 형식 (주제격 조사) */
function toCallNameWith는(fullName: string): string {
  return toCallName(fullName) + "는";
}

/** 해석 문장 안의 "N세 남아의", "N세 여아의"를 아이 호칭(OO이의)으로 치환 */
function replaceAgeGenderWithCallName(text: string, childName: string): string {
  if (!text || typeof text !== "string") return text;
  const suffix = toDisplayNameWithSuffix(childName);
  return text
    .replace(/\d+세\s*남아의/g, suffix)
    .replace(/\d+세\s*여아의/g, suffix);
}

/** 정규식 특수문자 이스케이프 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 요약문에서 "[풀네임] 아동의 ..." → "[호칭]의 ...", "[풀네임] 아동은" → "[호칭]의 그림에서" 로 치환 (문구 하드코딩 없이 패턴만 사용) */
function replaceFullNameWithCallNameInSummary(
  text: string,
  childName: string,
): string {
  if (!text || typeof text !== "string") return text;
  const full = cleanChildName(childName);
  const suffix = toDisplayNameWithSuffix(childName);
  if (!full || full === "아이") return text;
  const escaped = escapeRegex(full);
  let s = text;
  s = s.replace(new RegExp(escaped + "\\s*아동의\\s*", "g"), suffix + " ");
  s = s.replace(new RegExp(escaped + "\\s*아동은", "g"), suffix + " 그림에서");
  return s;
}

/** 요약 표시용: 풀네임 아동 표현 치환 후 N세 남/여아 치환 */
function replaceSummaryForDisplay(text: string, childName: string): string {
  return replaceAgeGenderWithCallName(
    replaceFullNameWithCallNameInSummary(text, childName),
    childName,
  );
}

/** HTP 해석에 꼭 필요한 핵심 요소만 (나머지 필터링) */
const ESSENTIAL_ELEMENTS: Record<string, Set<string>> = {
  tree: new Set(["나무전체", "수관", "기둥", "가지", "뿌리"]),
  house: new Set(["집전체", "지붕", "집벽", "문", "창문", "굴뚝"]),
  man: new Set([
    "사람전체",
    "머리",
    "얼굴",
    "눈",
    "코",
    "입",
    "상체",
    "팔",
    "다리",
  ]),
  woman: new Set([
    "사람전체",
    "머리",
    "얼굴",
    "눈",
    "코",
    "입",
    "상체",
    "팔",
    "다리",
  ]),
};

/** image_json(RAG 포맷)에서 구성요소 목록 추출 - 핵심 요소만 */
function getComponentElementsFromImageJson(
  imageJson: Record<string, unknown> | undefined,
  objectKey: string,
): { name: string; detected: boolean; note: string }[] {
  if (!imageJson) return [];

  const features = imageJson.features as
    | Record<
        string,
        {
          has?: number;
          ratio?: number;
          center_x?: number;
          center_y?: number;
          confidence?: number;
        }
      >
    | undefined;
  const detectedKr = (imageJson.detected_classes_kr as string[]) || [];
  const summary = (imageJson.summary as string) || "";

  if (features) {
    const essential = ESSENTIAL_ELEMENTS[objectKey];
    const detectedSet = new Set(detectedKr);
    return Object.entries(features)
      .filter(([name]) => !essential || essential.has(name))
      .map(([name, val]) => {
        const has = val?.has === 1;
        const ratio = val?.ratio ?? 0;
        const cx = val?.center_x ?? -1;
        const pos =
          cx >= 0 ? (cx < 0.35 ? "왼쪽" : cx > 0.65 ? "오른쪽" : "가운데") : "";
        const note =
          has && ratio > 0
            ? `면적 약 ${(ratio * 100).toFixed(1)}%${pos ? `, ${pos} 위치` : ""}`
            : has
              ? "감지됨"
              : "미감지";
        return {
          name,
          detected: has || detectedSet.has(name),
          note: note.trim() || (has ? "감지됨" : "미감지"),
        };
      });
  }

  const bbox = (imageJson.annotations as { bbox?: { label: string }[] })?.bbox;
  if (Array.isArray(bbox)) {
    const essential = ESSENTIAL_ELEMENTS[objectKey];
    return bbox
      .map((b) => b?.label)
      .filter((l): l is string => !!l)
      .filter((l, i, arr) => arr.indexOf(l) === i)
      .filter((label) => !essential || essential.has(label))
      .map((label) => ({
        name: label,
        detected: true,
        note: "감지됨",
      }));
  }

  if (summary) {
    return [
      {
        name: OBJECT_LABELS[objectKey] || objectKey,
        detected: true,
        note: summary,
      },
    ];
  }
  return [];
}

const PEER_AVERAGE = 50;

/** API에서 전체_심리_결과가 없을 때: 그림별 해석에서 종합 요약을 만들어 전체 요약이 사라지지 않게 함 */
function buildWholeResultFromInterpretations(
  results: Record<string, any> | null | undefined,
) {
  if (!results || typeof results !== "object") return null;
  const keys: (keyof typeof results)[] = ["tree", "house", "man", "woman"];
  const paragraphs: string[] = [];
  for (const key of keys) {
    const interp = results[key]?.interpretation;
    if (!interp || typeof interp !== "object") continue;
    const v =
      interp["인상적_해석"] ??
      interp["전체_요약"]?.내용 ??
      interp["정서_영역_소견"];
    const text = typeof v === "string" && v.trim() ? v.trim() : null;
    if (text) paragraphs.push(text);
  }
  if (paragraphs.length === 0) return null;
  const oneSummary = paragraphs.join(" ");
  return {
    종합_요약: oneSummary,
    인상적_분석: "",
    구조적_분석_요약: "",
    표상적_분석_종합: "",
  };
}

/** T-Score에 따른 키워드 */
/** T-Score(평균50, 표준편차10) → 백분위(0–100). 정규분포 가정. */
function tScoreToPercentile(t: number): number {
  const z = (t - 50) / 10;
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;
  const tVal = 1 / (1 + p * Math.abs(z));
  const y =
    1 -
    ((((a5 * tVal + a4) * tVal + a3) * tVal + a2) * tVal + a1) *
      tVal *
      Math.exp(-z * z);
  const cdf = z > 0 ? y : 1 - y;
  return Math.round(cdf * 100);
}

function getScoreKeyword(
  score: number,
  type: "에너지" | "위치안정성" | "표현력",
): string {
  if (score < 35) {
    if (type === "에너지") return "다소 위축됨";
    if (type === "위치안정성") return "위치 불안정";
    return "표현이 절제됨";
  }
  if (score > 65) {
    if (type === "에너지") return "에너지 넘침";
    if (type === "위치안정성") return "위치 안정적";
    return "풍부한 표현";
  }
  if (type === "에너지") return "적절한 에너지";
  if (type === "위치안정성") return "적절한 안정성";
  return "적절한 표현력";
}

/** API returns category in English; map to display label */
const RECOMMENDATION_CATEGORY_LABELS: Record<string, string> = {
  emotional_psychological_support: "정서·심리 지원",
  interpersonal_social: "대인관계·사회성",
  parenting_daily_activities: "양육·일상 활동",
  analysis_based: "분석 기반 추천",
};

function getRecommendationCategoryLabel(category: string): string {
  if (!category || typeof category !== "string") return category;
  const key = category.trim().toLowerCase();
  const exact = RECOMMENDATION_CATEGORY_LABELS[category];
  if (exact) return exact;
  const byLower = Object.entries(RECOMMENDATION_CATEGORY_LABELS).find(
    ([k]) => k.toLowerCase() === key,
  );
  if (byLower) return byLower[1];
  return category;
}

function ResultPageContent() {
  const [activeTab, setActiveTab] = useState("basic");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeInterpretTab, setActiveInterpretTab] = useState("tree");
  const [analysisResult, setAnalysisResult] = useState({
    childName: "아이",
    age: "-",
    gender: "" as string,
    drawingType: "집-나무-사람 (HTP)",
    overallScore: 0,
    summary: "해석 요약을 불러오는 중입니다.",
    developmentStage: "분석 완료",
    emotionalState: "분석 완료",
  });
  const [peerComparisonData, setPeerComparisonData] = useState<
    { name: string; child: number; average: number }[]
  >([]);
  const [developmentScores, setDevelopmentScores] = useState<
    { name: string; value: number }[]
  >([]);
  const [psychologyData, setPsychologyData] = useState<
    { name: string; score: number; max: number }[]
  >([]);
  const [activityRecommendations, setActivityRecommendations] = useState<
    {
      id: string;
      title: string;
      category: string;
      category_label?: string;
      summary?: string;
      reason?: string;
      duration_min?: number;
      growth_point?: number;
      implemented?: boolean;
    }[]
  >([]);
  const [apiRecommendations, setApiRecommendations] = useState<
    { category: string; items: string[] }[]
  >([]);
  const [wholeResult, setWholeResult] = useState<{
    종합_요약?: string;
    인상적_분석?: string;
    구조적_분석_요약?: string;
    표상적_분석_종합?: string;
    긍정적인_측면?: string[];
    주의_사항?: string[];
  } | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [boxImages, setBoxImages] = useState<Record<string, string | null>>({});
  const [interpretations, setInterpretations] = useState<Record<string, any>>(
    {},
  );
  const [analysisDurationMs, setAnalysisDurationMs] = useState<number | null>(
    null,
  );
  const [drawingScores, setDrawingScores] = useState<{
    aggregated: {
      에너지_점수: number;
      위치_안정성_점수: number;
      표현력_점수: number;
      종합_평가: string;
    } | null;
    peer_average: number;
    peer_norms?: {
      에너지_또래평균: number;
      위치_X_또래평균: number;
      위치_Y_또래평균: number;
      표현력_또래평균: number;
    };
    /** 기준표에서 조회한 또래 T (에너지/위치/표현력 각 50) */
    peer_tscore_from_csv?: {
      에너지_점수: number;
      위치_안정성_점수: number;
      표현력_점수: number;
    };
    age?: number;
    sex?: string;
  } | null>(null);

  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [isPdfCaptureView, setIsPdfCaptureView] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const autoDownloadTriggeredRef = useRef(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  /** 화면과 동일한 PDF — html2canvas로 결과 영역 캡처 후 jsPDF로 저장 */
  const handleSavePdf = async () => {
    const el = pdfContentRef.current;
    if (!el) return;
    setIsSavingPdf(true);
    let prevTabStyles: {
      el: HTMLElement;
      display: string;
      visibility: string;
      height: string;
    }[] = [];
    let tabsRoot: HTMLElement | null = null;
    let prevPadding: { left: string; right: string } = { left: "", right: "" };
    try {
      setIsPdfCaptureView(true);
      document.body.classList.add("pdf-capture");
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 400));
      const tabContents = el.querySelectorAll<HTMLElement>(
        '[data-slot="tabs-content"]',
      );
      prevTabStyles = [];
      tabContents.forEach((node) => {
        prevTabStyles.push({
          el: node,
          display: node.style.display,
          visibility: node.style.visibility,
          height: node.style.height,
        });
        node.style.setProperty("display", "block", "important");
        node.style.setProperty("visibility", "visible", "important");
        node.style.setProperty("height", "auto", "important");
      });
      tabsRoot = el.querySelector<HTMLElement>('[data-slot="tabs"]');
      if (tabsRoot) {
        tabsRoot.style.setProperty("overflow", "visible", "important");
      }
      await new Promise((r) => setTimeout(r, 200));
      await resolveImagesToDataUrls(el);
      await new Promise((r) => setTimeout(r, 100));

      prevPadding.left = el.style.paddingLeft;
      prevPadding.right = el.style.paddingRight;
      el.style.setProperty("padding-left", "15rem", "important");
      el.style.setProperty("padding-right", "15rem", "important");
      await new Promise((r) => requestAnimationFrame(r));

      const pdfScale = 1.2;
      const canvas = await html2canvas(el, {
        useCORS: true,
        allowTaint: true,
        scale: pdfScale,
        logging: false,
      });

      const containerRect = el.getBoundingClientRect();
      const breakEls = el.querySelectorAll<HTMLElement>('[data-slot="card"]');
      const breakBottoms: number[] = [0];
      breakEls.forEach((card) => {
        const r = card.getBoundingClientRect();
        const bottom = (r.bottom - containerRect.top) * pdfScale;
        breakBottoms.push(bottom);
      });
      const breakPositions = [...new Set(breakBottoms)].sort((a, b) => a - b);

      prevTabStyles.forEach(({ el: node, display, visibility, height }) => {
        node.style.removeProperty("display");
        node.style.removeProperty("visibility");
        node.style.removeProperty("height");
        if (display) node.style.display = display;
        if (visibility) node.style.visibility = visibility;
        if (height) node.style.height = height;
      });
      if (tabsRoot) tabsRoot.style.removeProperty("overflow");
      el.style.removeProperty("padding-left");
      el.style.removeProperty("padding-right");
      if (prevPadding.left) el.style.paddingLeft = prevPadding.left;
      if (prevPadding.right) el.style.paddingRight = prevPadding.right;
      document.body.classList.remove("pdf-capture");
      setIsPdfCaptureView(false);

      const imgW = canvas.width;
      const imgH = canvas.height;
      const contentEndY =
        breakPositions.length > 0
          ? Math.min(imgH, Math.max(...breakPositions) + 1)
          : imgH;
      const pdfW = 210;
      const pdfH = 297;
      const margin = 10;
      const w = pdfW - margin * 2;
      const scale = w / imgW;
      const pageH = (pdfH - margin * 2) / scale;
      const doc = new jsPDF({ unit: "mm", format: "a4" });

      const MIN_SLICE_PX = 40;
      const isTrailingSliceToSkip = (fromY: number) => {
        const remaining = contentEndY - fromY;
        return remaining < MIN_SLICE_PX || remaining < pageH * 0.2;
      };
      let currentY = 0;
      let drawnPageCount = 0;
      while (currentY < contentEndY) {
        const pageEndY = Math.min(currentY + pageH, contentEndY);
        const candidates = breakPositions.filter(
          (b) => b > currentY && b <= pageEndY,
        );
        const endY = candidates.length > 0 ? Math.max(...candidates) : pageEndY;
        const sh = Math.min(endY - currentY, contentEndY - currentY);
        if (sh <= 0) {
          currentY = pageEndY;
          continue;
        }
        if (drawnPageCount > 0 && isTrailingSliceToSkip(currentY)) {
          currentY = contentEndY;
          break;
        }
        if (drawnPageCount > 0) doc.addPage();
        drawnPageCount += 1;
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = imgW;
        sliceCanvas.height = Math.ceil(sh);
        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, imgW, sliceCanvas.height);
          ctx.drawImage(canvas, 0, currentY, imgW, sh, 0, 0, imgW, sh);
        }
        const imgData = sliceCanvas.toDataURL("image/jpeg", 0.92);
        doc.addImage(imgData, "JPEG", margin, margin, w, sh * scale);
        currentY = endY;
      }
      const safeName = (analysisResult.childName || "분석")
        .replace(/\s+/g, "_")
        .slice(0, 20);
      const dateStr = new Date().toISOString().slice(0, 10);
      doc.save(`iSeed_마음리포트_${safeName}_${dateStr}.pdf`);
    } catch (e) {
      console.error("PDF 저장 실패:", e);
      prevTabStyles.forEach(({ el: node, display, visibility, height }) => {
        node.style.removeProperty("display");
        node.style.removeProperty("visibility");
        node.style.removeProperty("height");
        if (display) node.style.display = display;
        if (visibility) node.style.visibility = visibility;
        if (height) node.style.height = height;
      });
      if (tabsRoot) tabsRoot.style.removeProperty("overflow");
      if (el) {
        el.style.removeProperty("padding-left");
        el.style.removeProperty("padding-right");
        if (prevPadding.left) el.style.paddingLeft = prevPadding.left;
        if (prevPadding.right) el.style.paddingRight = prevPadding.right;
      }
      document.body.classList.remove("pdf-capture");
      setIsPdfCaptureView(false);
    } finally {
      setIsSavingPdf(false);
    }
  };

  useEffect(() => {
    if (autoDownloadTriggeredRef.current) return;
    if (searchParams.get("autoDownload") !== "1") return;
    const hasData =
      Object.keys(interpretations).length > 0 ||
      Object.values(boxImages).some(Boolean);
    if (!hasData) return;
    autoDownloadTriggeredRef.current = true;
    handleSavePdf();
    router.replace("/analysis/result");
  }, [searchParams, interpretations, boxImages, router]);

  const formatInterpretationKey = (value: string) => value.replace(/_/g, " ");

  const isLeafInterpretation = (value: any) =>
    value &&
    typeof value === "object" &&
    ("내용" in value || "논문_근거" in value);

  const renderLeafCard = (
    title: string,
    leaf: any,
    childNameForReplace: string,
  ) => {
    const raw =
      typeof leaf?.내용 === "string" && leaf.내용.trim()
        ? leaf.내용
        : "내용이 없습니다.";
    const content = replaceSummaryForDisplay(raw, childNameForReplace);
    return (
      <div key={title} className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[15px] font-semibold text-foreground">
            {formatInterpretationKey(title)}
          </span>
        </div>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {content}
        </p>
        {leaf?.논문_근거 && (
          <div className="mt-3 inline-flex items-center gap-2 text-xs text-primary bg-primary/10 px-3 py-1 rounded-full">
            <FileText className="h-3 w-3" />
            {leaf.논문_근거}
          </div>
        )}
      </div>
    );
  };

  const renderInterpretationSection = (
    section: any,
    childNameForReplace: string,
  ) => {
    if (section == null) {
      return (
        <div className="text-sm text-muted-foreground">내용이 없습니다.</div>
      );
    }
    if (typeof section === "string") {
      const text = replaceSummaryForDisplay(
        section.trim() || "내용이 없습니다.",
        childNameForReplace,
      );
      return (
        <p className="text-[15px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {text}
        </p>
      );
    }
    if (typeof section !== "object") {
      return (
        <div className="text-sm text-muted-foreground">내용이 없습니다.</div>
      );
    }
    if (isLeafInterpretation(section)) {
      return renderLeafCard("내용", section, childNameForReplace);
    }
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(section).map(([subKey, subVal]) => {
          const entry = subVal as any;
          if (isLeafInterpretation(entry)) {
            return renderLeafCard(subKey, entry, childNameForReplace);
          }
          if (typeof entry === "string") {
            return (
              <div
                key={subKey}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <p className="text-[15px] font-semibold text-foreground mb-2">
                  {formatInterpretationKey(subKey)}
                </p>
                <p className="whitespace-pre-wrap text-[15px] text-muted-foreground leading-relaxed">
                  {replaceSummaryForDisplay(entry, childNameForReplace)}
                </p>
              </div>
            );
          }
          return (
            <div
              key={subKey}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >
              <p className="text-[15px] font-semibold text-foreground mb-2">
                {formatInterpretationKey(subKey)}
              </p>
              <pre className="whitespace-pre-wrap text-[13px] text-muted-foreground">
                {JSON.stringify(entry, null, 2)}
              </pre>
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    const globalStore = globalThis as typeof globalThis & {
      __analysisResponse?: any;
      __analysisImages?: string[];
      __analysisBoxImages?: Record<string, string | null>;
    };
    const rawResponse = sessionStorage.getItem("analysisResponse");
    const rawImages = sessionStorage.getItem("analysisImages");
    const memoryResponse = globalStore.__analysisResponse;
    const memoryImages = globalStore.__analysisImages;
    const memoryBoxImages = globalStore.__analysisBoxImages;

    if (memoryResponse || rawResponse) {
      const response = memoryResponse || JSON.parse(rawResponse || "{}");
      const g = globalThis as typeof globalThis & {
        __analysisDurationMs?: number;
      };
      const durationFromMem = g.__analysisDurationMs;
      const durationFromStorage =
        typeof sessionStorage !== "undefined"
          ? sessionStorage.getItem("analysisDurationMs")
          : null;
      const ms =
        durationFromMem ??
        (durationFromStorage ? parseInt(durationFromStorage, 10) : NaN);
      if (Number.isFinite(ms)) {
        setAnalysisDurationMs(ms);
      }
      const child = response?.child || {};
      let results = response?.results || {};
      const comparison = response?.comparison || {};

      // 전체결과 JSON 형식(전체_심리_결과, 그림별_해석) 지원
      const 전체_심리_결과_raw = response?.전체_심리_결과;
      const 그림별_해석 = response?.그림별_해석;
      if (그림별_해석 && typeof 그림별_해석 === "object") {
        const krToKey: Record<string, keyof typeof results> = {
          나무: "tree",
          집: "house",
          남자사람: "man",
          여자사람: "woman",
        };
        results = { ...results };
        for (const [kr, key] of Object.entries(krToKey)) {
          const interp = (그림별_해석 as Record<string, unknown>)[kr];
          if (interp != null) {
            results[key] = { ...(results[key] || {}), interpretation: interp };
          }
        }
      }

      // 전체 심리 결과: API 전체_심리_결과 우선, 없으면 그림별 해석으로 종합 요약 생성 (전체 요약이 사라지지 않도록)
      let whole: typeof wholeResult | null = null;
      if (전체_심리_결과_raw && typeof 전체_심리_결과_raw === "object") {
        const raw = 전체_심리_결과_raw as Record<string, unknown>;
        const strList = (v: unknown): string[] =>
          Array.isArray(v)
            ? v.map((x) => String(x).trim()).filter(Boolean)
            : [];
        whole = {
          종합_요약:
            typeof raw.종합_요약 === "string" ? raw.종합_요약 : undefined,
          인상적_분석:
            typeof raw.인상적_분석 === "string" ? raw.인상적_분석 : undefined,
          구조적_분석_요약:
            typeof raw.구조적_분석_요약 === "string"
              ? raw.구조적_분석_요약
              : undefined,
          표상적_분석_종합:
            typeof raw.표상적_분석_종합 === "string"
              ? raw.표상적_분석_종합
              : undefined,
          긍정적인_측면: strList(raw.긍정적인_측면),
          주의_사항: strList(raw.주의_사항),
        };
      } else {
        const fallback = buildWholeResultFromInterpretations(results);
        if (fallback) whole = fallback;
      }
      setWholeResult(whole);

      // 상단 카드에는 전체 심리 결과 종합 요약만 사용 (나무 등 그림별 요약 사용 안 함)
      const overallSummaryFromResult =
        (typeof whole?.종합_요약 === "string" &&
          whole.종합_요약.trim() &&
          whole.종합_요약) ||
        (typeof whole?.인상적_분석 === "string" &&
          whole.인상적_분석.trim() &&
          whole.인상적_분석) ||
        (typeof whole?.표상적_분석_종합 === "string" &&
          whole.표상적_분석_종합.trim() &&
          whole.표상적_분석_종합);
      const rawSummary = overallSummaryFromResult
        ? overallSummaryFromResult
        : "해석 요약이 없습니다.";
      const summary =
        typeof rawSummary === "string"
          ? rawSummary
          : (rawSummary as any)?.내용 || JSON.stringify(rawSummary, null, 2);

      const developmentStage = comparison?.development?.stage || "분석 완료";
      const overallScore =
        typeof comparison?.overall_score === "number"
          ? comparison.overall_score
          : 0;
      const emotionalState =
        typeof comparison?.emotional_state === "string" &&
        comparison.emotional_state.trim()
          ? comparison.emotional_state.trim()
          : "분석 완료";

      setAnalysisResult({
        childName: cleanChildName(child.name || "아이"),
        age: child.age || "-",
        gender: child.gender || "",
        drawingType: "집-나무-사람 (HTP)",
        overallScore,
        summary,
        developmentStage,
        emotionalState,
      });
      setInterpretations(results);
      // iSeed: 마음활동 추천 (AiModels recommendation_service 후처리 결과)
      const actRec = response?.activity_recommendations?.activities;
      setActivityRecommendations(Array.isArray(actRec) ? actRec : []);
      // iSeed: 첫 분석 완료 시 마음 씨앗 생성 / 재검사 시각 갱신
      try {
        ensureSeed(cleanChildName(child.name || ""));
      } catch {}

      // API 추천 사항: recommendations (Gemini 해석 기반, 논문 3분할 구조)
      const recPayload = response.recommendations;
      if (Array.isArray(recPayload) && recPayload.length > 0) {
        setApiRecommendations(recPayload);
      } else {
        setApiRecommendations([]);
      }
      let storedBoxImages: Record<string, string | null> | null = null;
      try {
        const raw = sessionStorage.getItem("analysisBoxImages");
        if (raw)
          storedBoxImages = JSON.parse(raw) as Record<string, string | null>;
      } catch {}
      setBoxImages({
        tree:
          memoryBoxImages?.tree ??
          results.tree?.box_image_base64 ??
          storedBoxImages?.tree ??
          null,
        house:
          memoryBoxImages?.house ??
          results.house?.box_image_base64 ??
          storedBoxImages?.house ??
          null,
        man:
          memoryBoxImages?.man ??
          results.man?.box_image_base64 ??
          storedBoxImages?.man ??
          null,
        woman:
          memoryBoxImages?.woman ??
          results.woman?.box_image_base64 ??
          storedBoxImages?.woman ??
          null,
      });

      // T-Score 기반 drawing_scores (drawing_norm_dist_stats) 우선 사용
      const ds = comparison?.drawing_scores;
      if (ds?.aggregated) {
        const peerT = ds.peer_tscore_from_csv;
        setDrawingScores({
          aggregated: ds.aggregated,
          peer_average: ds.peer_average ?? PEER_AVERAGE,
          peer_norms: ds.peer_norms,
          peer_tscore_from_csv: peerT ?? undefined,
          age: ds.age,
          sex: ds.sex,
        });
        setPeerComparisonData([
          {
            name: "에너지",
            child: ds.aggregated.에너지_점수,
            average: peerT?.에너지_점수 ?? ds.peer_average ?? PEER_AVERAGE,
          },
          {
            name: "위치 안정성",
            child: ds.aggregated.위치_안정성_점수,
            average: peerT?.위치_안정성_점수 ?? ds.peer_average ?? PEER_AVERAGE,
          },
          {
            name: "표현력",
            child: ds.aggregated.표현력_점수,
            average: peerT?.표현력_점수 ?? ds.peer_average ?? PEER_AVERAGE,
          },
        ]);
        setDevelopmentScores([
          {
            name: "에너지(크기)",
            value: Math.round(ds.aggregated.에너지_점수),
          },
          {
            name: "위치 안정성",
            value: Math.round(ds.aggregated.위치_안정성_점수),
          },
          {
            name: "표현력(섬세함)",
            value: Math.round(ds.aggregated.표현력_점수),
          },
        ]);
        setPsychologyData([
          {
            name: "에너지",
            score: Math.round(ds.aggregated.에너지_점수),
            max: 100,
          },
          {
            name: "안정성",
            score: Math.round(ds.aggregated.위치_안정성_점수),
            max: 100,
          },
          {
            name: "섬세함",
            score: Math.round(ds.aggregated.표현력_점수),
            max: 100,
          },
        ]);
      } else if (comparison?.peer) {
        const peerData = ["세부묘사", "공간활용", "비율표현", "창의성"].map(
          (label) => ({
            name: label,
            child: comparison.peer?.[label] ?? 0,
            average: 50,
          }),
        );
        setPeerComparisonData(peerData);
      }

      if (!ds?.aggregated && comparison?.development?.scores) {
        const devData = [
          "그림 복잡도",
          "세부 표현력",
          "공간 인식",
          "비율 표현",
        ].map((label) => ({
          name: label,
          value: comparison.development?.scores?.[label] ?? 0,
        }));
        setDevelopmentScores(devData);
      }

      if (!ds?.aggregated && comparison?.psychology?.scores) {
        const order = [
          "자아 존중감",
          "정서 안정",
          "사회성",
          "창의성",
          "가족 관계",
        ];
        const psychData = order.map((label) => ({
          name: label,
          score: comparison.psychology?.scores?.[label] ?? 0,
          max: 100,
        }));
        setPsychologyData(psychData);
      }
      // API에 비교/발달/심리 점수 없으면 빈 배열 유지 (하드코딩 숫자 노출 방지)
      if (!ds?.aggregated && !comparison?.peer) setPeerComparisonData([]);
      if (!ds?.aggregated && !comparison?.development?.scores)
        setDevelopmentScores([]);
      if (!ds?.aggregated && !comparison?.psychology?.scores)
        setPsychologyData([]);
    }
    if (memoryImages?.length) {
      setImagePreviews(memoryImages);
    } else if (rawImages) {
      setImagePreviews(JSON.parse(rawImages));
    }
  }, []);

  // drawing_scores가 없고 results가 있으면 /analyze/score 호출
  const aimodelsBaseUrl =
    process.env.NEXT_PUBLIC_AIMODELS_BASE_URL ?? "http://localhost:8080";
  useEffect(() => {
    if (drawingScores) return;
    const raw = sessionStorage.getItem("analysisResponse");
    const mem = (globalThis as any).__analysisResponse;
    const response = mem || (raw ? JSON.parse(raw) : null);
    if (!response?.results) return;
    const child = response?.child || {};
    const age = parseInt(String(child.age || 0), 10);
    const gender = child.gender || "";
    if (!age || age < 7 || age > 13 || !["남", "여"].includes(gender)) return;

    fetch(`${aimodelsBaseUrl}/analyze/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results: response.results, age, gender }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((ds) => {
        if (ds?.aggregated) {
          const peerT = ds.peer_tscore_from_csv;
          setDrawingScores({
            aggregated: ds.aggregated,
            peer_average: ds.peer_average ?? PEER_AVERAGE,
            peer_norms: ds.peer_norms,
            peer_tscore_from_csv: peerT ?? undefined,
            age: ds.age,
            sex: ds.sex,
          });
          setPeerComparisonData([
            {
              name: "에너지",
              child: ds.aggregated.에너지_점수,
              average: peerT?.에너지_점수 ?? ds.peer_average ?? PEER_AVERAGE,
            },
            {
              name: "위치 안정성",
              child: ds.aggregated.위치_안정성_점수,
              average:
                peerT?.위치_안정성_점수 ?? ds.peer_average ?? PEER_AVERAGE,
            },
            {
              name: "표현력",
              child: ds.aggregated.표현력_점수,
              average: peerT?.표현력_점수 ?? ds.peer_average ?? PEER_AVERAGE,
            },
          ]);
          setDevelopmentScores([
            {
              name: "에너지(크기)",
              value: Math.round(ds.aggregated.에너지_점수),
            },
            {
              name: "위치 안정성",
              value: Math.round(ds.aggregated.위치_안정성_점수),
            },
            {
              name: "표현력(섬세함)",
              value: Math.round(ds.aggregated.표현력_점수),
            },
          ]);
          setPsychologyData([
            {
              name: "에너지",
              score: Math.round(ds.aggregated.에너지_점수),
              max: 100,
            },
            {
              name: "안정성",
              score: Math.round(ds.aggregated.위치_안정성_점수),
              max: 100,
            },
            {
              name: "섬세함",
              score: Math.round(ds.aggregated.표현력_점수),
              max: 100,
            },
          ]);
          const avgT =
            (ds.aggregated.에너지_점수 +
              ds.aggregated.위치_안정성_점수 +
              ds.aggregated.표현력_점수) /
            3;
          let stage = "보통 발달";
          if (avgT >= 55) stage = "정상 발달";
          else if (avgT < 35) stage = "지원이 필요한 영역 있음";
          const emotional =
            (ds.aggregated.종합_평가 || "").trim() || "분석 완료";
          setAnalysisResult((prev) => ({
            ...prev,
            overallScore: Math.round(avgT * 10) / 10,
            developmentStage: stage,
            emotionalState: emotional,
          }));
        }
      })
      .catch(() => {});
  }, [drawingScores]);

  const objectKey = OBJECT_KEYS[activeImageIndex] ?? "tree";

  const componentElements = useMemo(() => {
    const raw = interpretations[objectKey]?.image_json;
    // DB/마이페이지에서 오는 래퍼 { image_json, legacy_json }이면 내부 image_json 사용
    const imgData =
      raw &&
      typeof raw === "object" &&
      "image_json" in raw &&
      raw.image_json != null
        ? (raw.image_json as Record<string, unknown>)
        : (raw as Record<string, unknown> | undefined);
    return getComponentElementsFromImageJson(imgData, objectKey);
  }, [interpretations, objectKey]);

  const analysisImages = useMemo(
    () => [
      {
        label: "나무",
        preview: boxImages.tree ?? null,
        badgeClass: "bg-primary/10 text-primary border-primary/20",
      },
      {
        label: "집",
        preview: boxImages.house ?? null,
        badgeClass: "bg-primary/10 text-primary border-primary/20",
      },
      {
        label: "남자사람",
        preview: boxImages.man ?? null,
        badgeClass: "bg-primary/10 text-primary border-primary/20",
      },
      {
        label: "여자사람",
        preview: boxImages.woman ?? null,
        badgeClass: "bg-primary/10 text-primary border-primary/20",
      },
    ],
    [boxImages],
  );

  const allComponentElementsByKey = useMemo(() => {
    const unwrap = (raw: unknown): Record<string, unknown> | undefined => {
      if (raw == null) return undefined;
      if (
        typeof raw === "object" &&
        "image_json" in (raw as object) &&
        (raw as Record<string, unknown>).image_json != null
      )
        return (raw as Record<string, unknown>).image_json as Record<
          string,
          unknown
        >;
      return raw as Record<string, unknown> | undefined;
    };
    return OBJECT_KEYS.map((key) => ({
      key,
      label: OBJECT_LABELS[key] ?? key,
      elements: getComponentElementsFromImageJson(
        unwrap(interpretations[key]?.image_json),
        key,
      ),
    }));
  }, [interpretations]);

  return (
    <div className="flex min-h-screen flex-col">
      {isSavingPdf && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-background opacity-100">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">PDF 생성 중 입니다.</p>
          </div>
        </div>
      )}
      <Header />
      <main className="flex-1 bg-gradient-to-b from-secondary/30 to-background">
        <div ref={pdfContentRef} className="container mx-auto px-4 py-8">
          {/* Result Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary"
                  >
                    분석 완료
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString("ko-KR")}
                  </span>
                  {analysisDurationMs != null && analysisDurationMs >= 0 && (
                    <span className="text-sm text-muted-foreground">
                      · 심리 분석 소요 시간{" "}
                      {analysisDurationMs >= 60000
                        ? `${Math.floor(analysisDurationMs / 60000)}분 ${Math.round((analysisDurationMs % 60000) / 1000)}초`
                        : `${Math.round(analysisDurationMs / 1000)}초`}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {toDisplayNameWithSuffix(analysisResult.childName)} iSeed 마음
                  리포트
                </h1>
                <p className="text-muted-foreground mt-1">
                  {cleanChildName(analysisResult.childName)}
                  {analysisResult.age && analysisResult.age !== "-"
                    ? ` (${analysisResult.age}세${analysisResult.gender === "남" ? " 남아" : analysisResult.gender === "여" ? " 여아" : ""}${analysisResult.drawingType ? " · " + analysisResult.drawingType : ""})`
                    : analysisResult.drawingType
                      ? ` (${analysisResult.drawingType})`
                      : ""}
                </p>
              </div>
              <div className="flex gap-2 pdf-hide-on-capture">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                >
                  <Share2 className="h-4 w-4" />
                  공유
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  onClick={handleSavePdf}
                  disabled={isSavingPdf}
                >
                  <Download className="h-4 w-4" />
                  {isSavingPdf ? "저장 중…" : "PDF 저장"}
                </Button>
              </div>
            </div>

            {/* Summary Card - 전체 심리 결과 종합 요약 */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center">
                      <span className="text-3xl font-bold text-primary-foreground">
                        {analysisResult.overallScore}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          종합 점수
                          {drawingScores?.aggregated ? " (T-Score)" : ""}
                        </p>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              aria-label="도움말"
                            >
                              <HelpCircle className="h-3 w-3" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-4 text-left text-sm" align="start">
                            <p className="font-semibold text-foreground mb-2">종합 점수 (T-Score)</p>
                            <p className="text-muted-foreground mb-2">
                              T-Score는 평균 50, 표준편차 10인 표준 점수입니다. 입력하신 <strong className="text-foreground">나이·성별과 같은 또래</strong> 기준으로 계산됩니다.
                            </p>
                            <p className="font-semibold text-foreground mb-2">상위 %</p>
                            <p className="text-muted-foreground">
                              같은 또래 분포 안에서 상위 몇 %에 해당하는지 나타냅니다. 7~13세, 남/여 각각 다른 기준이 적용됩니다.
                            </p>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <p className="font-semibold text-foreground">
                        {analysisResult.overallScore > 0
                          ? drawingScores?.aggregated
                            ? `대략 상위 ${Math.max(1, 100 - tScoreToPercentile(analysisResult.overallScore))}%`
                            : `상위 ${Math.max(1, Math.round(100 - analysisResult.overallScore))}%`
                          : "분석 중"}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">
                      전체 심리 결과 요약
                    </p>
                    <p className="text-foreground leading-relaxed">
                      {replaceSummaryForDisplay(
                        analysisResult.summary,
                        analysisResult.childName,
                      )}
                    </p>
                  </div>
                  <div className="text-center px-4 py-2 rounded-lg bg-background shrink-0">
                    <p className="text-xs text-muted-foreground">발달 단계</p>
                    <p className="font-semibold text-primary">
                      {analysisResult.developmentStage}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 전체 심리 결과 (전체결과 JSON 있을 때: 인상적·구조적·표상적, 빈 값 미표시) - 상단에 배치 */}
            {wholeResult &&
              (wholeResult.종합_요약?.trim() ||
                wholeResult.인상적_분석?.trim() ||
                wholeResult.구조적_분석_요약?.trim() ||
                wholeResult.표상적_분석_종합?.trim()) && (
                <Card className="border-0 shadow-sm mt-8">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-primary" />
                      전체 심리 결과
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            aria-label="도움말"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4 text-left text-sm" align="start">
                          <p className="font-semibold text-foreground mb-2">HTP 논문 구조</p>
                          <ul className="space-y-2 text-muted-foreground">
                            <li><strong className="text-foreground">인상적</strong>: 그림을 처음 봤을 때의 전반적 인상</li>
                            <li><strong className="text-foreground">구조적</strong>: 크기, 위치, 구도 등 구조적 특징</li>
                            <li><strong className="text-foreground">표상적</strong>: 집·나무·사람이 심리적으로 무엇을 나타내는지</li>
                          </ul>
                          <p className="text-muted-foreground mt-2 text-xs">
                            검사/논문에서 쓰는 용어 기준으로 구분한 종합입니다.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </CardTitle>
                    <CardDescription>
                      논문 구조 기반 인상적·구조적·표상적 종합
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {wholeResult.종합_요약?.trim() && (
                      <div className="rounded-xl border bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 p-4">
                        <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-300 mb-2">
                          종합 요약
                        </h4>
                        <p className="text-[15px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                          {replaceSummaryForDisplay(
                            wholeResult.종합_요약,
                            analysisResult.childName,
                          )}
                        </p>
                      </div>
                    )}
                    {wholeResult.인상적_분석?.trim() && (
                      <div className="rounded-xl border bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 p-4">
                        <h4 className="font-semibold text-sm text-blue-800 dark:text-blue-300 mb-2">
                          인상적 분석
                        </h4>
                        <p className="text-[15px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                          {replaceSummaryForDisplay(
                            wholeResult.인상적_분석,
                            analysisResult.childName,
                          )}
                        </p>
                      </div>
                    )}
                    {wholeResult.구조적_분석_요약?.trim() && (
                      <div className="rounded-xl border bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 p-4">
                        <h4 className="font-semibold text-sm text-indigo-800 dark:text-indigo-300 mb-2">
                          구조적 분석 요약
                        </h4>
                        <p className="text-[15px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                          {replaceSummaryForDisplay(
                            wholeResult.구조적_분석_요약,
                            analysisResult.childName,
                          )}
                        </p>
                      </div>
                    )}
                    {wholeResult.표상적_분석_종합?.trim() && (
                      <div className="rounded-xl border bg-purple-50/50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 p-4">
                        <h4 className="font-semibold text-sm text-purple-800 dark:text-purple-300 mb-2">
                          표상적 분석 종합
                        </h4>
                        <p className="text-[15px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                          {replaceSummaryForDisplay(
                            wholeResult.표상적_분석_종합,
                            analysisResult.childName,
                          )}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
          </div>

          {/* iSeed: 나의 마음 씨앗 (PDF 캡처 시 숨김) */}
          {FEATURES.seedGrowth && (
            <div className="mb-6 pdf-hide-on-capture">
              <SeedCard />
            </div>
          )}

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="basic" className="gap-2">
                <Eye className="h-4 w-4 hidden sm:block" />
                기본 분석
              </TabsTrigger>
              <TabsTrigger value="development" className="gap-2">
                <TrendingUp className="h-4 w-4 hidden sm:block" />
                발달 비교
              </TabsTrigger>
              <TabsTrigger value="psychology" className="gap-2">
                <Brain className="h-4 w-4 hidden sm:block" />
                심리 해석
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="gap-2">
                <Lightbulb className="h-4 w-4 hidden sm:block" />
                추천 사항
              </TabsTrigger>
            </TabsList>

            {/* Basic Analysis Tab - PDF 캡처 시: 시각적+구성요소 4쌍, 일반 시: 기존 2카드 */}
            <TabsContent
              value="basic"
              forceMount
              className="space-y-6 data-[state=inactive]:hidden data-[state=inactive]:absolute data-[state=inactive]:pointer-events-none"
            >
              {isPdfCaptureView && (
                <div className="pb-3 mb-4 border-b border-border">
                  <h2 className="text-xl font-semibold text-foreground">
                    기본 분석
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    시각적 분석 · 구성요소 분석
                  </p>
                </div>
              )}
              <div className="grid gap-6 lg:grid-cols-2">
                {isPdfCaptureView ? (
                  <div className="lg:col-span-2 space-y-8">
                    {analysisImages.map((item, idx) => {
                      const { elements } = allComponentElementsByKey[idx];
                      return (
                        <div
                          key={item.label}
                          className="grid gap-6 lg:grid-cols-2"
                        >
                          <Card className="overflow-hidden">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5 text-primary" />
                                시각적 분석 · {item.label}
                              </CardTitle>
                              <CardDescription>
                                AI가 감지한 요소들이 하이라이트 되어 있습니다
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="relative aspect-square bg-muted rounded-xl overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center p-4">
                                  {item.preview ? (
                                    <img
                                      src={item.preview}
                                      alt={`${item.label} 분석 결과`}
                                      className="h-full w-full rounded-lg border object-cover"
                                      crossOrigin="anonymous"
                                    />
                                  ) : (
                                    <div className="text-sm text-muted-foreground">
                                      이미지가 없습니다.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader>
                              <CardTitle>
                                구성요소 분석 · {item.label}
                              </CardTitle>
                              <CardDescription>
                                {item.label}에서 감지된 요소들과 특징입니다
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {elements.length > 0 ? (
                                  elements.map((element) => (
                                    <div
                                      key={element.name}
                                      className={`flex items-center gap-3 p-3 rounded-lg ${
                                        element.detected
                                          ? "bg-primary/5"
                                          : "bg-muted/50"
                                      }`}
                                    >
                                      <div
                                        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                                          element.detected
                                            ? "bg-primary/10 text-primary"
                                            : "bg-muted text-muted-foreground"
                                        }`}
                                      >
                                        {element.name.includes("집") && (
                                          <Home className="h-4 w-4" />
                                        )}
                                        {element.name.includes("나무") && (
                                          <TreeDeciduous className="h-4 w-4" />
                                        )}
                                        {element.name.includes("사람") && (
                                          <User className="h-4 w-4" />
                                        )}
                                        {element.name.includes("태양") && (
                                          <span className="text-sm">☀</span>
                                        )}
                                        {element.name.includes("구름") && (
                                          <span className="text-sm">☁</span>
                                        )}
                                        {element.name.includes("꽃") && (
                                          <span className="text-sm">🌱</span>
                                        )}
                                        {element.name.includes("머리") ||
                                        element.name.includes("얼굴") ? (
                                          <User className="h-4 w-4" />
                                        ) : (
                                          <Layers className="h-4 w-4" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-foreground">
                                            {element.name}
                                          </span>
                                          <Badge
                                            variant={
                                              element.detected
                                                ? "default"
                                                : "secondary"
                                            }
                                            className={
                                              element.detected
                                                ? "bg-primary"
                                                : ""
                                            }
                                          >
                                            {element.detected
                                              ? "감지됨"
                                              : "미감지"}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          {element.note}
                                        </p>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-muted-foreground py-2">
                                    감지된 구성요소 없음
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <Card>
                      <CardHeader className="space-y-3">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5 text-primary" />
                            시각적 분석
                          </CardTitle>
                          <CardDescription>
                            AI가 감지한 요소들이 하이라이트 되어 있습니다
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {analysisImages.map((item, index) => (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => setActiveImageIndex(index)}
                              className="focus-visible:outline-none"
                            >
                              <Badge
                                variant="secondary"
                                className={`${item.badgeClass} ${activeImageIndex === index ? "ring-2 ring-primary/60" : ""}`}
                              >
                                {item.label}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="relative aspect-square bg-muted rounded-xl overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center p-4">
                            {analysisImages[activeImageIndex]?.preview ? (
                              <img
                                src={
                                  analysisImages[activeImageIndex].preview ||
                                  "/placeholder.svg"
                                }
                                alt={`${analysisImages[activeImageIndex].label} 분석 결과`}
                                className="h-full w-full rounded-lg border object-cover"
                              />
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                이미지가 없습니다.
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>구성요소 분석</CardTitle>
                        <CardDescription>
                          {analysisImages[activeImageIndex]?.label || "그림"}
                          에서 감지된 요소들과 특징입니다
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {componentElements.length > 0 ? (
                            componentElements.map((element) => (
                              <div
                                key={element.name}
                                className={`flex items-center gap-3 p-3 rounded-lg ${
                                  element.detected
                                    ? "bg-primary/5"
                                    : "bg-muted/50"
                                }`}
                              >
                                <div
                                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                    element.detected
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {element.name.includes("집") && (
                                    <Home className="h-4 w-4" />
                                  )}
                                  {element.name.includes("나무") && (
                                    <TreeDeciduous className="h-4 w-4" />
                                  )}
                                  {element.name.includes("사람") && (
                                    <User className="h-4 w-4" />
                                  )}
                                  {element.name.includes("태양") && (
                                    <span className="text-sm">☀</span>
                                  )}
                                  {element.name.includes("구름") && (
                                    <span className="text-sm">☁</span>
                                  )}
                                  {element.name.includes("꽃") && (
                                    <span className="text-sm">🌱</span>
                                  )}
                                  {element.name.includes("머리") ||
                                  element.name.includes("얼굴") ? (
                                    <User className="h-4 w-4" />
                                  ) : (
                                    <Layers className="h-4 w-4" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">
                                      {element.name}
                                    </span>
                                    <Badge
                                      variant={
                                        element.detected
                                          ? "default"
                                          : "secondary"
                                      }
                                      className={
                                        element.detected ? "bg-primary" : ""
                                      }
                                    >
                                      {element.detected ? "감지됨" : "미감지"}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {element.note}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                              시각적 분석에서 나무·집·남자·여자 중 하나를
                              선택하면 해당 그림의 구성요소가 표시됩니다.
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Development Comparison Tab */}
            <TabsContent
              value="development"
              forceMount
              className="space-y-6 data-[state=inactive]:hidden data-[state=inactive]:absolute data-[state=inactive]:pointer-events-none"
            >
              {isPdfCaptureView && (
                <div className="pb-3 mb-4 border-b border-border">
                  <h2 className="text-xl font-semibold text-foreground">
                    발달 비교
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    또래 비교 · 발달 단계 및 T-Score 해석
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Peer Comparison Bar Chart */}
                <Card className="min-w-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      또래 비교
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            aria-label="도움말"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4 text-left text-sm" align="start">
                          <p className="font-semibold text-foreground mb-2">또래 비교</p>
                          <p className="text-muted-foreground mb-2">
                            파란 막대는 우리 아이의 T-Score(에너지·위치 안정성·표현력)입니다. 입력하신 <strong className="text-foreground">나이·성별</strong>과 같은 또래 기준으로 비교합니다.
                          </p>
                          <p className="text-muted-foreground">
                            예: 8세 남아로 입력하면 8세 남아 또래 평균과 비교한 결과가 나옵니다.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </CardTitle>
                    <CardDescription>
                      {drawingScores?.age && drawingScores?.sex
                        ? `${drawingScores.age}세 ${drawingScores.sex === "남" ? "남아" : "여아"} 또래 기준으로 비교한 결과입니다`
                        : "또래와 비교한 결과입니다"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {peerComparisonData.length > 0 ? (
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={peerComparisonData} layout="vertical">
                            <CartesianGrid
                              strokeDasharray="3 3"
                              horizontal={true}
                              vertical={false}
                            />
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis dataKey="name" type="category" width={100} />
                            <Tooltip />
                            <Legend />
                            <Bar
                              dataKey="child"
                              name={toCallName(analysisResult.childName)}
                              fill="#22c55e"
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-8 text-center">
                        이번 분석에 대한 또래 비교 데이터가 없습니다.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* 발달 단계 및 T-Score 해석 (통합 카드) */}
                {drawingScores?.aggregated && (
                  <Card className="min-w-0">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        발달 단계 및 T-Score 해석
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              aria-label="도움말"
                            >
                              <HelpCircle className="h-3.5 w-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-4 text-left text-sm" align="start">
                            <p className="font-semibold text-foreground mb-2">T-Score 지표 설명</p>
                            <ul className="space-y-2 text-muted-foreground mb-3">
                              <li><strong className="text-foreground">에너지</strong>: 그림 크기 비율 기반 (클수록 에너지 높음)</li>
                              <li><strong className="text-foreground">안정성</strong>: 위치(X·Y) 기반 (안정적일수록 높음)</li>
                              <li><strong className="text-foreground">섬세함</strong>: 표현 요소 개수 기반 (많을수록 풍부)</li>
                            </ul>
                            <p className="font-semibold text-foreground mb-2">점수 구간과 색상</p>
                            <ul className="space-y-1 text-muted-foreground">
                              <li>· T &lt; 35 (낮음): 빨강 — 부족</li>
                              <li>· 35 ~ 65 (적정): 노랑 — 보통</li>
                              <li>· T &gt; 65 (높음): 초록 — 만족</li>
                            </ul>
                            <p className="font-semibold text-foreground mb-2 mt-3">발달 단계</p>
                            <p className="text-muted-foreground text-xs">
                              에너지·안정성·섬세함 3가지 T-Score 평균으로 구간을 정합니다. 평균 T ≥ 55면 정상 발달, 35~55면 보통 발달, 35 미만이면 지원이 필요한 영역이 있을 수 있습니다.
                            </p>
                          </PopoverContent>
                        </Popover>
                      </CardTitle>
                      <CardDescription>
                        {drawingScores?.age && drawingScores?.sex
                          ? `${drawingScores.age}세 ${drawingScores.sex === "남" ? "남아" : "여아"} 또래 기준`
                          : "그림 크기·위치·객체 개수 기반 또래 대비 점수"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center p-4 bg-primary/5 rounded-xl">
                        <p className="text-sm text-muted-foreground mb-1">
                          현재 발달 단계
                        </p>
                        <p className="text-xl font-bold text-primary">
                          {analysisResult.developmentStage}
                        </p>
                      </div>
                      <div className="space-y-4">
                        {developmentScores.map((item) => (
                          <div key={item.name}>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-muted-foreground">
                                {item.name}
                              </span>
                              <span className="font-medium">
                                {item.value}점 (T-Score)
                              </span>
                            </div>
                            <Progress value={item.value} className="h-2 [&_[data-slot=progress-indicator]]:!bg-green-500" />
                          </div>
                        ))}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {psychologyData.map((item) => {
                          const keyword =
                            item.name === "에너지"
                              ? getScoreKeyword(item.score, "에너지")
                              : item.name === "안정성"
                                ? getScoreKeyword(item.score, "위치안정성")
                                : getScoreKeyword(item.score, "표현력");
                          const status =
                            item.score < 35
                              ? "text-red-600 bg-red-50 border-red-200"
                              : item.score > 65
                                ? "text-green-600 bg-green-50 border-green-200"
                                : "text-amber-600 bg-amber-50 border-amber-200";
                          return (
                            <div
                              key={item.name}
                              className={`rounded-lg border p-3 text-center ${status}`}
                            >
                              <p className="text-base font-semibold text-foreground/90">
                                {item.name}
                              </p>
                              <p className="text-sm font-medium mt-1.5 opacity-90">
                                {keyword}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      {drawingScores.peer_norms && (
                        <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                          <p className="font-medium">
                            또래 평균 ({drawingScores.age}세{" "}
                            {drawingScores.sex === "남" ? "남아" : "여아"} 기준)
                          </p>
                          <p>
                            에너지(그림 크기):{" "}
                            {drawingScores.peer_norms.에너지_또래평균}% ·
                            표현력(객체 수):{" "}
                            {drawingScores.peer_norms.표현력_또래평균}개
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Psychology Interpretation Tab */}
            <TabsContent
              value="psychology"
              forceMount
              className={`data-[state=inactive]:hidden data-[state=inactive]:absolute data-[state=inactive]:pointer-events-none ${isPdfCaptureView ? "space-y-3" : "space-y-4"}`}
            >
              {isPdfCaptureView && (
                <div className="pb-3 mb-4 border-b border-border">
                  <h2 className="text-xl font-semibold text-foreground">
                    심리 해석
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    그림별 심리 해석 및 해석 요약
                  </p>
                </div>
              )}

              {/* PDF 캡처 시: 나무·집·남자·여자 4개 블록 모두 표시 */}
              {isPdfCaptureView ? (
                <div className="space-y-6">
                  {OBJECT_KEYS.map((key) => {
                    const value = interpretations[key];
                    const interpretation = value?.interpretation || {};
                    const summary = interpretation["전체_요약"];
                    const perDrawingSummary =
                      (typeof summary?.내용 === "string" && summary.내용.trim()
                        ? summary.내용
                        : typeof summary === "string" && summary.trim()
                          ? summary
                          : null) ??
                      (typeof interpretation.인상적_해석 === "string" &&
                      interpretation.인상적_해석.trim()
                        ? interpretation.인상적_해석
                        : null);
                    const summaryContent = replaceSummaryForDisplay(
                      perDrawingSummary ??
                        "해석 요약이 아직 준비되지 않았습니다.",
                      analysisResult.childName,
                    );
                    const paperSectionOrder = [
                      "인상적_해석",
                      "구조적_해석",
                      "표상적_해석",
                      "정서_영역_소견",
                    ];
                    const sectionOrder = [
                      "전체_요약",
                      ...paperSectionOrder,
                      "구성_분석",
                      "구성요소_분석",
                      "집_구성요소_분석",
                      "부가요소_분석",
                      "주변요소_분석",
                      "자연요소_분석",
                      "하늘_요소_분석",
                      "얼굴_분석",
                      "신체_분석",
                      "의류_분석",
                      "발달_평가",
                      "종합_해석",
                    ];
                    const orderedEntries = [
                      ...sectionOrder
                        .filter((sectionKey) => sectionKey in interpretation)
                        .map(
                          (sectionKey) =>
                            [
                              sectionKey,
                              interpretation[sectionKey],
                            ] as const,
                        ),
                      ...Object.entries(interpretation).filter(
                        ([sectionKey]) =>
                          !sectionOrder.includes(sectionKey) &&
                          sectionKey !== "추천_사항",
                      ),
                    ].filter(([sectionKey]) => sectionKey !== "전체_요약");

                    const sectionIcons: Record<string, React.ReactNode> = {
                      전체_요약: <FileText className="h-4 w-4" />,
                      인상적_해석: <Eye className="h-4 w-4" />,
                      구조적_해석: <LayoutGrid className="h-4 w-4" />,
                      표상적_해석: <Layers className="h-4 w-4" />,
                      정서_영역_소견: <Heart className="h-4 w-4" />,
                      구성_분석: <LayoutGrid className="h-4 w-4" />,
                      구성요소_분석: <Layers className="h-4 w-4" />,
                      부가요소_분석: <Sparkles className="h-4 w-4" />,
                      하늘요소_분석: <Cloud className="h-4 w-4" />,
                      하늘_요소_분석: <Cloud className="h-4 w-4" />,
                      얼굴_분석: <User className="h-4 w-4" />,
                      신체_분석: <Layers className="h-4 w-4" />,
                      의류_분석: <LayoutGrid className="h-4 w-4" />,
                      집_구성요소_분석: <Home className="h-4 w-4" />,
                      주변요소_분석: <Cloud className="h-4 w-4" />,
                      자연요소_분석: (
                        <TreeDeciduous className="h-4 w-4" />
                      ),
                      발달_평가: <TrendingUp className="h-4 w-4" />,
                      종합_해석: <FileText className="h-4 w-4" />,
                    };
                    const sectionLabels: Record<string, string> = {
                      인상적_해석: "인상적 해석",
                      구조적_해석: "구조적 해석",
                      표상적_해석: "표상적 해석",
                      정서_영역_소견: "정서 영역 소견",
                    };
                    const sectionColors: Record<string, string> = {
                      전체_요약: "bg-slate-50 border-slate-200 text-slate-700",
                      인상적_해석:
                        "bg-blue-50 border-blue-200 text-blue-700",
                      구조적_해석:
                        "bg-indigo-50 border-indigo-200 text-indigo-700",
                      표상적_해석:
                        "bg-purple-50 border-purple-200 text-purple-700",
                      정서_영역_소견:
                        "bg-rose-50 border-rose-200 text-rose-700",
                      구성_분석: "bg-blue-50 border-blue-200 text-blue-700",
                      구성요소_분석:
                        "bg-purple-50 border-purple-200 text-purple-700",
                      집_구성요소_분석:
                        "bg-purple-50 border-purple-200 text-purple-700",
                      부가요소_분석:
                        "bg-amber-50 border-amber-200 text-amber-700",
                      하늘요소_분석: "bg-sky-50 border-sky-200 text-sky-700",
                      하늘_요소_분석: "bg-sky-50 border-sky-200 text-sky-700",
                      주변요소_분석:
                        "bg-emerald-50 border-emerald-200 text-emerald-700",
                      자연요소_분석:
                        "bg-lime-50 border-lime-200 text-lime-700",
                      얼굴_분석:
                        "bg-indigo-50 border-indigo-200 text-indigo-700",
                      신체_분석: "bg-teal-50 border-teal-200 text-teal-700",
                      의류_분석: "bg-rose-50 border-rose-200 text-rose-700",
                      발달_평가:
                        "bg-green-50 border-green-200 text-green-700",
                      종합_해석: "bg-teal-50 border-teal-200 text-teal-700",
                    };

                    return (
                      <div
                        key={key}
                        data-slot="card"
                        className="space-y-3 break-inside-avoid"
                      >
                        {/* 전체 요약 - 인상적 해석 바로 위에 붙이기 */}
                        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 border border-primary/20">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                              <Brain className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-foreground mb-2">
                                전체 요약 ({OBJECT_LABELS[key] || key})
                              </h3>
                              <p className="text-[15px] text-muted-foreground leading-relaxed">
                                {summaryContent}
                              </p>
                              {summary?.논문_근거 && (
                                <div className="mt-3 inline-flex items-center gap-2 text-xs text-primary bg-primary/10 px-3 py-1 rounded-full">
                                  <FileText className="h-3 w-3" />
                                  {summary.논문_근거}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* 해석 섹션들 - 전체 요약과 간격 축소 */}
                        <div className="space-y-3">
                          {value?.interpretation ? (
                            orderedEntries.map(([sectionKey, sectionValue]) => (
                              <div
                                key={sectionKey}
                                className="rounded-xl border bg-white overflow-hidden break-inside-avoid"
                              >
                                <div
                                  className={`px-4 py-3 border-b flex items-center gap-2 ${sectionColors[sectionKey] || "bg-slate-50"}`}
                                >
                                  {sectionIcons[sectionKey] || (
                                    <FileText className="h-4 w-4" />
                                  )}
                                  <span className="font-semibold text-sm">
                                    {sectionLabels[sectionKey] ??
                                      formatInterpretationKey(sectionKey)}
                                  </span>
                                </div>
                                <div className="p-4">
                                  {renderInterpretationSection(
                                    sectionValue,
                                    analysisResult.childName,
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-12 text-muted-foreground">
                              <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                              <p>해석 결과가 없습니다.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  {(() => {
                    const activeInterpretation =
                      interpretations[activeInterpretTab]?.interpretation ||
                      null;
                    const summary =
                      activeInterpretation?.["전체_요약"];
                    const perDrawingSummary =
                      (typeof summary?.내용 === "string" &&
                        summary.내용.trim()
                        ? summary.내용
                        : typeof summary === "string" && summary.trim()
                          ? summary
                          : null) ??
                      (typeof activeInterpretation?.인상적_해석 ===
                        "string" &&
                        activeInterpretation.인상적_해석.trim()
                        ? activeInterpretation.인상적_해석
                        : null);
                    const summaryContent = replaceSummaryForDisplay(
                      perDrawingSummary ??
                        "해석 요약이 아직 준비되지 않았습니다.",
                      analysisResult.childName,
                    );
                    return (
                      <>
                        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 border border-primary/20">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                              <Brain className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-foreground mb-2">
                                전체 요약{" "}
                                {activeInterpretTab === "tree"
                                  ? "(나무)"
                                  : activeInterpretTab === "house"
                                    ? "(집)"
                                    : activeInterpretTab === "man"
                                      ? "(남자사람)"
                                      : "(여자사람)"}
                              </h3>
                              <p className="text-[15px] text-muted-foreground leading-relaxed">
                                {summaryContent}
                              </p>
                              {summary?.논문_근거 && (
                                <div className="mt-3 inline-flex items-center gap-2 text-xs text-primary bg-primary/10 px-3 py-1 rounded-full">
                                  <FileText className="h-3 w-3" />
                                  {summary.논문_근거}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <Card className="border-0 shadow-sm">
                          <CardContent className="p-6">
                            <Tabs
                              value={activeInterpretTab}
                              onValueChange={setActiveInterpretTab}
                            >
                              <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-xl">
                                <TabsTrigger
                                  value="tree"
                                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                >
                                  나무
                                </TabsTrigger>
                                <TabsTrigger
                                  value="house"
                                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                >
                                  집
                                </TabsTrigger>
                                <TabsTrigger
                                  value="man"
                                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                >
                                  남자아이
                                </TabsTrigger>
                                <TabsTrigger
                                  value="woman"
                                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                >
                                  여자아이
                                </TabsTrigger>
                              </TabsList>
                              {["tree", "house", "man", "woman"].map((key) => {
                      const value = interpretations[key];
                      const interpretation = value?.interpretation || {};
                      const paperSectionOrder = [
                        "인상적_해석",
                        "구조적_해석",
                        "표상적_해석",
                        "정서_영역_소견",
                      ];
                      const sectionOrder = [
                        "전체_요약",
                        ...paperSectionOrder,
                        "구성_분석",
                        "구성요소_분석",
                        "집_구성요소_분석",
                        "부가요소_분석",
                        "주변요소_분석",
                        "자연요소_분석",
                        "하늘_요소_분석",
                        "얼굴_분석",
                        "신체_분석",
                        "의류_분석",
                        "발달_평가",
                        "종합_해석",
                      ];
                      const orderedEntries = [
                        ...sectionOrder
                          .filter((sectionKey) => sectionKey in interpretation)
                          .map(
                            (sectionKey) =>
                              [sectionKey, interpretation[sectionKey]] as const,
                          ),
                        ...Object.entries(interpretation).filter(
                          ([sectionKey]) =>
                            !sectionOrder.includes(sectionKey) &&
                            sectionKey !== "추천_사항",
                        ),
                      ].filter(([sectionKey]) => sectionKey !== "전체_요약");
                      return (
                        <TabsContent
                          key={key}
                          value={key}
                          className="mt-4 space-y-4"
                        >
                          {value?.interpretation ? (
                            orderedEntries.map(([sectionKey, sectionValue]) => {
                              const sectionIcons: Record<
                                string,
                                React.ReactNode
                              > = {
                                전체_요약: <FileText className="h-4 w-4" />,
                                인상적_해석: <Eye className="h-4 w-4" />,
                                구조적_해석: <LayoutGrid className="h-4 w-4" />,
                                표상적_해석: <Layers className="h-4 w-4" />,
                                정서_영역_소견: <Heart className="h-4 w-4" />,
                                구성_분석: <LayoutGrid className="h-4 w-4" />,
                                구성요소_분석: <Layers className="h-4 w-4" />,
                                부가요소_분석: <Sparkles className="h-4 w-4" />,
                                하늘요소_분석: <Cloud className="h-4 w-4" />,
                                하늘_요소_분석: <Cloud className="h-4 w-4" />,
                                얼굴_분석: <User className="h-4 w-4" />,
                                신체_분석: <Layers className="h-4 w-4" />,
                                의류_분석: <LayoutGrid className="h-4 w-4" />,
                                집_구성요소_분석: <Home className="h-4 w-4" />,
                                주변요소_분석: <Cloud className="h-4 w-4" />,
                                자연요소_분석: (
                                  <TreeDeciduous className="h-4 w-4" />
                                ),
                                발달_평가: <TrendingUp className="h-4 w-4" />,
                                종합_해석: <FileText className="h-4 w-4" />,
                              };
                              const sectionLabels: Record<string, string> = {
                                인상적_해석: "인상적 해석",
                                구조적_해석: "구조적 해석",
                                표상적_해석: "표상적 해석",
                                정서_영역_소견: "정서 영역 소견",
                              };
                              const sectionColors: Record<string, string> = {
                                전체_요약:
                                  "bg-slate-50 border-slate-200 text-slate-700",
                                인상적_해석:
                                  "bg-blue-50 border-blue-200 text-blue-700",
                                구조적_해석:
                                  "bg-indigo-50 border-indigo-200 text-indigo-700",
                                표상적_해석:
                                  "bg-purple-50 border-purple-200 text-purple-700",
                                정서_영역_소견:
                                  "bg-rose-50 border-rose-200 text-rose-700",
                                구성_분석:
                                  "bg-blue-50 border-blue-200 text-blue-700",
                                구성요소_분석:
                                  "bg-purple-50 border-purple-200 text-purple-700",
                                집_구성요소_분석:
                                  "bg-purple-50 border-purple-200 text-purple-700",
                                부가요소_분석:
                                  "bg-amber-50 border-amber-200 text-amber-700",
                                하늘요소_분석:
                                  "bg-sky-50 border-sky-200 text-sky-700",
                                하늘_요소_분석:
                                  "bg-sky-50 border-sky-200 text-sky-700",
                                주변요소_분석:
                                  "bg-emerald-50 border-emerald-200 text-emerald-700",
                                자연요소_분석:
                                  "bg-lime-50 border-lime-200 text-lime-700",
                                얼굴_분석:
                                  "bg-indigo-50 border-indigo-200 text-indigo-700",
                                신체_분석:
                                  "bg-teal-50 border-teal-200 text-teal-700",
                                의류_분석:
                                  "bg-rose-50 border-rose-200 text-rose-700",
                                발달_평가:
                                  "bg-green-50 border-green-200 text-green-700",
                                종합_해석:
                                  "bg-teal-50 border-teal-200 text-teal-700",
                              };
                              return (
                                <div
                                  key={sectionKey}
                                  className="rounded-xl border bg-white overflow-hidden"
                                >
                                  <div
                                    className={`px-4 py-3 border-b flex items-center gap-2 ${sectionColors[sectionKey] || "bg-slate-50"}`}
                                  >
                                    {sectionIcons[sectionKey] || (
                                      <FileText className="h-4 w-4" />
                                    )}
                                    <span className="font-semibold text-sm">
                                      {sectionLabels[sectionKey] ??
                                        formatInterpretationKey(sectionKey)}
                                    </span>
                                  </div>
                                  <div className="p-4">
                                    {renderInterpretationSection(
                                      sectionValue,
                                      analysisResult.childName,
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-12 text-muted-foreground">
                              <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                              <p>해석 결과가 없습니다.</p>
                            </div>
                          )}
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </CardContent>
              </Card>
                      </>
                    );
                  })()}
                </>
              )}

              {/* Emotional State Grid */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Heart className="h-4 w-4 text-primary" />
                    </div>
                    종합 심리 상태
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {psychologyData.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {psychologyData.map((item) => {
                      const getStatusColor = (score: number) => {
                        if (score >= 80)
                          return {
                            bg: "bg-green-50",
                            border: "border-green-200",
                            text: "text-green-700",
                            badge: "bg-green-100 text-green-700",
                          };
                        if (score >= 60)
                          return {
                            bg: "bg-amber-50",
                            border: "border-amber-200",
                            text: "text-amber-700",
                            badge: "bg-amber-100 text-amber-700",
                          };
                        return {
                          bg: "bg-red-50",
                          border: "border-red-200",
                          text: "text-red-700",
                          badge: "bg-red-100 text-red-700",
                        };
                      };
                      const status = getStatusColor(item.score);
                      return (
                        <div
                          key={item.name}
                          className={`p-4 rounded-xl border ${status.bg} ${status.border}`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className="font-semibold text-sm text-foreground">
                              {item.name}
                            </span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${status.badge}`}
                            >
                              {item.score}점
                            </span>
                          </div>
                          <div className="h-2 bg-white/80 rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all duration-500"
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                          <p className={`text-xs font-medium ${status.text}`}>
                            {item.score >= 80
                              ? "양호한 수준"
                              : item.score >= 60
                                ? "보통 수준"
                                : "관심 필요"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      이번 분석에 대한 심리 점수 데이터가 없습니다.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Positive & Attention Points */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-0 shadow-sm border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-green-700">
                      <ThumbsUp className="h-4 w-4" />
                      긍정적인 측면
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {(wholeResult?.긍정적인_측면?.length
                        ? wholeResult.긍정적인_측면
                        : [
                            "풍부한 상상력과 창의성, 다양한 환경 요소에 대한 관심",
                            "감성적인 영역의 발달",
                            "놀이와 즐거움에 대한 욕구 (그네 표현)",
                          ]
                      ).map((text, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-green-600" />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-amber-700">
                      <AlertCircle className="h-4 w-4" />
                      주의 사항
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {(wholeResult?.주의_사항?.length
                        ? wholeResult.주의_사항
                        : [
                            "부정적 평가에 대한 두려움으로 인해 자신감 부족이나 위축된 모습을 보일 수 있습니다",
                            "내면의 안정감이나 자기 수용에 대한 노력이 필요합니다",
                          ]
                      ).map((text, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Recommendations Tab - API recommendations 우선, 없으면 기본 추천 */}
            <TabsContent
              value="recommendations"
              forceMount
              className="space-y-6 data-[state=inactive]:hidden data-[state=inactive]:absolute data-[state=inactive]:pointer-events-none"
            >
              {isPdfCaptureView ? (
                <div className="pb-3 mb-4 border-b border-border">
                  <h2 className="text-xl font-semibold text-foreground">
                    추천 사항
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    카테고리별 맞춤 추천
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 pb-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    카테고리별 맞춤 추천
                  </h2>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        aria-label="도움말"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4 text-left text-sm" align="start">
                      <p className="font-semibold text-foreground mb-2">맞춤 추천</p>
                      <p className="text-muted-foreground mb-2">
                        이 아이의 <strong className="text-foreground">그림 분석·심리 해석 결과</strong>를 바탕으로 생성된 추천입니다.
                      </p>
                      <p className="text-muted-foreground text-xs">
                        정서·심리 지원, 대인관계·사회성 등 카테고리는 검사/논문 구조에 따라 구분됩니다.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              <div className="grid gap-6 md:grid-cols-3">
                {apiRecommendations.length > 0 ? (
                  apiRecommendations.map((rec) => (
                    <Card key={rec.category}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {getRecommendationCategoryLabel(rec.category)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {rec.items.map((item, index) => (
                            <li key={index} className="flex gap-3">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-xs font-semibold text-primary">
                                  {index + 1}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {item}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full">
                    <Card className="border-dashed">
                      <CardContent className="py-12 text-center">
                        <p className="text-sm text-muted-foreground">
                          이번 분석에 대한 맞춤 추천이 없습니다.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* iSeed: 추천 마음활동 (AI 분석 결과 기반 후처리 추천) */}
              {FEATURES.activities && activityRecommendations.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      추천 마음활동
                    </h2>
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary"
                    >
                      iSeed
                    </Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {activityRecommendations.map((act) => {
                      const meta =
                        CATEGORY_META[
                          act.category as keyof typeof CATEGORY_META
                        ];
                      const playable = isPlayable(act.id);
                      return (
                        <Card key={act.id} className="border-primary/20">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              {act.title}
                            </CardTitle>
                            {(act.category_label || meta?.label) && (
                              <CardDescription>
                                {act.category_label || meta?.label}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {act.summary && (
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {act.summary}
                              </p>
                            )}
                            {act.reason && (
                              <p className="text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-2">
                                {act.reason}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {act.duration_min ? (
                                <span>약 {act.duration_min}분</span>
                              ) : null}
                              {act.growth_point ? (
                                <span>🌱 +{act.growth_point}점</span>
                              ) : null}
                            </div>
                            <div className="pdf-hide-on-capture">
                              {playable ? (
                                <Link
                                  href={`/activities/${act.id}`}
                                  className="block"
                                >
                                  <Button size="sm" className="w-full gap-2">
                                    활동 시작하기
                                    <ArrowRight className="h-4 w-4" />
                                  </Button>
                                </Link>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                  disabled
                                >
                                  준비 중
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* iSeed 안내 문구 - 진단이 아닌 보조 분석임을 명시 */}
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {DISCLAIMER.long}
                  </p>
                </CardContent>
              </Card>

              {/* CTA - PDF 저장 시 숨김 */}
              <Card className="bg-primary/5 border-primary/20 pdf-hide-on-capture">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        아이와 함께 마음활동을 해볼까요?
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        활동을 마칠 때마다 아이의 마음 씨앗이 자랍니다.
                      </p>
                    </div>
                    <Link href="/activities">
                      <Button className="gap-2">
                        마음활동 보러가기
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ResultPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <ResultPageContent />
    </React.Suspense>
  );
}
