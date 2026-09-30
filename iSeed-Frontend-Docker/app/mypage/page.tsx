"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeedCard } from "@/components/iseed/seed-card";
import { FEATURES } from "@/lib/iseed/config";
import { Pagination } from "@/components/ui/pagination-simple";
import {
  User,
  Settings,
  FileText,
  ChevronRight,
  Calendar,
  TrendingUp,
  Award,
  Palette,
  Plus,
  Eye,
  Download,
  Share2,
  BarChart3,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

/** API 분석 로그 한 건 (MongoDB analysis_logs) - 레거시 */
export interface AnalysisLogItem {
  id: string;
  user_id: number;
  created_at: string;
  image_to_json: Record<string, unknown>;
  json_to_llm_json: Record<string, unknown>;
  llm_result_text: Record<string, unknown> | null;
}

/** 그림 분석 1건 (MongoDB drawing_analyses) */
export interface DrawingAnalysisItem {
  id: string;
  user_id: number;
  child_info: { name?: string; age?: string; gender?: string };
  created_at: string;
  element_analysis: Record<string, unknown>;
  analyzed_image_urls: Record<string, string>;
  psychological_interpretation: Record<
    string,
    { interpretation?: unknown; analysis?: unknown }
  >;
  comparison: Record<string, unknown>;
}

interface AnalysisHistory {
  id: string;
  date: string;
  childName: string;
  childAge: string;
  drawingType: string;
  thumbnail: string;
  overallScore: number;
  status: "완료" | "분석중";
  rawLog?: AnalysisLogItem;
  rawDrawing?: DrawingAnalysisItem;
}

/** 등록된 아이 */
export interface ChildItem {
  id: number;
  name: string;
  age: number;
  gender: string;
  created_at: string | null;
}

function mapDrawingToHistory(d: DrawingAnalysisItem): AnalysisHistory {
  const created = d.created_at ? new Date(d.created_at) : new Date();
  const dateStr = Number.isNaN(created.getTime())
    ? "-"
    : `${created.getFullYear()}.${String(created.getMonth() + 1).padStart(2, "0")}.${String(created.getDate()).padStart(2, "0")}`;
  const child = d.child_info || {};
  const score =
    typeof (d.comparison as { overall_score?: number })?.overall_score ===
    "number"
      ? (d.comparison as { overall_score: number }).overall_score
      : 0;
  const firstUrl =
    d.analyzed_image_urls?.tree ||
    d.analyzed_image_urls?.house ||
    "/placeholder.svg";
  return {
    id: d.id,
    date: dateStr,
    childName: (child.name as string) || "-",
    childAge: (child.age as string) || "-",
    drawingType: "HTP 그림 분석",
    thumbnail: firstUrl,
    overallScore: score,
    status: "완료",
    rawDrawing: d,
  };
}

/** 발달 영역별 분석: 에너지, 위치 안정성, 표현력 (drawing_scores 기반) */
const DEVELOPMENT_AREA_KEYS = [
  { key: "energy", label: "에너지", color: "bg-teal-500", scoreKey: "에너지_점수" as const },
  { key: "location", label: "위치 안정성", color: "bg-blue-500", scoreKey: "위치_안정성_점수" as const },
  { key: "expression", label: "표현력", color: "bg-amber-500", scoreKey: "표현력_점수" as const },
];

const ITEMS_PER_PAGE = 3;

export default function MyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isVisible, setIsVisible] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    profile_image_url: "base",
    created_at: "",
  });
  const [userId, setUserId] = useState<number | null>(null);
  const [drawingAnalyses, setDrawingAnalyses] = useState<DrawingAnalysisItem[]>(
    [],
  );
  const [drawingAnalysesLoading, setDrawingAnalysesLoading] = useState(false);
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [addChildForm, setAddChildForm] = useState({
    name: "",
    age: "",
    gender: "",
  });
  const [addChildSubmitting, setAddChildSubmitting] = useState(false);
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

  const analysisHistoryList: AnalysisHistory[] =
    drawingAnalyses.map(mapDrawingToHistory);

  const selectedChild = children.find((c) => c.id === selectedChildId) || null;

  /** 선택된 아이에 해당하는 분석만 필터링 (child_info.name, age, gender 매칭) */
  const filteredAnalysisHistoryList =
    selectedChildId && selectedChild
      ? analysisHistoryList.filter((a) => {
          const ci = a.rawDrawing?.child_info || {};
          const nameMatch = (ci.name as string) === selectedChild.name;
          const ageMatch = String(ci.age) === String(selectedChild.age);
          const genderMatch =
            (ci.gender as string) === selectedChild.gender ||
            (ci.gender === "남" && selectedChild.gender === "male") ||
            (ci.gender === "여" && selectedChild.gender === "female");
          return nameMatch && ageMatch && genderMatch;
        })
      : analysisHistoryList;

  const totalHistoryPages = Math.max(
    1,
    Math.ceil(filteredAnalysisHistoryList.length / ITEMS_PER_PAGE),
  );

  const paginatedHistory = filteredAnalysisHistoryList.slice(
    (historyPage - 1) * ITEMS_PER_PAGE,
    historyPage * ITEMS_PER_PAGE,
  );

  /** 평균 점수: 선택된 아이(또는 전체) 분석 목록의 overall_score 평균 */
  const averageScore = (() => {
    const list = selectedChild ? filteredAnalysisHistoryList : analysisHistoryList;
    const scores = list
      .map((a) => (a.rawDrawing?.comparison as { overall_score?: number })?.overall_score)
      .filter((s): s is number => typeof s === "number" && !Number.isNaN(s));
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  })();

  /** 이용 기간: 가입일 기준 1개월 미만이면 일 수, 1개월 이상이면 개월 수 */
  const usagePeriod = (() => {
    const created = profile.created_at ? new Date(profile.created_at) : null;
    if (!created || Number.isNaN(created.getTime())) return null;
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.max(0, Math.floor((now.getTime() - created.getTime()) / msPerDay));
    const months = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
    if (months < 1) return { value: days, unit: "days" as const };
    return { value: months, unit: "months" as const };
  })();

  /** 발달 영역별 분석: 최근 분석의 drawing_scores(에너지/위치안정성/표현력) 사용 */
  const developmentAreaData = (() => {
    const list = selectedChild ? filteredAnalysisHistoryList : analysisHistoryList;
    const latest = list[0];
    const prev = list[1];
    const agg = (latest?.rawDrawing?.comparison as { drawing_scores?: { aggregated?: Record<string, number> } } | undefined)
      ?.drawing_scores?.aggregated;
    const prevAgg = (prev?.rawDrawing?.comparison as { drawing_scores?: { aggregated?: Record<string, number> } } | undefined)
      ?.drawing_scores?.aggregated;
    
    // 분석 결과가 없으면 null 반환
    if (!agg) {
      return null;
    }
    
    return DEVELOPMENT_AREA_KEYS.map((area) => {
      const current = agg && typeof agg[area.scoreKey] === "number" ? Math.round(agg[area.scoreKey]) : null;
      const previous = prevAgg && typeof prevAgg[area.scoreKey] === "number" ? Math.round(prevAgg[area.scoreKey]) : null;
      return {
        ...area,
        current,
        previous,
      };
    });
  })();

  const handleSelectChild = (childId: number) => {
    setSelectedChildId(childId);
    setActiveTab("history");
    setHistoryPage(1);
  };

  const resolveProfileImageUrl = (value?: string | null) => {
    if (!value || value === "base") return null;
    const trimmed = value.trim();
    if (
      trimmed.startsWith("data:") ||
      trimmed.startsWith("blob:") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://")
    ) {
      return trimmed;
    }
    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    if (trimmed.startsWith("/")) {
      const base =
        apiBaseUrl ||
        (typeof window !== "undefined" ? window.location.origin : "");
      return base ? new URL(trimmed, base).toString() : trimmed;
    }
    return trimmed;
  };

  const handleViewDrawingAnalysis = async (
    doc: DrawingAnalysisItem,
    options?: { autoDownload?: boolean },
  ) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token") ||
          sessionStorage.getItem("auth_token")
        : null;
    let resolved = doc;
    if (token) {
      try {
        const res = await fetch(`${apiBaseUrl}/drawing-analyses/${doc.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const fetched = (await res.json()) as DrawingAnalysisItem;
          resolved = fetched;
        }
      } catch {
        // fallback to list item
      }
    }
    const labels = {
      tree: "나무",
      house: "집",
      man: "남자사람",
      woman: "여자사람",
    } as const;
    const results = (["tree", "house", "man", "woman"] as const).reduce(
      (acc, key) => {
        const psych = resolved.psychological_interpretation?.[key] || {};
        const interp = psych.interpretation;
        const analysis = psych.analysis;
        const el = resolved.element_analysis?.[key] as Record<string, unknown> | undefined;
        // DB는 element_analysis[key]를 { image_json, legacy_json } 형태로 저장함 → RAG용 image_json만 전달
        const imageJson =
          (el && typeof el === "object" && "image_json" in el && el.image_json)
            ? (el.image_json as Record<string, unknown>)
            : (el || {});
        acc[key] = {
          label: labels[key],
          image_json: imageJson,
          interpretation: interp,
          analysis: analysis || interp,
          box_image_base64: resolved.analyzed_image_urls?.[key] || null,
          metrics: {},
        };
        return acc;
      },
      {} as Record<string, unknown>,
    );
    const r = resolved as unknown as Record<string, unknown>
    const response = {
      success: true,
      child: resolved.child_info || { name: "-", age: "-", gender: "" },
      results,
      comparison: resolved.comparison || {},
      recommendations: Array.isArray(r.recommendations) ? r.recommendations : [],
      ...(r.전체_심리_결과 != null && typeof r.전체_심리_결과 === "object" ? { 전체_심리_결과: r.전체_심리_결과 } : {}),
    }
    const globalStore = globalThis as typeof globalThis & {
      __analysisResponse?: unknown;
      __analysisImages?: string[];
      __analysisBoxImages?: Record<string, string | null>;
    };
    globalStore.__analysisResponse = response;
    globalStore.__analysisImages = [];
    globalStore.__analysisBoxImages = {
      tree: resolved.analyzed_image_urls?.tree || null,
      house: resolved.analyzed_image_urls?.house || null,
      man: resolved.analyzed_image_urls?.man || null,
      woman: resolved.analyzed_image_urls?.woman || null,
    };
    try {
      sessionStorage.setItem("analysisResponse", JSON.stringify(response));
    } catch {
      // ignore
    }
    router.push(
      "/analysis/result" +
        (options?.autoDownload ? "?autoDownload=1" : ""),
    );
  };

  const profileImageSrc = resolveProfileImageUrl(profile.profile_image_url);
  const formattedJoinDate = (() => {
    if (!profile.created_at) return "가입일 정보 없음";
    const parsed = new Date(profile.created_at);
    if (Number.isNaN(parsed.getTime())) return "가입일 정보 없음";
    // 한국 시간대(UTC+9)로 변환: +9시간
    const kstDate = new Date(parsed.getTime() + 9 * 60 * 60 * 1000);
    const year = kstDate.getFullYear();
    const month = String(kstDate.getMonth() + 1).padStart(2, "0");
    const day = String(kstDate.getDate()).padStart(2, "0");
    return `${year}.${month}.${day} 가입`;
  })();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token") ||
          sessionStorage.getItem("auth_token")
        : null;
    if (!token) {
      setUserId(null);
      return;
    }
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        setProfile({
          name: data.name ?? "",
          email: data.email ?? "",
          profile_image_url: data.profile_image_url ?? "base",
          created_at: data.created_at ?? "",
        });
        if (typeof data.id === "number") setUserId(data.id);
        else setUserId(null);
      } catch {
        setUserId(null);
      }
    };
    fetchProfile();
  }, [apiBaseUrl]);

  useEffect(() => {
    if (userId == null) {
      setChildren([]);
      return;
    }
    let cancelled = false;
    setChildrenLoading(true);
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token") ||
          sessionStorage.getItem("auth_token")
        : null;
    if (!token) {
      setChildren([]);
      setChildrenLoading(false);
      return;
    }
    fetch(`${apiBaseUrl}/children`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((list: ChildItem[]) => {
        if (!cancelled && Array.isArray(list)) {
          setChildren(list);
          if (list.length > 0 && !selectedChildId) {
            setSelectedChildId(list[0].id);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setChildren([]);
      })
      .finally(() => {
        if (!cancelled) setChildrenLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, userId, selectedChildId]);

  const fetchChildren = () => {
    if (userId == null) return;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token") ||
          sessionStorage.getItem("auth_token")
        : null;
    if (!token) return;
    fetch(`${apiBaseUrl}/children`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((list: ChildItem[]) => {
        if (Array.isArray(list)) {
          setChildren(list);
          if (list.length > 0 && !selectedChildId) {
            setSelectedChildId(list[0].id);
          }
        }
      })
      .catch(() => {});
  };

  const handleAddChild = async () => {
    const name = addChildForm.name.trim();
    const age = parseInt(addChildForm.age, 10);
    const gender = addChildForm.gender;
    if (!name || Number.isNaN(age) || age < 7 || age > 13 || !gender) return;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token") ||
          sessionStorage.getItem("auth_token")
        : null;
    if (!token) return;
    setAddChildSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/children`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, age, gender }),
      });
      if (res.ok) {
        setAddChildForm({ name: "", age: "", gender: "" });
        setAddChildOpen(false);
        fetchChildren();
      }
    } finally {
      setAddChildSubmitting(false);
    }
  };

  useEffect(() => {
    if (userId == null) {
      setDrawingAnalyses([]);
      return;
    }
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token") ||
          sessionStorage.getItem("auth_token")
        : null;
    if (!token) {
      setDrawingAnalyses([]);
      return;
    }
    let cancelled = false;
    setDrawingAnalysesLoading(true);
    fetch(`${apiBaseUrl}/drawing-analyses?user_id=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((list: DrawingAnalysisItem[]) => {
        if (!cancelled && Array.isArray(list)) setDrawingAnalyses(list);
      })
      .catch(() => {
        if (!cancelled) setDrawingAnalyses([]);
      })
      .finally(() => {
        if (!cancelled) setDrawingAnalysesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, userId]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Profile Banner with Video */}
        <div className="relative overflow-hidden">
          {/* Video Background */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source
              src="https://videos.pexels.com/video-files/3209211/3209211-uhd_2560_1440_25fps.mp4"
              type="video/mp4"
            />
          </video>
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/45" />

          <div className="relative z-10 container mx-auto px-4 lg:px-8 py-10">
            <div
              className={`flex flex-col md:flex-row items-center gap-6 transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <Avatar className="h-24 w-24 border-4 border-white/30 shadow-lg">
                {profileImageSrc && (
                  <AvatarImage
                    src={profileImageSrc || "/placeholder.svg"}
                    alt={profile.name || "프로필"}
                  />
                )}
                <AvatarFallback className="text-2xl bg-white text-teal-600 font-bold">
                  {(profile.name || " ").trim().charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left text-white">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <h1 className="text-2xl font-bold">
                    {profile.name || "회원"}
                  </h1>
                </div>
                <p className="text-white/70 mt-1">
                  {profile.email || "이메일 정보 없음"}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-sm text-white/70">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formattedJoinDate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    분석 {analysisHistoryList.length}회
                  </span>
                </div>
              </div>

              <Link href="/mypage/settings">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                >
                  <Settings className="h-4 w-4" />
                  설정
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Child Selector */}
        <div className="container mx-auto px-4 lg:px-8 -mt-6 relative z-10">
          <div
            className={`bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-5 transition-all duration-700 delay-100 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800">
                아이 선택
              </h2>
              {userId != null && (
                <Dialog open={addChildOpen} onOpenChange={setAddChildOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                    >
                      <Plus className="h-4 w-4" />
                      아이 등록
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>아이 등록</DialogTitle>
                      <DialogDescription>
                        아이 이름, 나이, 성별을 입력해주세요.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="child-name">이름</Label>
                        <Input
                          id="child-name"
                          placeholder="예: 홍길동"
                          value={addChildForm.name}
                          onChange={(e) =>
                            setAddChildForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="child-age">나이</Label>
                        <Select
                          value={addChildForm.age}
                          onValueChange={(v) =>
                            setAddChildForm((prev) => ({ ...prev, age: v }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="나이 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 7 }, (_, i) => i + 7).map(
                              (age) => (
                                <SelectItem key={age} value={age.toString()}>
                                  {age}세
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="child-gender">성별</Label>
                        <Select
                          value={addChildForm.gender}
                          onValueChange={(v) =>
                            setAddChildForm((prev) => ({ ...prev, gender: v }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="성별 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">남아</SelectItem>
                            <SelectItem value="female">여아</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setAddChildOpen(false)}
                      >
                        취소
                      </Button>
                      <Button
                        onClick={handleAddChild}
                        disabled={
                          !addChildForm.name.trim() ||
                          !addChildForm.age ||
                          !addChildForm.gender ||
                          addChildSubmitting
                        }
                      >
                        {addChildSubmitting ? "등록 중..." : "등록"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {childrenLoading ? (
              <p className="text-sm text-slate-400 py-2">불러오는 중...</p>
            ) : children.length === 0 ? (
              <div className="text-center py-6">
                <User className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-500">등록된 아이가 없습니다</p>
                <p className="text-xs text-slate-400 mt-1">
                  아이 등록 버튼을 눌러 추가해주세요
                </p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {children.map((child) => {
                  const isSelected = child.id === selectedChildId;
                  const colorClass =
                    child.gender === "male" ? "bg-blue-500" : "bg-pink-500";
                  return (
                    <button
                      key={child.id}
                      onClick={() => handleSelectChild(child.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 shrink-0 ${
                        isSelected
                          ? "border-teal-500 bg-teal-50"
                          : "border-transparent bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center shrink-0`}
                      >
                        <span className="text-sm font-bold text-white">
                          {child.name.charAt(0)}
                        </span>
                      </div>
                      <div className="text-left">
                        <p
                          className={`text-sm font-semibold ${isSelected ? "text-teal-700" : "text-slate-700"}`}
                        >
                          {child.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {child.age}세 ·{" "}
                          {child.gender === "male" ? "남아" : "여아"}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="ml-1 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v);
              setHistoryPage(1);
            }}
          >
            <TabsList
              className={`w-full justify-start bg-slate-100 rounded-full p-1 mb-8 transition-all duration-700 delay-200 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <TabsTrigger
                value="overview"
                className="gap-2 rounded-full px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <BarChart3 className="h-4 w-4" />
                개요
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="gap-2 rounded-full px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <FileText className="h-4 w-4" />
                분석 기록
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {/* iSeed: 나의 마음 씨앗 */}
              {FEATURES.seedGrowth && <SeedCard />}
              {/* Selected Child Info */}
              {selectedChild && (
                <section
                  className={`transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`w-12 h-12 rounded-full ${selectedChild.gender === "male" ? "bg-blue-500" : "bg-pink-500"} flex items-center justify-center`}
                    >
                      <span className="text-lg font-bold text-white">
                        {selectedChild.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">
                        {selectedChild.name}의 대시보드
                      </h2>
                      <p className="text-sm text-slate-500">
                        {selectedChild.age}세 ·{" "}
                        {selectedChild.gender === "male" ? "남아" : "여아"}
                      </p>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-slate-50 rounded-2xl p-5 text-center hover:bg-slate-100 transition-colors">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-teal-50 mb-2">
                        <FileText className="h-4 w-4 text-teal-600" />
                      </div>
                      <p className="text-2xl font-bold text-slate-800">
                        {selectedChild
                          ? filteredAnalysisHistoryList.length
                          : analysisHistoryList.length}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">총 분석</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-5 text-center hover:bg-slate-100 transition-colors">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-50 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-slate-800">
                        {averageScore != null ? (
                          <>
                            {averageScore}
                            <span className="text-sm">점</span>
                          </>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">평균 점수</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-5 text-center hover:bg-slate-100 transition-colors">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-50 mb-2">
                        <Award className="h-4 w-4 text-amber-600" />
                      </div>
                      <p className="text-2xl font-bold text-slate-800">
                        {usagePeriod != null ? (
                          <>
                            {usagePeriod.value}
                            <span className="text-sm">{usagePeriod.unit === "days" ? "일" : "개월"}</span>
                          </>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">이용 기간</p>
                    </div>
                  </div>
                </section>
              )}

              {/* Development Progress */}
              <section
                className={`transition-all duration-700 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-800">
                    발달 영역별 분석
                  </h2>
                  <span className="text-sm text-slate-400">
                    최근 분석 결과 기반
                  </span>
                </div>
                {developmentAreaData === null || developmentAreaData.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-500">분석 결과가 없습니다</p>
                    <p className="text-xs text-slate-400 mt-1">
                      아이의 그림을 분석하면 발달 영역별 분석을 확인할 수 있어요
                    </p>
                    <Link href="/analysis">
                      <Button size="sm" className="mt-3 gap-2">
                        <Plus className="h-4 w-4" />분석 시작하기
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {developmentAreaData.map((data, index) => (
                      <div
                        key={data.key}
                        className={`bg-slate-50 rounded-2xl p-5 transition-all duration-500 hover:bg-slate-100 ${
                          isVisible
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-4"
                        }`}
                        style={{ transitionDelay: `${400 + index * 100}ms` }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-slate-600">
                            {data.label}
                          </span>
                          {data.current !== null && data.previous !== null && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                data.current > data.previous
                                  ? "bg-green-100 text-green-600"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {data.current > data.previous ? "+" : ""}
                              {data.current - data.previous}
                            </span>
                          )}
                        </div>
                        <p className="text-3xl font-bold text-slate-800">
                          {data.current !== null ? data.current : "-"}
                        </p>
                        <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                          {data.current !== null && (
                            <div
                              className={`h-full ${data.color} rounded-full transition-all duration-1000`}
                              style={{ width: `${data.current}%` }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Recent Analysis */}
              <section
                className={`transition-all duration-700 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-800">
                    최근 분석 기록
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-teal-600 hover:text-teal-700"
                    onClick={() => setActiveTab("history")}
                  >
                    전체보기
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {(selectedChild
                    ? filteredAnalysisHistoryList
                    : analysisHistoryList
                  )
                    .slice(0, 3)
                    .map((analysis, index) => (
                      <AnalysisCard
                        key={analysis.id}
                        analysis={analysis}
                        delay={600 + index * 100}
                        isVisible={isVisible}
                        onView={
                          analysis.rawDrawing
                            ? () =>
                                handleViewDrawingAnalysis(analysis.rawDrawing!)
                            : undefined
                        }
                      />
                    ))}
                  {drawingAnalysesLoading &&
                    (selectedChild
                      ? filteredAnalysisHistoryList
                      : analysisHistoryList
                    ).length === 0 && (
                      <p className="text-sm text-slate-500 py-4">
                        분석 기록 불러오는 중...
                      </p>
                    )}
                  {!drawingAnalysesLoading &&
                    userId != null &&
                    (selectedChild
                      ? filteredAnalysisHistoryList
                      : analysisHistoryList
                    ).length === 0 && (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl">
                        <Palette className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-sm text-slate-500">
                          아직 분석 기록이 없어요
                        </p>
                        <Link href="/analysis">
                          <Button size="sm" className="mt-3 gap-2">
                            <Plus className="h-4 w-4" />첫 분석 시작하기
                          </Button>
                        </Link>
                      </div>
                    )}
                  {userId == null && (
                    <p className="text-sm text-slate-500 py-4">
                      로그인하면 분석 기록을 볼 수 있어요.
                    </p>
                  )}
                </div>
              </section>
            </TabsContent>

            {/* Analysis History Tab */}
            <TabsContent value="history">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {selectedChild
                      ? `${selectedChild.name}의 분석 기록`
                      : "분석 기록"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    총 {filteredAnalysisHistoryList.length}건의 분석 기록
                  </p>
                </div>
                <Link href="/analysis">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />새 분석
                  </Button>
                </Link>
              </div>
              {drawingAnalysesLoading ? (
                <p className="text-sm text-slate-500 py-8">
                  분석 기록 불러오는 중...
                </p>
              ) : userId == null ? (
                <p className="text-sm text-slate-500 py-8">
                  로그인하면 분석 기록을 볼 수 있어요.
                </p>
              ) : filteredAnalysisHistoryList.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl">
                  <Palette className="h-14 w-14 mx-auto mb-4 text-slate-300" />
                  <p className="font-medium text-slate-600">
                    아직 분석 기록이 없어요
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    아이의 그림을 분석해보세요
                  </p>
                  <Link href="/analysis">
                    <Button className="mt-4 gap-2">
                      <Plus className="h-4 w-4" />
                      분석 시작하기
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedHistory.map((analysis, index) => (
                      <AnalysisCard
                        key={analysis.id}
                        analysis={analysis}
                        showActions
                        delay={index * 100}
                        isVisible={true}
                        onView={
                          analysis.rawDrawing
                            ? () =>
                                handleViewDrawingAnalysis(analysis.rawDrawing!)
                            : undefined
                        }
                        onDownload={
                          analysis.rawDrawing
                            ? () =>
                                handleViewDrawingAnalysis(
                                  analysis.rawDrawing!,
                                  { autoDownload: true },
                                )
                            : undefined
                        }
                      />
                    ))}
                  </div>
                  {totalHistoryPages > 1 && (
                    <Pagination
                      currentPage={historyPage}
                      totalPages={totalHistoryPages}
                      onPageChange={setHistoryPage}
                    />
                  )}
                </>
              )}
            </TabsContent>

          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function AnalysisCard({
  analysis,
  showActions = false,
  delay = 0,
  isVisible = true,
  onView,
  onDownload,
}: {
  analysis: AnalysisHistory;
  showActions?: boolean;
  delay?: number;
  isVisible?: boolean;
  onView?: () => void;
  onDownload?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all duration-500 ${
        onView ? "cursor-pointer" : ""
      } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      style={{ transitionDelay: `${delay}ms` }}
      onClick={onView && analysis.status === "완료" ? onView : undefined}
      role={onView && analysis.status === "완료" ? "button" : undefined}
    >
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center shrink-0">
        <Palette className="h-7 w-7 text-teal-600" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-slate-800">
            {analysis.drawingType}
          </h4>
          <Badge
            variant={analysis.status === "완료" ? "default" : "secondary"}
            className="text-xs"
          >
            {analysis.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
          <span>
            {analysis.childName} ({analysis.childAge})
          </span>
          <span>·</span>
          <span>{analysis.date}</span>
        </div>
      </div>

      {analysis.status === "완료" && analysis.overallScore > 0 && (
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-teal-600">
            {analysis.overallScore}
          </p>
          <p className="text-xs text-slate-400">점수</p>
        </div>
      )}

      {showActions && analysis.status === "완료" && (
        <div
          className="flex gap-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {onView && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-transparent"
              onClick={onView}
            >
              <Eye className="h-4 w-4" />
              보기
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
