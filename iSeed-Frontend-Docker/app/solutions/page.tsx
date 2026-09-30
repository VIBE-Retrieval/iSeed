"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { VideoHero } from "@/components/shared/video-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Palette,
  Lightbulb,
  Heart,
  BookOpen,
  Play,
  Clock,
  Users,
  Star,
  Search,
  MapPin,
  Phone,
  Navigation,
  ChevronRight,
} from "lucide-react";

const therapyMethods = [
  {
    id: "art-therapy",
    title: "미술 치료",
    description: "다양한 미술 활동을 통해 감정을 표현하고 내면을 탐색합니다",
    icon: Palette,
    color: "bg-primary",
    activities: [
      {
        name: "자유화 그리기",
        duration: "20분",
        description:
          "어떤 주제도 없이 자유롭게 그림을 그리며 무의식적 감정을 표현합니다.",
        steps: [
          "종이와 다양한 그리기 도구를 준비합니다",
          "아이에게 자유롭게 그리도록 합니다",
          "완성 후 그림에 대해 대화합니다",
        ],
      },
      {
        name: "감정 색칠하기",
        duration: "15분",
        description: "다양한 색상을 사용하여 현재 느끼는 감정을 표현합니다.",
        steps: [
          "오늘의 기분을 물어봅니다",
          "그 감정을 색으로 표현하게 합니다",
          "색을 선택한 이유를 들어봅니다",
        ],
      },
      {
        name: "콜라주 만들기",
        duration: "30분",
        description: "잡지나 종이를 오려 붙여 자신만의 작품을 만듭니다.",
        steps: [
          "잡지, 가위, 풀을 준비합니다",
          "마음에 드는 이미지를 선택하게 합니다",
          "선택한 이유에 대해 이야기합니다",
        ],
      },
    ],
  },
  {
    id: "play-therapy",
    title: "놀이 치료",
    description: "놀이를 통해 자연스럽게 감정을 표현하고 사회성을 기릅니다",
    icon: Play,
    color: "bg-accent",
    activities: [
      {
        name: "역할 놀이",
        duration: "25분",
        description: "다양한 역할을 연기하며 감정과 상황을 이해합니다.",
        steps: [
          "인형이나 장난감을 준비합니다",
          "아이가 원하는 역할을 선택하게 합니다",
          "자연스러운 놀이를 이어갑니다",
        ],
      },
      {
        name: "모래 놀이",
        duration: "20분",
        description: "모래와 소품을 이용해 자신만의 세계를 만들어봅니다.",
        steps: [
          "모래판과 다양한 소품을 준비합니다",
          "자유롭게 꾸미도록 합니다",
          "만든 것에 대해 이야기합니다",
        ],
      },
    ],
  },
  {
    id: "reading-therapy",
    title: "독서 치료",
    description: "책을 읽으며 감정을 이해하고 공감 능력을 키웁니다",
    icon: BookOpen,
    color: "bg-chart-2",
    activities: [
      {
        name: "감정 그림책 읽기",
        duration: "15분",
        description: "감정을 다룬 그림책을 함께 읽고 이야기합니다.",
        steps: [
          "감정 관련 그림책을 선택합니다",
          "함께 읽으며 등장인물의 감정을 물어봅니다",
          "비슷한 경험을 나눕니다",
        ],
      },
      {
        name: "이야기 만들기",
        duration: "20분",
        description: "아이가 직접 이야기를 만들어 감정을 표현합니다.",
        steps: [
          "시작 문장을 제시합니다",
          "아이가 이야기를 이어가게 합니다",
          "등장인물의 감정에 대해 이야기합니다",
        ],
      },
    ],
  },
];

const colorRecommendations = [
  {
    emotion: "불안함",
    colors: ["파랑", "초록"],
    colorClasses: ["bg-blue-500", "bg-green-500"],
    description: "차분하고 안정적인 느낌의 색상으로 마음을 진정시킵니다",
    activities: ["파란 하늘 그리기", "숲 풍경 색칠하기", "바다 물결 표현하기"],
  },
  {
    emotion: "우울함",
    colors: ["노랑", "주황"],
    colorClasses: ["bg-yellow-500", "bg-orange-500"],
    description: "밝고 따뜻한 색상으로 기분을 환기시킵니다",
    activities: ["해바라기 그리기", "무지개 색칠하기", "밝은 꽃밭 표현하기"],
  },
  {
    emotion: "분노",
    colors: ["파랑", "보라"],
    colorClasses: ["bg-blue-500", "bg-violet-500"],
    description: "시원하고 차분한 색상으로 감정을 가라앉힙니다",
    activities: ["밤하늘 그리기", "깊은 바다 표현하기", "보라색 꽃 그리기"],
  },
  {
    emotion: "외로움",
    colors: ["분홍", "노랑"],
    colorClasses: ["bg-pink-500", "bg-yellow-500"],
    description: "따뜻하고 포근한 색상으로 마음을 감싸줍니다",
    activities: [
      "가족 그림 그리기",
      "친구와 노는 모습 표현하기",
      "따뜻한 집 그리기",
    ],
  },
];

const homeActivities = [
  {
    title: "그림 일기 쓰기",
    frequency: "매일",
    duration: "10-15분",
    ageRange: "5-12세",
    description: "하루의 감정과 경험을 그림으로 표현하는 습관을 들입니다.",
    materials: ["그림 일기장", "색연필 또는 크레파스"],
    benefits: ["감정 인식 능력 향상", "표현력 발달", "자기 이해 증진"],
  },
  {
    title: "가족 미술 시간",
    frequency: "주 1-2회",
    duration: "30분",
    ageRange: "전 연령",
    description: "온 가족이 함께 그림을 그리며 소통하는 시간을 갖습니다.",
    materials: ["큰 종이", "다양한 미술 도구"],
    benefits: ["가족 유대감 강화", "소통 능력 향상", "창의력 발달"],
  },
  {
    title: "감정 카드 게임",
    frequency: "주 2-3회",
    duration: "15분",
    ageRange: "4-10세",
    description: "감정 카드를 활용해 다양한 감정을 인식하고 표현합니다.",
    materials: ["감정 카드 (직접 만들기 가능)"],
    benefits: ["감정 어휘력 향상", "공감 능력 발달", "감정 조절 능력 향상"],
  },
  {
    title: "자연물 아트",
    frequency: "주 1회",
    duration: "40분",
    ageRange: "4-12세",
    description: "나뭇잎, 돌, 꽃 등 자연물을 이용해 작품을 만듭니다.",
    materials: ["자연물 (나뭇잎, 돌, 꽃 등)", "종이, 풀"],
    benefits: ["자연 친화력 향상", "창의력 발달", "집중력 향상"],
  },
];

interface Center {
  id: string;
  name: string;
  address: string;
  phone: string;
  homepageUrl?: string;
  raw?: unknown;
  expertIntro?: string;
  reservationUrl?: string;
  reservationText?: string;
  hours: string;
  rating: number;
  reviewCount: number;
  distance: string;
  specialties: string[];
  lat?: number;
  lng?: number;
  metaLines?: string[];
  intro?: string;
  programs?: string;
  applyMethod?: string;
  extras?: Array<{ label: string; value: string }>;
  isOpen: boolean;
}

type AnyRecord = Record<string, unknown>;

type OpenApiMarkerPoint = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  url?: string;
};

function rowsFromAnyJson(json: unknown): unknown[] {
  const base = rowsFromJson(json);
  if (base.length > 0) return base;
  if (json && typeof json === "object") {
    const obj = json as AnyRecord;
    if (Array.isArray(obj.documents)) return obj.documents;
    if (Array.isArray(obj.results)) return obj.results;
    if (Array.isArray(obj.result)) return obj.result;
  }
  return [];
}

function normalizeInputUrl(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;

  // 코드에서 복사해 붙여넣는 경우: 따옴표/괄호/쉼표/세미콜론 등을 제거
  s = s.replace(/^[\s"'`([{<]+/, "");
  s = s.replace(/[\s"'`)\]}>]+$/, "");
  while (s && /[.,;:)\]]$/.test(s)) {
    s = s.slice(0, -1);
  }

  s = s.replace(/\s+/g, "");
  if (!s) return null;

  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;
  if (s.startsWith("www.")) return `https://${s}`;
  if (/^[\p{L}\p{N}.-]+\.[\p{L}]{2,}(\/.*)?$/iu.test(s)) return `https://${s}`;
  return null;
}

function parseUrlsFromText(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const add = (raw: string) => {
    const u = normalizeInputUrl(raw);
    if (!u) return;
    if (/dapi\.kakao\.com\/v2\/maps\/sdk\.js/i.test(u)) return;
    const key = u.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(u);
  };

  for (const m of text.matchAll(/https?:\/\/[^\s"'`<>()[\]{}]+/gi)) {
    add(m[0]);
  }
  for (const m of text.matchAll(/\bwww\.[^\s"'`<>()[\]{}]+/gi)) {
    add(m[0]);
  }
  const parts = text.split(/\s+/g).flatMap((t) => t.split(/[,;]/g));
  for (const p of parts) add(p);

  return out;
}

function openApiMarkerFromRecord(
  rec: AnyRecord,
): Omit<OpenApiMarkerPoint, "id"> | null {
  const sources = collectRecordSources(rec);
  const lat =
    pickNumberFromSources(sources, [
      "WGS84위도",
      "WGS84 위도",
      "위도",
      "lat",
      "latitude",
      "y",
      "REFINE_WGS84_LAT",
    ]) ?? pickNumberByRegexFromSources(sources, /위도|lat|latitude/i);
  const lng =
    pickNumberFromSources(sources, [
      "WGS84경도",
      "WGS84 경도",
      "경도",
      "lng",
      "lon",
      "longitude",
      "x",
      "REFINE_WGS84_LOGT",
      "REFINE_WGS84_LONG",
    ]) ??
    pickNumberByRegexFromSources(sources, /경도|lng|lon|longitude|logt|x/i);

  const latOk = lat !== undefined && lat >= -90 && lat <= 90 ? lat : undefined;
  const lngOk =
    lng !== undefined && lng >= -180 && lng <= 180 ? lng : undefined;
  if (latOk === undefined || lngOk === undefined) return null;

  const title =
    pickStringFromSources(sources, [
      "name",
      "title",
      "place_name",
      "상담소명",
      "시설명",
      "기관명",
      "센터명",
    ]) ?? "OpenAPI";
  const urlRaw =
    pickStringFromSources(sources, [
      "url",
      "URI",
      "uri",
      "homepage",
      "homePage",
      "place_url",
      "홈페이지",
      "홈페이지URL",
      "홈페이지 URL",
    ]) ??
    pickStringByRegexFromSources(sources, /홈페이지|home\s?page|website|url/i);
  const url =
    urlRaw && /^https?:\/\//i.test(urlRaw.trim()) ? urlRaw.trim() : undefined;

  return { lat: latOk, lng: lngOk, title, url };
}

function extractOpenApiMarkers(
  json: unknown,
): Array<Omit<OpenApiMarkerPoint, "id">> {
  const rows = rowsFromAnyJson(json);
  const points: Array<Omit<OpenApiMarkerPoint, "id">> = [];

  const tryPush = (value: unknown) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    const rec = value as AnyRecord;
    const p = openApiMarkerFromRecord(rec);
    if (p) points.push(p);
  };

  if (rows.length > 0) {
    for (const item of rows) tryPush(item);
    return points;
  }

  tryPush(json);
  return points;
}

type OpenApiGeocodeTask = { address: string; title: string; url?: string };

function openApiGeocodeTaskFromRecord(
  rec: AnyRecord,
): OpenApiGeocodeTask | null {
  if (openApiMarkerFromRecord(rec)) return null;
  const sources = collectRecordSources(rec);
  const addressRaw =
    pickStringFromSources(sources, [
      "주소",
      "소재지도로명주소",
      "소재지지번주소",
      "도로명주소",
      "지번주소",
      "소재지",
      "roadAddress",
      "address",
      "rdnmadr",
      "lnmadr",
      "REFINE_ROADNM_ADDR",
      "REFINE_LOTNO_ADDR",
    ]) ?? pickStringByRegexFromSources(sources, /주소|addr/i);
  const address = addressRaw?.trim() || "";
  if (!address) return null;

  const title =
    pickStringFromSources(sources, [
      "name",
      "title",
      "place_name",
      "상담소명",
      "시설명",
      "기관명",
      "센터명",
      "사업장명",
    ]) || address;
  const urlRaw =
    pickStringFromSources(sources, [
      "url",
      "URI",
      "uri",
      "homepage",
      "homePage",
      "place_url",
      "홈페이지",
      "홈페이지URL",
      "홈페이지 URL",
    ]) ??
    pickStringByRegexFromSources(sources, /홈페이지|home\s?page|website|url/i);
  const url =
    urlRaw && /^https?:\/\//i.test(urlRaw.trim()) ? urlRaw.trim() : undefined;

  return { address, title, url };
}

function extractOpenApiGeocodeTasks(json: unknown): OpenApiGeocodeTask[] {
  const rows = rowsFromAnyJson(json);
  const tasks: OpenApiGeocodeTask[] = [];

  const tryPush = (value: unknown) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    const rec = value as AnyRecord;
    const t = openApiGeocodeTaskFromRecord(rec);
    if (t) tasks.push(t);
  };

  if (rows.length > 0) {
    for (const item of rows) tryPush(item);
    return tasks;
  }

  tryPush(json);
  return tasks;
}

function toText(value: unknown): string | undefined {
  if (typeof value === "string") {
    const s = value.trim();
    return s ? s : undefined;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : undefined;
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((v) => toText(v))
      .filter((v): v is string => Boolean(v));
    if (parts.length === 0) return undefined;
    return parts.join(", ");
  }
  return undefined;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}

function buildExtras(
  row: AnyRecord,
): Array<{ label: string; value: string }> | undefined {
  const coordKeyRe =
    /위도|경도|lat|lng|lon|longitude|latitude|wgs84|refine_wgs84|logt/i;
  const longTextKeyRe =
    /시설\s*소개|주요[_\s]*프로그램|이용[_\s]*신청[_\s]*방법/i;
  const urlKeyRe = /홈페이지|home\s?page|website|url/i;
  const alreadyShownKeyRe =
    /시설명칭?|센터명칭?|기관명칭?|기관명|제공기관명|상호명|사업장명|name|roadAddress|address|도로명주소|지번주소|소재지도로명주소|소재지지번주소|소재지|^주소$|전화번호|전화|연락처|기관연락번호|tel|phone|운영시간|영업시간|이용시간|hours|평점|후기평점|별점|rating|리뷰|review|거리|distance|전문분야|상담분야|치료분야|specialties|전문가\s*소개|예약\s*링크|예약링크|예약\s*url|reservation|booking|place_id|place\s*id/i;

  const extras: Array<{ label: string; value: string }> = [];
  const seen = new Set<string>();
  const sources = collectRecordSources(row);

  for (const src of sources) {
    for (const [k, v] of Object.entries(src)) {
      if (!k || k === "__dataset") continue;
      if (coordKeyRe.test(k)) continue;
      if (longTextKeyRe.test(k)) continue;
      if (urlKeyRe.test(k)) continue;
      if (alreadyShownKeyRe.test(k)) continue;

      const text = formatKeyValueSummary(v);
      if (!text) continue;

      const value = text;
      const sig = `${k}\u0000${value}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      extras.push({ label: k, value });
    }
  }

  return extras.length > 0 ? extras : undefined;
}

function centerQualityScore(center: Center): number {
  let score = 0;
  if (center.lat != null && center.lng != null) score += 100;
  if (center.homepageUrl) score += 5;
  if (center.phone) score += 2;
  if (center.address) score += 2;
  if (center.intro) score += 2;
  if (center.programs) score += 2;
  if (center.applyMethod) score += 2;
  if (center.expertIntro) score += 2;
  if (center.reservationUrl || center.reservationText) score += 2;
  score += center.metaLines?.length ?? 0;
  score += Math.min(3, (center.extras?.length ?? 0) / 20);
  return score;
}

function dedupCenters(centers: Center[]): Center[] {
  const seen = new Map<string, Center>();
  for (const c of centers) {
    const key =
      `${(c.name ?? "").trim()}|${(c.address ?? "").trim()}`.toLowerCase();
    const prev = seen.get(key);
    if (!prev) {
      seen.set(key, c);
      continue;
    }

    if (centerQualityScore(c) > centerQualityScore(prev)) {
      seen.set(key, c);
    }
  }
  return Array.from(seen.values());
}

function pickString(row: AnyRecord, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNumber(row: AnyRecord, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number.parseFloat(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function pickText(row: AnyRecord, keys: string[]): string | undefined {
  for (const k of keys) {
    const text = toText(row[k]);
    if (text) return text;
  }
  return undefined;
}

function pickTextByRegex(row: AnyRecord, regex: RegExp): string | undefined {
  for (const k of Object.keys(row)) {
    if (!regex.test(k)) continue;
    const text = toText(row[k]);
    if (text) return text;
  }
  return undefined;
}

function pickStringByRegex(row: AnyRecord, regex: RegExp): string | undefined {
  for (const k of Object.keys(row)) {
    if (!regex.test(k)) continue;
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNumberByRegex(row: AnyRecord, regex: RegExp): number | undefined {
  for (const k of Object.keys(row)) {
    if (!regex.test(k)) continue;
    const n = pickNumber(row, [k]);
    if (n !== undefined) return n;
  }
  return undefined;
}

function asRecord(value: unknown): AnyRecord | undefined {
  if (!value || typeof value !== "object") return undefined;
  if (Array.isArray(value)) return undefined;
  return value as AnyRecord;
}

function stripCoordinatesDeep(value: unknown): unknown {
  const coordKeyRe =
    /위도|경도|lat|lng|lon|longitude|latitude|wgs84|refine_wgs84|logt/i;

  if (Array.isArray(value)) return value.map(stripCoordinatesDeep);
  const rec = asRecord(value);
  if (!rec) return value;

  const out: AnyRecord = {};
  for (const [k, v] of Object.entries(rec)) {
    if (coordKeyRe.test(k)) continue;
    out[k] = stripCoordinatesDeep(v);
  }
  return out;
}

function filterJsonDeep(
  value: unknown,
  queryLower: string,
  keysOnly: boolean,
): { filtered: unknown; matches: number } | null {
  if (!queryLower) return { filtered: value, matches: 0 };

  if (Array.isArray(value)) {
    const outArr: unknown[] = [];
    let matches = 0;
    for (const item of value) {
      const res = filterJsonDeep(item, queryLower, keysOnly);
      if (!res) continue;
      outArr.push(res.filtered);
      matches += res.matches;
    }
    if (outArr.length === 0) return null;
    return { filtered: outArr, matches };
  }

  const rec = asRecord(value);
  if (rec) {
    const out: AnyRecord = {};
    let matches = 0;
    for (const [k, v] of Object.entries(rec)) {
      const keyHit = k.toLowerCase().includes(queryLower);
      const valueText =
        keysOnly || v == null
          ? ""
          : typeof v === "string" ||
              typeof v === "number" ||
              typeof v === "boolean"
            ? String(v).toLowerCase()
            : "";
      const valueHit = !keysOnly && valueText.includes(queryLower);

      if (keyHit || valueHit) {
        out[k] = v;
        matches += 1;
        continue;
      }

      const child = filterJsonDeep(v, queryLower, keysOnly);
      if (child) {
        out[k] = child.filtered;
        matches += child.matches;
      }
    }
    if (Object.keys(out).length === 0) return null;
    return { filtered: out, matches };
  }

  if (keysOnly) return null;
  if (value == null) return null;
  const text =
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
      ? String(value).toLowerCase()
      : "";
  if (!text) return null;
  return text.includes(queryLower) ? { filtered: value, matches: 1 } : null;
}

function collectRecordSources(row: AnyRecord): AnyRecord[] {
  const sources: AnyRecord[] = [row];
  const nestedKeys = [
    // 통합 JSON에서 자주 쓰는 nested 구조들
    "기본정보",
    "기본 정보",
    "basicInfo",
    "baseInfo",
    "BASE_INFO",
    "후기_평점",
    "후기평점",
    "후기 평점",
    "예약_및_이용신청",
    "예약 및 이용신청",
    "예약정보",
    "공식홈페이지_및_상담연결",
    "공식홈페이지 및 상담연결",
    "공식홈페이지",
    "공식 홈페이지",
    "공식_홈페이지",
    "상담소_연결_페이지",
    "상담소 연결 페이지",
    "상담소연결페이지",
    "상담소_연결페이지",
    "상담소연결_페이지",
    "전문가소개",
    "전문가 소개",
  ] as const;

  for (const k of nestedKeys) {
    const rec = asRecord(row[k]);
    if (!rec) continue;
    sources.push(rec);

    // nested 안쪽의 공통 자원/지역 링크도 함께 수집
    const deepKeys = [
      "공통_자원",
      "공통 자원",
      "공통자원",
      "commonResources",
      "지역_상담기관_홈페이지",
      "지역 상담기관 홈페이지",
      "지역상담기관_홈페이지",
      "홈페이지",
      "홈페이지명",
    ] as const;
    for (const dk of deepKeys) {
      const deep = asRecord(rec[dk]);
      if (deep) sources.push(deep);
    }
  }
  return sources;
}

function pickStringFromSources(
  sources: AnyRecord[],
  keys: string[],
): string | undefined {
  for (const src of sources) {
    const v = pickString(src, keys);
    if (v) return v;
  }
  return undefined;
}

function pickNumberFromSources(
  sources: AnyRecord[],
  keys: string[],
): number | undefined {
  for (const src of sources) {
    const v = pickNumber(src, keys);
    if (v !== undefined) return v;
  }
  return undefined;
}

function pickTextFromSources(
  sources: AnyRecord[],
  keys: string[],
): string | undefined {
  for (const src of sources) {
    const v = pickText(src, keys);
    if (v) return v;
  }
  return undefined;
}

function pickTextByRegexFromSources(
  sources: AnyRecord[],
  regex: RegExp,
): string | undefined {
  for (const src of sources) {
    const v = pickTextByRegex(src, regex);
    if (v) return v;
  }
  return undefined;
}

function pickStringByRegexFromSources(
  sources: AnyRecord[],
  regex: RegExp,
): string | undefined {
  for (const src of sources) {
    const v = pickStringByRegex(src, regex);
    if (v) return v;
  }
  return undefined;
}

function pickNumberByRegexFromSources(
  sources: AnyRecord[],
  regex: RegExp,
): number | undefined {
  for (const src of sources) {
    const v = pickNumberByRegex(src, regex);
    if (v !== undefined) return v;
  }
  return undefined;
}

function formatKeyValueSummary(value: unknown): string | undefined {
  const s = toText(value);
  if (s) return s;

  const obj = asRecord(value);
  if (!obj) return undefined;

  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const t = toText(v);
    if (!t) continue;
    parts.push(`${k}: ${t}`);
  }

  return parts.length > 0 ? parts.join(" / ") : undefined;
}

function pickHoursFromSources(sources: AnyRecord[]): string | undefined {
  const keys = [
    "운영시간",
    "이용시간",
    "영업시간",
    "hours",
    "HOURS",
    "OPENING_HOURS",
  ];
  for (const src of sources) {
    for (const k of keys) {
      const v = src[k];
      const t = formatKeyValueSummary(v);
      if (t) return t;
    }
  }
  return undefined;
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values));
}

function splitList(value: string): string[] {
  return value
    .split(/[,/|·ㆍ•\n\r\t]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function inferCounselingSpecialties(text: string): string[] {
  const rules: Array<[RegExp, string]> = [
    [/미술/, "미술치료"],
    [/놀이/, "놀이치료"],
    [/언어/, "언어치료"],
    [/발달/, "발달검사"],
    [/가족/, "가족치료"],
    [/부모/, "부모상담"],
    [/ADHD|에이디에이치디/i, "ADHD"],
    [/감각/, "감각통합"],
    [/인지/, "인지치료"],
  ];

  const found: string[] = [];
  for (const [re, label] of rules) {
    if (re.test(text)) found.push(label);
  }
  return uniq(found);
}

function inferChildCenterSpecialties(text: string): string[] {
  const rules: Array<[RegExp, string]> = [
    [/방과|돌봄/, "방과후돌봄"],
    [/학습|공부/, "학습지원"],
    [/급식|식사|간식/, "급식지원"],
    [/정서|상담|심리/, "정서지원"],
    [/문화|체험/, "문화체험"],
    [/진로/, "진로체험"],
    [/발달/, "발달검사"],
    [/언어/, "언어재활"],
    [/놀이/, "놀이활동"],
  ];

  const found: string[] = [];
  for (const [re, label] of rules) {
    if (re.test(text)) found.push(label);
  }
  return uniq(found);
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const sa = Math.sin(dLat / 2);
  const sb = Math.sin(dLng / 2);
  const c = sa * sa + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * sb * sb;
  return 2 * R * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

function fnv1a32Update(hash: number, str: string): number {
  let h = hash >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rowsFromJson(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    const obj = json as AnyRecord;
    const candidates = [obj.data, obj.records, obj.items, obj.rows];
    for (const c of candidates) {
      if (Array.isArray(c)) return c as unknown[];
    }
  }
  return [];
}

function expandRowsForKind(
  json: unknown,
  kind: "counseling" | "child",
): unknown[] {
  const base = rowsFromJson(json);
  if (kind !== "counseling") return base;

  // 일부 통합 JSON은 상위 row에 "주변_..._상담소" 배열로 실제 상담소(위도/경도 포함)를 포함합니다.
  const nestedKeyRe = /주변.*상담소|near.*counsel/i;
  const nested: unknown[] = [];
  for (const row of base) {
    if (!row || typeof row !== "object") continue;
    for (const [k, v] of Object.entries(row as AnyRecord)) {
      if (!nestedKeyRe.test(k)) continue;
      if (Array.isArray(v)) nested.push(...v);
    }
  }

  // nested 상담소 배열이 있으면 "상담소 row"만 표시합니다(상위 기관 row는 지도 마커 대상이 아님).
  return nested.length > 0 ? nested : base;
}

function normalizeOpenApiRow(
  row: unknown,
  idx: number,
  kind: "counseling" | "child",
  datasetTag?: string,
): Center | null {
  if (!row || typeof row !== "object") return null;
  const r = row as AnyRecord;
  const sources = collectRecordSources(r);

  const roadAddress = pickStringFromSources(sources, [
    "사업장도로명주소",
    "소재지도로명주소",
    "도로명주소",
    // 일부 지자체 CSV는 도로/지번 구분 없이 '소재지'로만 제공
    "소재지",
    "rdnmadr",
    "roadAddress",
    "REFINE_ROADNM_ADDR",
    "ROADNM_ADDR",
  ]);
  const jibunAddress = pickStringFromSources(sources, [
    "사업장지번주소",
    "소재지지번주소",
    "지번주소",
    "lnmadr",
    "address",
    "REFINE_LOTNO_ADDR",
    "LOTNO_ADDR",
  ]);
  const address =
    roadAddress ||
    jibunAddress ||
    pickStringFromSources(sources, ["주소"]) ||
    "";

  const name =
    pickStringFromSources(sources, [
      "시설명",
      "시설명칭",
      "센터명칭",
      "기관명칭",
      "제공기관명",
      "기관명",
      "센터명",
      "상담소명",
      "사업장명",
      "상호명",
      "name",
      // 지자체 OpenAPI에서 자주 사용하는 키
      "FACLT_NM",
      "INST_NM",
      "BIZPLC_NM",
      "CMPNY_NM",
    ]) ||
    address ||
    `센터 ${idx + 1}`;

  const phone =
    pickStringFromSources(sources, [
      "전화번호",
      "전화",
      "기관연락번호",
      "연락처",
      "phone",
      "telno",
      "TELNO",
      "REFINE_TELNO",
      "WELFARE_FACLT_TELNO",
    ]) || "";

  // 사용자 요청: 이미지에 표시된 특정 항목은 목록/지도에서 제거합니다.
  // (?라지역아동센터 / 의정부시 평화로 449 3층 / 031-875-3009)
  const phoneDigitsForBlock = phone.replace(/[^\d]/g, "");
  const addrNormForBlock = address.replace(/\s+/g, " ").trim();
  if (
    name.trim() === "?라지역아동센터" &&
    (phoneDigitsForBlock === "0318753009" ||
      addrNormForBlock.includes("평화로 449"))
  ) {
    return null;
  }

  const homepageRaw =
    pickStringFromSources(sources, [
      "홈페이지URL",
      "홈페이지_URL",
      "홈페이지 URL",
      "홈페이지 url",
      "홈페이지",
      "홈페이지주소",
      "홈페이지 주소",
      "homepage",
      "homepageUrl",
      "homePage",
      "home_page",
      "HOMEPAGE",
      "HOMEPAGE_URL",
      "WEB_SITE",
      "WEBSITE",
      "website",
      "url",
      "URL",
    ]) ??
    pickStringByRegexFromSources(sources, /홈페이지|home\s?page|website|url/i);

  const normalizeHomepageUrl = (
    raw: string | undefined,
  ): string | undefined => {
    if (!raw) return undefined;
    const s = raw.trim();
    if (!s) return undefined;

    // Filter placeholders (common in public datasets)
    const lower = s.toLowerCase();
    if (
      lower === "www." ||
      lower === "www" ||
      lower === "http://" ||
      lower === "https://"
    )
      return undefined;

    // Already absolute
    if (/^https?:\/\//i.test(s)) return s;
    // Protocol-relative
    if (s.startsWith("//")) return `https:${s}`;
    // Add scheme for common cases
    if (s.startsWith("www.")) return `https://${s}`;
    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(s)) return `https://${s}`;
    return undefined;
  };

  const homepageUrl = normalizeHomepageUrl(homepageRaw);

  const expertRec =
    asRecord(r["전문가소개"]) ||
    asRecord(r["전문가 소개"]) ||
    asRecord(r["전문가_소개"]) ||
    asRecord(r["상담사소개"]) ||
    asRecord(r["상담사 소개"]);
  const expertIntro =
    pickStringFromSources(sources, [
      "전문가소개",
      "전문가 소개",
      "전문가_소개",
      "상담사소개",
      "상담사 소개",
    ]) ??
    pickStringByRegexFromSources(sources, /전문가\s*소개|상담사\s*소개/i) ??
    (expertRec ? formatKeyValueSummary(expertRec) : undefined);

  const reservationRaw =
    pickStringFromSources(sources, [
      "예약링크",
      "예약 링크",
      "예약URL",
      "예약 URL",
      "예약",
      "예약방법",
    ]) ??
    pickStringByRegexFromSources(sources, /예약\s*(?:링크|url|방법|문의)/i);
  const reservationUrl = normalizeHomepageUrl(reservationRaw);
  const reservationText = (() => {
    if (!reservationRaw) return undefined;
    const s = reservationRaw.trim();
    if (!s) return undefined;
    if (reservationUrl) return undefined;
    if (/문의\s*필요|미정|없음|없습니다|제공\s*안함|준비\s*중/i.test(s))
      return undefined;
    return s;
  })();

  const hours =
    pickStringFromSources(sources, [
      "운영시간",
      "이용시간",
      "영업시간",
      "hours",
      "HOURS",
      "OPENING_HOURS",
    ]) ??
    pickStringByRegexFromSources(
      sources,
      /운영\s*시간|영업\s*시간|이용\s*시간/i,
    ) ??
    pickHoursFromSources(sources) ??
    "운영시간 정보 없음";

  const rating =
    pickNumberFromSources(sources, [
      "평점",
      "후기평점",
      "별점",
      "rating",
      "RATE",
      "SCORE",
    ]) ?? 0;
  const reviewCount =
    pickNumberFromSources(sources, [
      "리뷰수",
      "후기수",
      "평가수",
      "reviewCount",
      "REVIEWS",
    ]) ?? 0;

  const distanceNumber =
    pickNumberFromSources(sources, [
      "거리",
      "distance",
      "DISTANCE",
      "distanceKm",
      "distance_km",
    ]) ?? pickNumberByRegexFromSources(sources, /거리|distance/i);
  const distance =
    distanceNumber !== undefined
      ? `${distanceNumber}km`
      : pickStringFromSources(sources, ["거리", "distance", "DISTANCE"]) ||
        "거리 정보 없음";

  const specialtiesRaw =
    pickTextFromSources(sources, [
      "전문분야",
      "상담분야",
      "치료분야",
      "프로그램",
      "서비스내용",
      "주요서비스",
      "specialties",
    ]) ??
    pickTextByRegexFromSources(sources, /(전문|분야|치료|프로그램|서비스)/i);

  const inferred =
    kind === "child"
      ? inferChildCenterSpecialties(
          [name, address, specialtiesRaw ?? ""].join(" "),
        )
      : inferCounselingSpecialties(
          [name, address, specialtiesRaw ?? ""].join(" "),
        );
  const specialties = (() => {
    const parsed = specialtiesRaw ? splitList(specialtiesRaw) : [];
    const base = parsed.length > 0 ? parsed : inferred;
    // 공공데이터 row에 분야/프로그램 정보가 없는 경우에도 카드에서 최소 1개는 보이게 합니다.
    const fallback = kind === "child" ? ["방과후돌봄"] : ["심리상담"];
    const withFallback = base.length > 0 ? base : fallback;
    return uniq(withFallback).slice(0, 24);
  })();

  const lat =
    pickNumberFromSources(sources, [
      "WGS84위도",
      "WGS84 위도",
      "위도",
      "lat",
      "latitude",
      "REFINE_WGS84_LAT",
    ]) ?? pickNumberByRegexFromSources(sources, /위도|lat|latitude/i);
  const lng =
    pickNumberFromSources(sources, [
      "WGS84경도",
      "WGS84 경도",
      "경도",
      "lng",
      "longitude",
      "lon",
      "REFINE_WGS84_LOGT",
      "REFINE_WGS84_LONG",
    ]) ?? pickNumberByRegexFromSources(sources, /경도|lng|lon|longitude|logt/i);

  const latOk = lat !== undefined && lat >= -90 && lat <= 90 ? lat : undefined;
  const lngOk =
    lng !== undefined && lng >= -180 && lng <= 180 ? lng : undefined;

  const datasetTagFromRow =
    typeof r["__dataset"] === "string" ? (r["__dataset"] as string).trim() : "";
  const dataset = (datasetTag && datasetTag.trim()) || datasetTagFromRow;
  const baseId = String(
    r["관리번호"] ??
      r["id"] ??
      r["번호"] ??
      r["연번"] ??
      r["순번"] ??
      `openapi-${idx}`,
  );
  // 공공데이터에서 '연번/번호'가 중복되는 경우가 있어(React key 충돌),
  // row index를 함께 포함해 항상 유니크한 id를 생성합니다.
  const idBase = dataset ? `${dataset}:${baseId}` : baseId;
  const id = `${idBase}:${idx}`;

  const sigun =
    pickStringFromSources(sources, [
      "SIGUN_NM",
      "시군명",
      "시군구명",
      "SIGUNGU_NM",
      "시도명",
      "SIDO_NM",
    ]) || pickStringByRegexFromSources(sources, /시군|시군구|시도|sigun/i);
  const capacity =
    pickNumberFromSources(sources, [
      "FACLT_PSN_CAPA",
      "정원수",
      "정원",
      "수용인원",
      "수용정원",
    ]) ?? pickNumberByRegexFromSources(sources, /정원|수용|capa/i);
  const current =
    pickNumberFromSources(sources, ["현원수", "현원"]) ??
    pickNumberByRegexFromSources(sources, /현원/i);
  const staff =
    pickNumberFromSources(sources, ["종사자수", "종사자"]) ??
    pickNumberByRegexFromSources(sources, /종사자/i);
  const operatorType =
    pickStringFromSources(sources, [
      "운영기관유형",
      "운영기관 유형",
      "운영기관유형명",
      "OPRTR_SE",
    ]) ?? pickStringByRegexFromSources(sources, /운영.*유형|운영\s*기관/i);
  const representative =
    pickStringFromSources(sources, ["대표자명", "대표자"]) ??
    pickStringByRegexFromSources(sources, /대표자/i);
  const provider =
    pickStringFromSources(sources, ["제공기관명", "제공기관"]) ??
    pickStringByRegexFromSources(sources, /제공기관/i);
  const dataStd =
    pickStringFromSources(sources, [
      "데이터기준일자",
      "데이터 기준일자",
      "기준일자",
      "데이터기준일",
      "DATA_STD_DE",
    ]) ?? pickStringByRegexFromSources(sources, /기준일|data\s*std/i);
  const postal =
    pickStringFromSources(sources, [
      "소재지우편번호",
      "우편번호",
      "POST_NO",
      "zip",
      "zipcode",
    ]) ?? pickStringByRegexFromSources(sources, /우편|zip/i);
  const area =
    pickNumberFromSources(sources, ["면적", "면적(m2)", "면적(㎡)", "AREA"]) ??
    pickNumberByRegexFromSources(sources, /면적|area/i);

  const metaLines: string[] = [];
  if (sigun) metaLines.push(`지역: ${sigun}`);
  if (capacity !== undefined) metaLines.push(`정원: ${capacity}명`);
  if (current !== undefined) metaLines.push(`현원: ${current}명`);
  if (staff !== undefined) metaLines.push(`종사자: ${staff}명`);
  if (operatorType) metaLines.push(`운영: ${operatorType}`);
  if (representative) metaLines.push(`대표: ${representative}`);
  if (area !== undefined) metaLines.push(`면적: ${area}㎡`);
  if (dataStd) metaLines.push(`기준일: ${dataStd}`);
  if (provider) metaLines.push(`제공: ${provider}`);
  if (postal) metaLines.push(`우편: ${postal}`);

  const intro =
    pickStringFromSources(sources, [
      "시설소개",
      "시설 소개",
      "기관소개",
      "센터소개",
      "소개",
    ]) ??
    pickStringByRegexFromSources(sources, /(시설|기관|센터)\s*소개|^소개$/i);
  const programs =
    pickStringFromSources(sources, [
      "주요_프로그램",
      "주요 프로그램",
      "주요프로그램",
      "프로그램",
      "프로그램내용",
    ]) ?? pickStringByRegexFromSources(sources, /주요.*프로그램|프로그램/i);
  const applyMethod =
    pickStringFromSources(sources, [
      "이용_신청_방법",
      "이용 신청 방법",
      "이용신청방법",
      "신청방법",
      "신청절차",
      "신청 절차",
      "이용방법",
    ]) ??
    pickStringByRegexFromSources(
      sources,
      /이용.*신청.*방법|신청.*(방법|절차)/i,
    );

  const extras = buildExtras(r);

  // 주소도 좌표도 없으면 스킵
  if (!address && (latOk === undefined || lngOk === undefined)) return null;

  return {
    id,
    name,
    address,
    phone,
    homepageUrl,
    raw: r,
    expertIntro:
      typeof expertIntro === "string" && expertIntro.trim()
        ? expertIntro.trim()
        : undefined,
    reservationUrl,
    reservationText,
    hours,
    rating,
    reviewCount,
    distance,
    specialties,
    lat: latOk,
    lng: lngOk,
    metaLines: metaLines.length > 0 ? metaLines.slice(0, 8) : undefined,
    intro: typeof intro === "string" && intro.trim() ? intro.trim() : undefined,
    programs:
      typeof programs === "string" && programs.trim()
        ? programs.trim()
        : undefined,
    applyMethod:
      typeof applyMethod === "string" && applyMethod.trim()
        ? applyMethod.trim()
        : undefined,
    extras,
    isOpen: true,
  };
}

const counselingCenters: Center[] = [
  {
    id: "1",
    name: "마음숲 아동심리상담센터",
    address: "서울시 강남구 테헤란로 123",
    phone: "02-1234-5678",
    hours: "09:00 - 18:00",
    rating: 4.8,
    reviewCount: 124,
    distance: "0.5km",
    specialties: ["놀이치료", "미술치료", "발달검사"],
    lat: 37.5065,
    lng: 127.0536,
    isOpen: true,
  },
  {
    id: "2",
    name: "행복한 아이 심리센터",
    address: "서울시 강남구 역삼로 456",
    phone: "02-2345-6789",
    hours: "10:00 - 19:00",
    rating: 4.6,
    reviewCount: 89,
    distance: "1.2km",
    specialties: ["언어치료", "미술치료", "부모상담"],
    lat: 37.5,
    lng: 127.04,
    isOpen: true,
  },
  {
    id: "3",
    name: "밝은미래 심리상담소",
    address: "서울시 서초구 서초대로 789",
    phone: "02-3456-7890",
    hours: "09:00 - 20:00",
    rating: 4.9,
    reviewCount: 203,
    distance: "1.8km",
    specialties: ["놀이치료", "가족치료", "ADHD"],
    lat: 37.495,
    lng: 127.03,
    isOpen: false,
  },
  {
    id: "4",
    name: "튼튼마음 아동발달센터",
    address: "서울시 강남구 논현로 321",
    phone: "02-4567-8901",
    hours: "09:30 - 18:30",
    rating: 4.7,
    reviewCount: 156,
    distance: "2.1km",
    specialties: ["발달검사", "감각통합", "미술치료"],
    lat: 37.51,
    lng: 127.06,
    isOpen: true,
  },
  {
    id: "5",
    name: "아이사랑 심리클리닉",
    address: "서울시 송파구 올림픽로 555",
    phone: "02-5678-9012",
    hours: "10:00 - 18:00",
    rating: 4.5,
    reviewCount: 67,
    distance: "3.5km",
    specialties: ["놀이치료", "인지치료", "부모교육"],
    lat: 37.515,
    lng: 127.07,
    isOpen: true,
  },
];

const childCenters: Center[] = [
  {
    id: "c1",
    name: "꿈나무 지역아동센터",
    address: "서울시 강남구 봉은사로 88",
    phone: "02-1111-2222",
    hours: "13:00 - 20:00",
    rating: 4.7,
    reviewCount: 52,
    distance: "0.8km",
    specialties: ["방과후돌봄", "학습지원", "급식지원"],
    lat: 37.5112,
    lng: 127.0582,
    isOpen: true,
  },
  {
    id: "c2",
    name: "새싹이 아동센터",
    address: "서울시 강남구 삼성로 215",
    phone: "02-2222-3333",
    hours: "12:30 - 19:30",
    rating: 4.5,
    reviewCount: 41,
    distance: "1.4km",
    specialties: ["방과후돌봄", "문화체험", "정서지원"],
    lat: 37.508,
    lng: 127.0485,
    isOpen: true,
  },
  {
    id: "c3",
    name: "햇살 아동발달센터",
    address: "서울시 서초구 반포대로 110",
    phone: "02-3333-4444",
    hours: "09:00 - 18:30",
    rating: 4.8,
    reviewCount: 68,
    distance: "2.0km",
    specialties: ["발달검사", "언어재활", "놀이활동"],
    lat: 37.5035,
    lng: 127.0155,
    isOpen: false,
  },
  {
    id: "c4",
    name: "푸른나무 지역아동센터",
    address: "서울시 송파구 백제고분로 210",
    phone: "02-4444-5555",
    hours: "13:00 - 20:30",
    rating: 4.6,
    reviewCount: 37,
    distance: "3.1km",
    specialties: ["학습지원", "진로체험", "급식지원"],
    lat: 37.507,
    lng: 127.098,
    isOpen: true,
  },
  {
    id: "c5",
    name: "나눔 아동센터",
    address: "서울시 강동구 천호대로 1045",
    phone: "02-5555-6666",
    hours: "12:00 - 19:00",
    rating: 4.4,
    reviewCount: 29,
    distance: "4.2km",
    specialties: ["방과후돌봄", "정서지원", "문화체험"],
    lat: 37.546,
    lng: 127.1362,
    isOpen: true,
  },
];

function CenterCard({
  center,
  isSelected,
  onClick,
}: {
  center: Center;
  isSelected: boolean;
  onClick: () => void;
}) {
  const homepageHref = center.homepageUrl;
  const phoneDigits = center.phone?.replace(/[^\d+]/g, "") ?? "";
  const telHref = /\d{5,}/.test(phoneDigits) ? `tel:${phoneDigits}` : undefined;
  const reservationHref =
    center.reservationUrl || (center.reservationText ? telHref : undefined);
  const fallbackHref =
    center.lat != null && center.lng != null
      ? `https://map.kakao.com/link/map/${encodeURIComponent(center.name)},${center.lat},${center.lng}`
      : center.address
        ? `https://map.kakao.com/link/search/${encodeURIComponent(center.address)}`
        : `https://map.kakao.com/link/search/${encodeURIComponent(center.name)}`;
  const linkHref = homepageHref || fallbackHref;
  const linkLabel = homepageHref ? "홈페이지로 이동" : "카카오맵에서 위치 보기";
  const visibleSpecialties = (center.specialties ?? []).slice(0, 6);
  const remainingSpecialties = Math.max(
    0,
    (center.specialties?.length ?? 0) - visibleSpecialties.length,
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rawQuery, setRawQuery] = useState("");
  const [rawKeysOnly, setRawKeysOnly] = useState(true);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const rawView = useMemo(() => {
    if (!detailsOpen || !center.raw) return { text: "", matches: 0 };
    const stripped = stripCoordinatesDeep(center.raw);
    const q = rawQuery.trim().toLowerCase();
    if (!q) return { text: JSON.stringify(stripped, null, 2), matches: 0 };
    const res = filterJsonDeep(stripped, q, rawKeysOnly);
    const emptyFallback = Array.isArray(stripped) ? [] : {};
    return {
      text: JSON.stringify(res?.filtered ?? emptyFallback, null, 2),
      matches: res?.matches ?? 0,
    };
  }, [detailsOpen, center.raw, rawQuery, rawKeysOnly]);

  const handleCopyRaw = async (e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    const text = rawView.text || "";
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("복사됨");
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopyMessage("복사됨");
      } catch {
        setCopyMessage("복사 실패");
      }
    } finally {
      window.setTimeout(() => setCopyMessage(null), 1500);
    }
  };
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{center.name}</h3>
              {center.isOpen ? (
                <Badge className="bg-green-100 text-green-700 text-xs">
                  영업중
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  영업종료
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{center.address}</span>
            </div>

            {center.phone ? (
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{center.phone}</span>
              </div>
            ) : null}

            {center.metaLines && center.metaLines.length > 0 ? (
              <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                {center.metaLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            ) : null}

            {center.expertIntro ? (
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">전문가 소개</span>
                <span className="ml-2">
                  {truncate(center.expertIntro, 120)}
                </span>
              </div>
            ) : null}

            {center.reservationUrl || center.reservationText ? (
              <div className="mt-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">예약 링크</span>
                {reservationHref ? (
                  <a
                    href={reservationHref}
                    target={center.reservationUrl ? "_blank" : undefined}
                    rel={
                      center.reservationUrl ? "noopener noreferrer" : undefined
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="ml-2 text-primary hover:underline underline-offset-4"
                    aria-label="예약 링크"
                    title="예약 링크"
                  >
                    {center.reservationUrl
                      ? "예약 페이지"
                      : (center.reservationText ?? "전화 예약")}
                  </a>
                ) : (
                  <span className="ml-2">{center.reservationText}</span>
                )}
              </div>
            ) : null}

            <div className="flex items-center gap-4 mt-2 text-sm">
              {center.reviewCount > 0 ? (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{center.rating}</span>
                  <span className="text-muted-foreground">
                    ({center.reviewCount})
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Star className="h-4 w-4" />
                  <span className="text-xs">평점 정보 없음</span>
                </span>
              )}
              <span className="flex items-center gap-1 text-muted-foreground">
                <Navigation className="h-3 w-3" />
                {center.distance || "거리 정보 없음"}
              </span>
            </div>

            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{center.hours || "운영시간 정보 없음"}</span>
            </div>

            <div className="flex flex-wrap gap-1 mt-3">
              {visibleSpecialties.map((specialty) => (
                <Badge key={specialty} variant="outline" className="text-xs">
                  {specialty}
                </Badge>
              ))}
              {remainingSpecialties > 0 ? (
                <Badge variant="secondary" className="text-xs">
                  +{remainingSpecialties}
                </Badge>
              ) : null}
            </div>

            {center.intro ||
            center.programs ||
            center.applyMethod ||
            center.expertIntro ||
            center.reservationUrl ||
            center.reservationText ||
            center.raw ||
            (center.extras && center.extras.length > 0) ? (
              <details
                className="mt-3"
                onToggle={(e) => {
                  const open = (e.currentTarget as HTMLDetailsElement).open;
                  setDetailsOpen(open);
                  if (!open) setCopyMessage(null);
                }}
              >
                <summary className="text-sm text-primary cursor-pointer select-none">
                  시설 정보 더보기
                </summary>
                <div className="mt-2 space-y-3 text-sm text-muted-foreground">
                  {center.specialties && center.specialties.length > 0 ? (
                    <div>
                      <div className="text-xs font-medium text-foreground">
                        전문 분야
                      </div>
                      <div className="mt-1 whitespace-pre-line">
                        {center.specialties.join(", ")}
                      </div>
                    </div>
                  ) : null}
                  {center.intro ? (
                    <div>
                      <div className="text-xs font-medium text-foreground">
                        시설소개
                      </div>
                      <div className="mt-1 whitespace-pre-line">
                        {center.intro}
                      </div>
                    </div>
                  ) : null}
                  {center.programs ? (
                    <div>
                      <div className="text-xs font-medium text-foreground">
                        주요 프로그램
                      </div>
                      <div className="mt-1 whitespace-pre-line">
                        {center.programs}
                      </div>
                    </div>
                  ) : null}
                  {center.applyMethod ? (
                    <div>
                      <div className="text-xs font-medium text-foreground">
                        이용 신청 방법
                      </div>
                      <div className="mt-1 whitespace-pre-line">
                        {center.applyMethod}
                      </div>
                    </div>
                  ) : null}
                  {center.expertIntro ? (
                    <div>
                      <div className="text-xs font-medium text-foreground">
                        전문가 소개
                      </div>
                      <div className="mt-1 whitespace-pre-line">
                        {center.expertIntro}
                      </div>
                    </div>
                  ) : null}
                  {center.reservationUrl || center.reservationText ? (
                    <div>
                      <div className="text-xs font-medium text-foreground">
                        예약 링크
                      </div>
                      <div className="mt-1">
                        {reservationHref ? (
                          <a
                            href={reservationHref}
                            target={
                              center.reservationUrl ? "_blank" : undefined
                            }
                            rel={
                              center.reservationUrl
                                ? "noopener noreferrer"
                                : undefined
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary hover:underline underline-offset-4"
                          >
                            {center.reservationUrl
                              ? center.reservationUrl
                              : (center.reservationText ?? "전화 예약")}
                          </a>
                        ) : (
                          <span>{center.reservationText}</span>
                        )}
                      </div>
                    </div>
                  ) : null}
                  {center.extras && center.extras.length > 0 ? (
                    <div>
                      <div className="text-xs font-medium text-foreground">
                        추가 정보
                      </div>
                      <dl className="mt-1 space-y-1">
                        {center.extras.map((item, idx) => (
                          <div
                            key={`${item.label}-${idx}`}
                            className="grid grid-cols-[auto,1fr] gap-2"
                          >
                            <dt className="text-xs text-muted-foreground whitespace-nowrap">
                              {item.label}
                            </dt>
                            <dd className="text-xs text-muted-foreground break-words">
                              {item.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ) : null}
                  {center.raw ? (
                    <div>
                      <div className="text-xs font-medium text-foreground">
                        원본 데이터 (좌표 제외)
                      </div>
                      {detailsOpen ? (
                        <>
                          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Input
                              value={rawQuery}
                              onChange={(e) => setRawQuery(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              placeholder={
                                rawKeysOnly
                                  ? "키 검색 (예: 기본정보, 운영시간)"
                                  : "키/값 검색 (예: 운영시간, 전화번호)"
                              }
                              className="h-8 text-xs"
                            />
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                id={`${center.id}-raw-keys-only`}
                                checked={rawKeysOnly}
                                onCheckedChange={(v) =>
                                  setRawKeysOnly(v === true)
                                }
                              />
                              <label
                                htmlFor={`${center.id}-raw-keys-only`}
                                className="text-xs text-muted-foreground select-none cursor-pointer"
                              >
                                키만
                              </label>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 px-3 text-xs bg-transparent"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRawQuery("");
                              }}
                            >
                              초기화
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 px-3 text-xs bg-transparent"
                              onClick={handleCopyRaw}
                            >
                              복사
                            </Button>
                            {copyMessage ? (
                              <span className="text-xs text-muted-foreground">
                                {copyMessage}
                              </span>
                            ) : null}
                          </div>
                          {rawQuery.trim() ? (
                            <div className="text-xs text-muted-foreground">
                              {rawView.matches > 0
                                ? `일치 ${rawView.matches}개`
                                : "일치 항목 없음"}
                            </div>
                          ) : null}
                          <pre className="mt-2 max-h-80 overflow-auto rounded-md border bg-muted/30 p-3 text-xs text-foreground whitespace-pre-wrap break-words">
                            {rawView.text}
                          </pre>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </details>
            ) : null}
          </div>

          <a
            href={linkHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0"
            aria-label={linkLabel}
            title={linkLabel}
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function CenterFinder() {
  const [activeTab, setActiveTab] = useState<"counseling" | "child">(
    "counseling",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [kakaoLoadError, setKakaoLoadError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [jsonFiles, setJsonFiles] = useState<string[] | null>(null);
  const [jsonFilesError, setJsonFilesError] = useState<string | null>(null);

  const [publicCenters, setPublicCenters] = useState<Center[]>([]);
  const [hasLoadedPublicCenters, setHasLoadedPublicCenters] = useState(false);
  const [isLoadingPublicCenters, setIsLoadingPublicCenters] = useState(false);
  const [publicCentersError, setPublicCentersError] = useState<string | null>(
    null,
  );

  const [publicChildCenters, setPublicChildCenters] = useState<Center[]>([]);
  const [hasLoadedChildCenters, setHasLoadedChildCenters] = useState(false);
  const [isLoadingChildCenters, setIsLoadingChildCenters] = useState(false);
  const [childCentersError, setChildCentersError] = useState<string | null>(
    null,
  );

  const [geocodingProgress, setGeocodingProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // 좌표 자동 보완(지오코딩/검색) 결과를 브라우저에 캐시해 재방문 시 바로 표시합니다.
  const GEO_CACHE_KEY = "aimind:geocode-cache:v1";
  const [geoCacheReady, setGeoCacheReady] = useState(false);
  const geoCacheRef = useRef<Record<string, { lat: number; lng: number }>>({});
  const geoCacheFlushTimerRef = useRef<number | null>(null);

  const [openApiUrlsText, setOpenApiUrlsText] = useState("");
  const [openApiMarkers, setOpenApiMarkers] = useState<OpenApiMarkerPoint[]>(
    [],
  );
  const [openApiMarkersError, setOpenApiMarkersError] = useState<string | null>(
    null,
  );
  const [isLoadingOpenApiMarkers, setIsLoadingOpenApiMarkers] = useState(false);
  const [isOpenApiMode, setIsOpenApiMode] = useState(false);

  const openApiAbortRef = useRef<AbortController | null>(null);
  const openApiRunIdRef = useRef(0);
  const openApiBoundsRef = useRef<any | null>(null);
  const openApiFitTimerRef = useRef<number | null>(null);
  const openApiRenderedCountRef = useRef(0);
  const openApiMapMarkersRef = useRef<any[]>([]);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markersRef = useRef<any[]>([]);
  const markerByCenterIdRef = useRef<Map<string, any>>(new Map());
  const renderedMarkerIdsRef = useRef<Set<string>>(new Set());
  const infoWindowRef = useRef<any | null>(null);
  const geocodedIdsRef = useRef<Set<string>>(new Set());
  const isGeocodingRef = useRef(false);

  const geoCacheKeyFor = (name: string, address: string) =>
    `${name.trim()}|${address.trim()}`.toLowerCase();

  const applyGeoCacheToCenters = (centers: Center[]): Center[] => {
    const cache = geoCacheRef.current;
    if (!cache) return centers;
    if (Object.keys(cache).length === 0) return centers;
    return centers.map((c) => {
      if (c.lat != null && c.lng != null) return c;
      const key = geoCacheKeyFor(c.name, c.address);
      const hit = cache[key];
      return hit ? { ...c, lat: hit.lat, lng: hit.lng } : c;
    });
  };

  const scheduleGeoCacheFlush = () => {
    if (geoCacheFlushTimerRef.current != null) return;
    geoCacheFlushTimerRef.current = window.setTimeout(() => {
      geoCacheFlushTimerRef.current = null;
      try {
        localStorage.setItem(
          GEO_CACHE_KEY,
          JSON.stringify(geoCacheRef.current),
        );
      } catch {
        // ignore
      }
    }, 800);
  };

  const storeGeoCache = (
    center: Center,
    coords: { lat: number; lng: number },
  ) => {
    if (!center.address) return;
    const key = geoCacheKeyFor(center.name, center.address);
    if (!key) return;
    geoCacheRef.current[key] = coords;
    scheduleGeoCacheFlush();
  };

  useEffect(() => {
    return () => {
      try {
        openApiAbortRef.current?.abort();
      } catch {
        // ignore
      }
      try {
        if (openApiFitTimerRef.current != null) {
          window.clearTimeout(openApiFitTimerRef.current);
          openApiFitTimerRef.current = null;
        }
      } catch {
        // ignore
      }
      try {
        if (geoCacheFlushTimerRef.current != null) {
          window.clearTimeout(geoCacheFlushTimerRef.current);
          geoCacheFlushTimerRef.current = null;
        }
      } catch {
        // ignore
      }
    };
  }, []);

  // 지오코딩 캐시 로드(재방문 시 즉시 마커 표시)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(GEO_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const next: Record<string, { lat: number; lng: number }> = {};
          for (const [k, v] of Object.entries(
            parsed as Record<string, unknown>,
          )) {
            if (!k) continue;
            if (!v || typeof v !== "object" || Array.isArray(v)) continue;
            const vv = v as Record<string, unknown>;
            const lat =
              typeof vv.lat === "number"
                ? vv.lat
                : typeof vv.lat === "string"
                  ? Number.parseFloat(vv.lat)
                  : NaN;
            const lng =
              typeof vv.lng === "number"
                ? vv.lng
                : typeof vv.lng === "string"
                  ? Number.parseFloat(vv.lng)
                  : NaN;
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
            next[k] = { lat, lng };
          }
          geoCacheRef.current = next;
          // 이미 로드된 데이터에도 캐시를 즉시 적용
          setPublicCenters((prev) => applyGeoCacheToCenters(prev));
          setPublicChildCenters((prev) => applyGeoCacheToCenters(prev));
        }
      }
    } catch {
      // ignore
    } finally {
      setGeoCacheReady(true);
    }
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => setUserLocation(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadJsonIndex() {
      try {
        setJsonFilesError(null);
        const res = await fetch("/api/kakao-map-key?list=1");
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || `HTTP ${res.status}`);
        }
        const filesRaw: unknown = data?.files;
        const files = Array.isArray(filesRaw)
          ? filesRaw
              .filter((f): f is string => typeof f === "string")
              .map((f) => f.trim())
              .filter(Boolean)
          : [];
        if (!cancelled) setJsonFiles(files);
      } catch (e) {
        if (cancelled) return;
        setJsonFilesError(e instanceof Error ? e.message : String(e));
        setJsonFiles([]);
      }
    }

    loadJsonIndex();
    return () => {
      cancelled = true;
    };
  }, []);

  const counselingData = publicCentersError
    ? counselingCenters
    : hasLoadedPublicCenters
      ? publicCenters
      : [];
  const childData = childCentersError
    ? childCenters
    : hasLoadedChildCenters
      ? publicChildCenters
      : [];

  const centers = useMemo(() => {
    // 탭 요구사항
    // - 주변 상담소: "아동심리 상담소"만 표시
    // - 주변 아동센터: 상담소를 제외한 지역아동센터 데이터만 표시
    return activeTab === "counseling" ? counselingData : childData;
  }, [activeTab, counselingData, childData]);

  const isLoadingActive =
    (jsonFiles === null && !jsonFilesError) ||
    (activeTab === "counseling"
      ? isLoadingPublicCenters
      : isLoadingChildCenters);
  const activeError = jsonFilesError
    ? `JSON 파일 목록을 불러오지 못했습니다 - ${jsonFilesError}`
    : activeTab === "counseling"
      ? publicCentersError
      : childCentersError;
  const centerLabel = activeTab === "counseling" ? "상담소" : "아동센터";

  const centersWithDistance = useMemo(() => {
    if (!userLocation) {
      return centers.map((c) => ({
        ...c,
        distance: c.distance || "거리 정보 없음",
      }));
    }

    return centers.map((c) => {
      if (c.lat == null || c.lng == null) {
        return { ...c, distance: c.distance || "거리 정보 없음" };
      }
      const km = haversineKm(userLocation.lat, userLocation.lng, c.lat, c.lng);
      return {
        ...c,
        distance: Number.isFinite(km)
          ? `${km.toFixed(1)}km`
          : c.distance || "거리 정보 없음",
      };
    });
  }, [centers, userLocation]);

  const filteredCenters = useMemo(() => {
    const rawQ = searchQuery.trim();
    const q = rawQ.toLowerCase();
    const qTokens = rawQ
      .split(/[\s,|/·ㆍ•\n\r\t]+/g)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const parseKm = (distance: string): number => {
      const n = Number.parseFloat(distance);
      return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
    };

    const buildSearchText = (center: Center): string => {
      const extrasText = (center.extras ?? [])
        .map((e) => `${e.label} ${e.value}`)
        .join(" ");
      return [
        center.name,
        center.address,
        center.phone,
        center.hours,
        (center.specialties ?? []).join(" "),
        (center.metaLines ?? []).join(" "),
        center.intro ?? "",
        center.programs ?? "",
        center.applyMethod ?? "",
        center.expertIntro ?? "",
        center.reservationUrl ?? "",
        center.reservationText ?? "",
        extrasText,
      ]
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
    };

    const specialtyMatchScore = (center: Center): number => {
      if (qTokens.length === 0) return 0;
      const specText = (center.specialties ?? []).join(" ").toLowerCase();
      let score = 0;
      for (const t of qTokens) {
        if (!t) continue;
        if (specText.includes(t)) score += 2;
      }
      return score;
    };

    const list = centersWithDistance
      .map((center) => {
        const searchText = buildSearchText(center);
        const matchesSearch = !q || searchText.includes(q);
        return {
          center,
          matchesSearch,
          distKm: parseKm(center.distance),
          specScore: specialtyMatchScore(center),
        };
      })
      .filter((x) => x.matchesSearch)
      .sort((a, b) => {
        // 검색어가 전문 분야와 일치하면 우선순위로 노출
        if (qTokens.length > 0 && a.specScore !== b.specScore) {
          return b.specScore - a.specScore;
        }

        // 기본: 거리순(가까운 순) → 평점 높은 순(추천)
        const aInf = !Number.isFinite(a.distKm);
        const bInf = !Number.isFinite(b.distKm);
        if (aInf !== bInf) return aInf ? 1 : -1;
        if (!aInf && !bInf && a.distKm !== b.distKm) return a.distKm - b.distKm;
        if (b.center.rating !== a.center.rating)
          return b.center.rating - a.center.rating;
        return a.center.name.localeCompare(b.center.name, "ko");
      })
      .map((x) => x.center);

    return list;
  }, [centersWithDistance, searchQuery]);

  // 사용자 요구사항: JSON 데이터 전체를 표시합니다(성능은 데이터 크기에 따라 영향이 있을 수 있습니다).
  // 좌표가 없는 항목은 지도에 표시되지 않지만, (가능하면) 주소 지오코딩으로 좌표를 채워
  // 지도 마커로 표시될 수 있도록 별도 effect에서 처리합니다.
  const visibleCenters = useMemo(() => filteredCenters, [filteredCenters]);
  const isTruncatedCenters = false;
  const markerableVisibleCount = useMemo(
    () => visibleCenters.filter((c) => c.lat != null && c.lng != null).length,
    [visibleCenters],
  );
  const markerlessVisibleCount = Math.max(
    0,
    visibleCenters.length - markerableVisibleCount,
  );

  const visibleCentersKey = useMemo(() => {
    // useEffect deps에 배열을 직접(또는 spread) 넣으면 길이가 변할 수 있어
    // "항상 고정 길이" deps로 만들기 위한 키(해시)로 변환합니다.
    let h = 2166136261;
    for (const c of visibleCenters) {
      h = fnv1a32Update(h, c.id);
      // separator
      h ^= 0xff;
      h = Math.imul(h, 16777619);
    }
    return `${visibleCenters.length}:${h >>> 0}`;
  }, [visibleCenters]);

  const loadMarkersFromOpenApi = async () => {
    const urls = parseUrlsFromText(openApiUrlsText);
    if (urls.length === 0) {
      setOpenApiMarkersError("URI를 입력해주세요.");
      setOpenApiMarkers([]);
      return;
    }

    try {
      openApiAbortRef.current?.abort();
    } catch {
      // ignore
    }

    const controller = new AbortController();
    openApiAbortRef.current = controller;
    const runId = (openApiRunIdRef.current += 1);

    setIsLoadingOpenApiMarkers(true);
    setOpenApiMarkersError(null);
    setOpenApiMarkers([]);
    setIsOpenApiMode(true);

    // 기존(로컬/이전 OpenAPI) 마커를 모두 제거하고 OpenAPI 모드로 전환합니다.
    openApiRenderedCountRef.current = 0;
    openApiBoundsRef.current = null;
    try {
      if (openApiFitTimerRef.current != null) {
        window.clearTimeout(openApiFitTimerRef.current);
        openApiFitTimerRef.current = null;
      }
    } catch {
      // ignore
    }
    try {
      openApiMapMarkersRef.current.forEach((m) => m.setMap(null));
    } catch {
      // ignore
    }
    openApiMapMarkersRef.current = [];

    try {
      markersRef.current.forEach((m) => m.setMap(null));
    } catch {
      // ignore
    }
    markersRef.current = [];
    markerByCenterIdRef.current.clear();
    renderedMarkerIdsRef.current.clear();
    try {
      infoWindowRef.current?.close();
    } catch {
      // ignore
    }

    let seq = 0;
    let addedCount = 0;
    const seen = new Set<string>();

    let pending: OpenApiMarkerPoint[] = [];
    let flushTimer: number | null = null;

    const flushPending = () => {
      if (pending.length === 0) return;
      const batch = pending;
      pending = [];
      setOpenApiMarkers((prev) => prev.concat(batch));
    };

    const enqueuePoints = (pts: Array<Omit<OpenApiMarkerPoint, "id">>) => {
      for (const p of pts) {
        const key = `${p.lat.toFixed(6)},${p.lng.toFixed(6)},${p.title}`;
        if (seen.has(key)) continue;
        seen.add(key);
        pending.push({
          id: `openapi-${seq++}`,
          lat: p.lat,
          lng: p.lng,
          title: p.title,
          url: p.url,
        });
        addedCount += 1;
      }

      if (flushTimer == null) {
        flushTimer = window.setTimeout(() => {
          flushTimer = null;
          flushPending();
        }, 80);
      }
    };

    type FallbackTask = { url: string; keyword: string };
    const fallbackQueue: FallbackTask[] = [];
    const fallbackSeen = new Set<string>();
    let streamDone = false;

    const cleanKeyword = (raw: string) =>
      raw
        .replace(/\s+/g, " ")
        .replace(/\u00a0/g, " ")
        .trim()
        .replace(/\s*[:：]\s*네이버\s*블로그\s*$/i, "")
        .replace(/\s*-\s*네이버\s*블로그\s*$/i, "")
        .replace(/\s*[:：]\s*NAVER\s*Blog\s*$/i, "")
        .replace(/\s*-\s*NAVER\s*Blog\s*$/i, "")
        .replace(/\s*\|\s*.*$/, "")
        .trim();

    const keywordFromUrl = (u: string): string => {
      const s = u.trim().replace(/\s+/g, "");
      const m = s.match(/^(?:https?:\/\/)?([^\/?#]+)/i);
      const host = (m?.[1] || s).replace(/^www\./i, "");
      return host || s;
    };

    const enqueueFallbackUrl = (u: string, keywordHint?: string) => {
      const s = u.trim();
      if (!s) return;
      const k = s.toLowerCase();
      if (fallbackSeen.has(k)) return;
      fallbackSeen.add(k);
      const kw = cleanKeyword(keywordHint || "") || keywordFromUrl(s);
      fallbackQueue.push({ url: s, keyword: kw });
    };

    type AddressTask = { address: string; title: string; url?: string };
    const addressQueue: AddressTask[] = [];
    const addressSeen = new Set<string>();

    const enqueueAddressTask = (t: AddressTask) => {
      const addr = String(t.address || "").trim();
      if (!addr) return;
      const key = addr.toLowerCase();
      if (addressSeen.has(key)) return;
      addressSeen.add(key);
      const title = cleanKeyword(String(t.title || "")) || addr;
      addressQueue.push({ address: addr, title, url: t.url });
    };

    const wait = (ms: number) =>
      new Promise<void>((resolve) => window.setTimeout(resolve, ms));

    const runGeocodeFallback = async () => {
      const startedAt = Date.now();
      while (!controller.signal.aborted) {
        const kakaoAny = window.kakao as unknown as any;
        const services = kakaoAny?.maps?.services;
        const GeocoderCtor = services?.Geocoder;
        const PlacesCtor = services?.Places;
        const StatusOk = services?.Status?.OK;
        if (GeocoderCtor && StatusOk) {
          const geocoder = new GeocoderCtor();
          const places = PlacesCtor ? new PlacesCtor() : null;

          const geocodeOne = (address: string) =>
            new Promise<Omit<OpenApiMarkerPoint, "id"> | null>((resolve) => {
              geocoder.addressSearch(
                address,
                (result: any[], status: string) => {
                  if (
                    status === StatusOk &&
                    Array.isArray(result) &&
                    result[0]
                  ) {
                    const lat = Number.parseFloat(result[0].y);
                    const lng = Number.parseFloat(result[0].x);
                    if (Number.isFinite(lat) && Number.isFinite(lng)) {
                      resolve({ lat, lng, title: address });
                      return;
                    }
                  }
                  resolve(null);
                },
              );
            });

          const keywordOne = (keyword: string) =>
            new Promise<Omit<OpenApiMarkerPoint, "id"> | null>((resolve) => {
              if (!places) return resolve(null);
              places.keywordSearch(
                keyword,
                (data: any[], status: string) => {
                  if (status === StatusOk && Array.isArray(data) && data[0]) {
                    const lat = Number.parseFloat(data[0].y);
                    const lng = Number.parseFloat(data[0].x);
                    if (Number.isFinite(lat) && Number.isFinite(lng)) {
                      resolve({
                        lat,
                        lng,
                        title: String(data[0].place_name || keyword),
                        url:
                          typeof data[0].place_url === "string"
                            ? data[0].place_url
                            : undefined,
                      });
                      return;
                    }
                  }
                  resolve(null);
                },
                { size: 1 },
              );
            });

          const worker = async () => {
            while (!controller.signal.aborted) {
              const task = addressQueue.shift();
              if (!task) {
                if (streamDone) break;
                await wait(200);
                continue;
              }
              const p =
                (await geocodeOne(task.address)) ||
                (await keywordOne(
                  [task.title, task.address].filter(Boolean).join(" "),
                )) ||
                (await keywordOne(task.title));
              if (p) {
                enqueuePoints([
                  {
                    lat: p.lat,
                    lng: p.lng,
                    title: task.title || p.title,
                    url: task.url,
                  },
                ]);
              }
              await wait(70);
            }
          };

          const concurrency = 10;
          await Promise.all(
            Array.from({ length: concurrency }, () => worker()),
          );
          return;
        }

        if (streamDone && Date.now() - startedAt > 5000) return;
        if (streamDone && addressQueue.length === 0) return;
        await wait(150);
      }
    };

    const runPlacesFallback = async () => {
      const startedAt = Date.now();
      while (!controller.signal.aborted) {
        const kakaoAny = window.kakao as unknown as any;
        const services = kakaoAny?.maps?.services;
        const PlacesCtor = services?.Places;
        const StatusOk = services?.Status?.OK;
        if (PlacesCtor && StatusOk) {
          const places = new PlacesCtor();

          const searchOne = (keyword: string) =>
            new Promise<Omit<OpenApiMarkerPoint, "id"> | null>((resolve) => {
              places.keywordSearch(
                keyword,
                (data: any[], status: string) => {
                  if (status === StatusOk && Array.isArray(data) && data[0]) {
                    const lat = Number.parseFloat(data[0].y);
                    const lng = Number.parseFloat(data[0].x);
                    if (Number.isFinite(lat) && Number.isFinite(lng)) {
                      resolve({
                        lat,
                        lng,
                        title: String(data[0].place_name || keyword),
                        url:
                          typeof data[0].place_url === "string"
                            ? data[0].place_url
                            : undefined,
                      });
                      return;
                    }
                  }
                  resolve(null);
                },
                { size: 1 },
              );
            });

          const worker = async () => {
            while (!controller.signal.aborted) {
              const task = fallbackQueue.shift();
              if (!task) {
                if (streamDone) break;
                await wait(200);
                continue;
              }
              const p = await searchOne(task.keyword);
              if (p) enqueuePoints([p]);
              await wait(60);
            }
          };

          const concurrency = 20;
          await Promise.all(
            Array.from({ length: concurrency }, () => worker()),
          );
          return;
        }

        if (streamDone && Date.now() - startedAt > 5000) return;
        if (streamDone && fallbackQueue.length === 0) return;
        await wait(150);
      }
    };

    const geocodePromise = runGeocodeFallback();
    const fallbackPromise = runPlacesFallback();

    try {
      const res = await fetch("/api/openapi-fetch?stream=1", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "text/event-stream",
        },
        body: JSON.stringify({
          urls,
          concurrency: Math.min(200, Math.max(1, urls.length)),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || `HTTP ${res.status}`);
      }
      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const handleFetchResult = (result: unknown) => {
        if (!result || typeof result !== "object") return;
        const rr = result as AnyRecord;
        const urlRaw = typeof rr.url === "string" ? rr.url : "";
        const titleRaw = typeof rr.title === "string" ? rr.title : "";

        if (rr.ok !== true) {
          if (urlRaw) enqueueFallbackUrl(urlRaw, titleRaw);
          return;
        }

        const extracted = extractOpenApiMarkers(rr.json);
        if (extracted.length > 0) enqueuePoints(extracted);

        const geocodeTasks = extractOpenApiGeocodeTasks(rr.json);
        if (geocodeTasks.length > 0) {
          geocodeTasks.forEach((t) => enqueueAddressTask(t));
        }

        if (extracted.length === 0 && geocodeTasks.length === 0 && urlRaw) {
          enqueueFallbackUrl(urlRaw, titleRaw);
        }
      };

      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          const lines = rawEvent.split(/\r?\n/);
          let eventType = "message";
          const dataLines: string[] = [];
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataLines.push(line.slice(5).trimStart());
            }
          }

          if (eventType === "done") {
            streamDone = true;
            continue;
          }
          if (eventType === "result") {
            const dataStr = dataLines.join("\n");
            if (!dataStr) continue;
            try {
              handleFetchResult(JSON.parse(dataStr));
            } catch {
              // ignore
            }
            continue;
          }
          if (eventType === "error") {
            const dataStr = dataLines.join("\n");
            if (!dataStr) continue;
            try {
              const payload = JSON.parse(dataStr) as { error?: string };
              if (payload?.error) setOpenApiMarkersError(payload.error);
            } catch {
              // ignore
            }
          }
        }
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        setOpenApiMarkersError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      streamDone = true;
      await geocodePromise.catch(() => null);
      await fallbackPromise.catch(() => null);
      if (flushTimer != null) {
        window.clearTimeout(flushTimer);
        flushTimer = null;
      }
      flushPending();

      if (runId === openApiRunIdRef.current) {
        setIsLoadingOpenApiMarkers(false);
        if (addedCount === 0 && !controller.signal.aborted) {
          setOpenApiMarkersError(
            (prev) =>
              prev ||
              "좌표를 찾지 못했습니다. (JSON 좌표/주소 지오코딩/Places 검색 실패)",
          );
        }
      }
    }
  };

  const clearOpenApiMarkers = () => {
    try {
      openApiAbortRef.current?.abort();
    } catch {
      // ignore
    }
    openApiAbortRef.current = null;
    setIsLoadingOpenApiMarkers(false);
    setOpenApiMarkers([]);
    setOpenApiMarkersError(null);
    setIsOpenApiMode(false);

    try {
      if (openApiFitTimerRef.current != null) {
        window.clearTimeout(openApiFitTimerRef.current);
        openApiFitTimerRef.current = null;
      }
    } catch {
      // ignore
    }
    try {
      openApiMapMarkersRef.current.forEach((m) => m.setMap(null));
    } catch {
      // ignore
    }
    openApiMapMarkersRef.current = [];
    openApiRenderedCountRef.current = 0;
    openApiBoundsRef.current = null;
    try {
      infoWindowRef.current?.close();
    } catch {
      // ignore
    }
  };

  const handleCenterSelect = (center: Center) => {
    setSelectedCenter(center);

    const kakao = window.kakao;
    if (!kakao?.maps) return;

    if (mapInstanceRef.current && center.lat != null && center.lng != null) {
      const moveLatLon = new kakao.maps.LatLng(center.lat, center.lng);
      mapInstanceRef.current.panTo(moveLatLon);
    }
  };

  useEffect(() => {
    if (jsonFiles === null) return;
    const files = jsonFiles;
    if (hasLoadedPublicCenters || isLoadingPublicCenters) return;
    let cancelled = false;

    async function load() {
      setIsLoadingPublicCenters(true);
      setPublicCentersError(null);

      try {
        // "주변 상담소"는 아동심리상담소 데이터만 노출합니다.
        const counselingFileRe = /아동[\s_]*심리[\s_]*상담/i;
        const excludeChildFileRe = /아동\s*센터|아동센터|지역아동센터/i;
        const datasets = files
          .filter((file) => !/\(\d+\)\.json$/i.test(file))
          .filter(
            (file) =>
              counselingFileRe.test(file) && !excludeChildFileRe.test(file),
          )
          .map((file) => ({
            file,
            tag: file.replace(/_enriched\.json$/i, ""),
          }));

        if (datasets.length === 0) {
          throw new Error("No counseling JSON files found in /json");
        }

        const results = await Promise.all(
          datasets.map(async (d) => {
            const res = await fetch(
              `/api/kakao-map-key?file=${encodeURIComponent(d.file)}`,
            );
            const json = await res.json().catch(() => null);
            if (!res.ok || json == null) {
              throw new Error(
                `[${d.file}] failed to load (HTTP ${res.status})`,
              );
            }
            const rows = expandRowsForKind(json, "counseling");
            return { tag: d.tag, rows };
          }),
        );

        const merged = results.flatMap(({ tag, rows }) =>
          rows
            .map((r, idx) => normalizeOpenApiRow(r, idx, "counseling", tag))
            .filter((c): c is Center => Boolean(c)),
        );

        const normalized = dedupCenters(merged);

        if (cancelled) return;

        geocodedIdsRef.current.clear();
        setPublicCenters(applyGeoCacheToCenters(normalized));
        setHasLoadedPublicCenters(true);
      } catch (e) {
        if (cancelled) return;
        setPublicCentersError(
          e instanceof Error ? e.message : "Failed to load JSON centers",
        );
        setPublicCenters([]);
        // 에러 시에는 샘플 데이터로 대체하되, 재시도 루프(무한 fetch)를 막기 위해 loaded로 처리합니다.
        setHasLoadedPublicCenters(true);
      } finally {
        if (!cancelled) setIsLoadingPublicCenters(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [jsonFiles, hasLoadedPublicCenters]);

  useEffect(() => {
    if (activeTab !== "child") return;
    if (jsonFiles === null) return;
    const files = jsonFiles;
    if (hasLoadedChildCenters || isLoadingChildCenters) return;
    let cancelled = false;

    async function load() {
      setIsLoadingChildCenters(true);
      setChildCentersError(null);

      try {
        const childFileRe =
          /아동\s*센터|지역\s*아동\s*센터|아동센터|지역아동센터/i;
        const datasets = files
          .filter((file) => !/\(\d+\)\.json$/i.test(file))
          .filter((file) => childFileRe.test(file))
          .map((file) => ({
            file,
            tag: file.replace(/_enriched\.json$/i, ""),
          }));

        if (datasets.length === 0) {
          throw new Error("No child-center JSON files found in /json");
        }

        const results = await Promise.all(
          datasets.map(async (d) => {
            const res = await fetch(
              `/api/kakao-map-key?file=${encodeURIComponent(d.file)}`,
            );
            const json = await res.json().catch(() => null);
            if (!res.ok || json == null) {
              throw new Error(
                `[${d.file}] failed to load (HTTP ${res.status})`,
              );
            }
            const rows = expandRowsForKind(json, "child").filter((r) => {
              if (!r || typeof r !== "object") return false;
              const rr = r as AnyRecord;
              const t = pickString(rr, [
                "기관유형",
                "시설유형",
                "구분",
                "type",
                "TYPE",
              ]);
              // 혼합 데이터셋에서 "심리상담소" 등 상담소 row는 child 탭의 주데이터에서 제외합니다.
              if (t && /심리|상담/i.test(t) && !/아동|지역아동/i.test(t))
                return false;
              return true;
            });
            return { tag: d.tag, rows };
          }),
        );

        const merged = results.flatMap(({ tag, rows }) =>
          rows
            .map((r, idx) => normalizeOpenApiRow(r, idx, "child", tag))
            .filter((c): c is Center => Boolean(c)),
        );

        const normalized = dedupCenters(merged);

        if (cancelled) return;

        geocodedIdsRef.current.clear();
        setPublicChildCenters(applyGeoCacheToCenters(normalized));
        setHasLoadedChildCenters(true);
      } catch (e) {
        if (cancelled) return;
        setChildCentersError(
          e instanceof Error ? e.message : "Failed to load JSON child centers",
        );
        setPublicChildCenters([]);
        // 에러 시에는 샘플 데이터로 대체하되, 재시도 루프(무한 fetch)를 막기 위해 loaded로 처리합니다.
        setHasLoadedChildCenters(true);
      } finally {
        if (!cancelled) setIsLoadingChildCenters(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab, jsonFiles, hasLoadedChildCenters]);

  useEffect(() => {
    if (!mapLoaded) return;
    if (!geoCacheReady) return;
    if (isOpenApiMode) return;
    if (isGeocodingRef.current) return;

    const kakaoAny = window.kakao as unknown as any;
    const services = kakaoAny?.maps?.services;
    if (!services?.Geocoder) return;
    const StatusOk: string | undefined = services?.Status?.OK;
    if (!StatusOk) return;
    const PlacesCtor = services?.Places as (new () => any) | undefined;

    // 현재 화면에 보이는(필터/검색 적용) 항목만 대상으로 처리합니다.
    const visibleIds = new Set(visibleCenters.map((c) => c.id));
    const source =
      activeTab === "counseling" ? ("public" as const) : ("child" as const);
    const activeCenters =
      activeTab === "counseling" ? publicCenters : publicChildCenters;

    const tasks: Array<{ source: "public" | "child"; center: Center }> =
      activeCenters
        .filter(
          (c) =>
            visibleIds.has(c.id) &&
            (c.lat == null || c.lng == null) &&
            !geocodedIdsRef.current.has(c.id),
        )
        .map((center) => ({ source, center }));

    if (tasks.length === 0) return;

    let cancelled = false;
    isGeocodingRef.current = true;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => window.setTimeout(resolve, ms));

    const geocodeOnce = (geocoder: any, address: string) =>
      new Promise<{ lat: number; lng: number } | null>((resolve) => {
        const a = String(address || "").trim();
        if (!a) return resolve(null);
        geocoder.addressSearch(a, (result: any[], status: string) => {
          if (status === StatusOk && result && result[0]) {
            const lat = Number.parseFloat(result[0].y);
            const lng = Number.parseFloat(result[0].x);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
              resolve({ lat, lng });
              return;
            }
          }
          resolve(null);
        });
      });

    const geocode = async (geocoder: any, address: string) => {
      const first = await geocodeOnce(geocoder, address);
      if (first) return first;
      await wait(140);
      return await geocodeOnce(geocoder, address);
    };

    const keywordOnce = (places: any, keyword: string) =>
      new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (!places) return resolve(null);
        const kw = String(keyword || "").trim();
        if (!kw) return resolve(null);
        places.keywordSearch(
          kw,
          (data: any[], status: string) => {
            if (status === StatusOk && Array.isArray(data) && data[0]) {
              const lat = Number.parseFloat(data[0].y);
              const lng = Number.parseFloat(data[0].x);
              if (Number.isFinite(lat) && Number.isFinite(lng)) {
                resolve({ lat, lng });
                return;
              }
            }
            resolve(null);
          },
          { size: 1 },
        );
      });

    const keywordSearch = async (places: any, keyword: string) => {
      const first = await keywordOnce(places, keyword);
      if (first) return first;
      await wait(140);
      return await keywordOnce(places, keyword);
    };

    const updatesPublic = new Map<string, { lat: number; lng: number }>();
    const updatesChild = new Map<string, { lat: number; lng: number }>();
    let done = 0;

    let flushTimer: number | null = null;
    const doFlush = () => {
      if (cancelled) return;
      const total = tasks.length;
      setGeocodingProgress({ current: done, total });

      if (updatesPublic.size > 0) {
        const batch = new Map(updatesPublic);
        updatesPublic.clear();
        setPublicCenters((prev) =>
          prev.map((c) => {
            const u = batch.get(c.id);
            return u ? { ...c, lat: u.lat, lng: u.lng } : c;
          }),
        );
      }

      if (updatesChild.size > 0) {
        const batch = new Map(updatesChild);
        updatesChild.clear();
        setPublicChildCenters((prev) =>
          prev.map((c) => {
            const u = batch.get(c.id);
            return u ? { ...c, lat: u.lat, lng: u.lng } : c;
          }),
        );
      }
    };

    const scheduleFlush = () => {
      if (flushTimer != null) return;
      flushTimer = window.setTimeout(() => {
        flushTimer = null;
        doFlush();
      }, 120);
    };

    let nextIndex = 0;
    const worker = async () => {
      const geocoder = new services.Geocoder();
      const places = PlacesCtor ? new PlacesCtor() : null;

      while (!cancelled) {
        const i = nextIndex;
        nextIndex += 1;
        if (i >= tasks.length) break;

        const { source, center } = tasks[i];
        if (cancelled) break;

        if (geocodedIdsRef.current.has(center.id)) {
          done += 1;
          scheduleFlush();
          continue;
        }
        geocodedIdsRef.current.add(center.id);

        const cached = center.address
          ? geoCacheRef.current[geoCacheKeyFor(center.name, center.address)]
          : undefined;

        let coords =
          cached ??
          (center.address ? await geocode(geocoder, center.address) : null);
        if (!coords) {
          const keyword = [center.name, center.address]
            .filter(Boolean)
            .join(" ");
          coords = await keywordSearch(places, keyword);
          if (!coords && center.name)
            coords = await keywordSearch(places, center.name);
        }

        if (coords) {
          if (source === "public") updatesPublic.set(center.id, coords);
          else updatesChild.set(center.id, coords);
          storeGeoCache(center, coords);
        }

        done += 1;
        scheduleFlush();
        // 과도한 호출로 실패가 누적되는 것을 막기 위해 적당한 pacing 적용
        await wait(90);
      }
    };

    (async () => {
      setGeocodingProgress({ current: 0, total: tasks.length });
      // 너무 높은 동시성은 Kakao 서비스 제한으로 실패가 늘어날 수 있어 보수적으로 설정합니다.
      const concurrency = Math.min(
        6,
        Math.max(2, Math.ceil(tasks.length / 400)),
      );
      await Promise.all(Array.from({ length: concurrency }, () => worker()));
    })()
      .catch(() => null)
      .finally(() => {
        isGeocodingRef.current = false;
        if (cancelled) return;
        try {
          if (flushTimer != null) window.clearTimeout(flushTimer);
        } catch {
          // ignore
        }
        flushTimer = null;
        doFlush();
        setGeocodingProgress(null);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, mapLoaded, geoCacheReady, visibleCentersKey, isOpenApiMode]);

  useEffect(() => {
    let cancelled = false;

    async function loadKakaoMap() {
      try {
        setKakaoLoadError(null);
        const response = await fetch("/api/kakao-map-key");
        const data = await response.json().catch(() => null);

        const apiKey = data?.apiKey;
        if (!apiKey) {
          const msg = String(
            data?.error || data?.message || "Kakao API key not configured",
          );
          if (!cancelled)
            setKakaoLoadError(
              `카카오 지도 API 키를 불러오지 못했습니다. (${msg})`,
            );
          console.error("Kakao API key not configured:", msg);
          return;
        }

        if (window.kakao?.maps) {
          window.kakao.maps.load(() => {
            if (!cancelled) setMapLoaded(true);
          });
          return;
        }

        const existing = document.querySelector(
          'script[data-kakao-maps-sdk="true"]',
        ) as HTMLScriptElement | null;

        if (existing) {
          if (window.kakao?.maps) {
            window.kakao.maps.load(() => {
              if (!cancelled) setMapLoaded(true);
            });
            return;
          }
          existing.addEventListener(
            "load",
            () => {
              if (window.kakao?.maps && !cancelled) {
                window.kakao.maps.load(() => setMapLoaded(true));
              }
            },
            { once: true },
          );
          return;
        }

        const script = document.createElement("script");
        script.setAttribute("data-kakao-maps-sdk", "true");
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`;
        script.async = true;

        script.onerror = () => {
          if (!cancelled) {
            setKakaoLoadError(
              `카카오 지도 SDK 로드에 실패했습니다. Kakao Developers에서 Web 도메인 등록을 확인해주세요. (현재: ${window.location.origin})`,
            );
          }
          console.error(
            "Failed to load Kakao Maps SDK. Check Kakao Developers Web domain:",
            window.location.origin,
          );
        };

        script.onload = () => {
          if (!window.kakao?.maps) {
            console.error(
              "Kakao SDK script loaded but window.kakao.maps is missing.",
            );
            return;
          }

          window.kakao.maps.load(() => {
            if (!cancelled) setMapLoaded(true);
          });
        };

        document.head.appendChild(script);
      } catch (error) {
        if (!cancelled) {
          setKakaoLoadError(
            `카카오 지도를 불러오지 못했습니다. (${error instanceof Error ? error.message : String(error)})`,
          );
        }
        console.error("Failed to load Kakao Map:", error);
      }
    }

    loadKakaoMap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const kakao = window.kakao;
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current || !kakao?.maps)
      return;

    const options = {
      center: new kakao.maps.LatLng(37.5065, 127.0536),
      level: 5,
    };

    const map = new kakao.maps.Map(mapRef.current, options);
    mapInstanceRef.current = map;

    const zoomControl = new kakao.maps.ZoomControl();
    map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
    infoWindowRef.current = new kakao.maps.InfoWindow({ zIndex: 1 });
  }, [mapLoaded]);

  // OpenAPI 마커(URI 기반): 결과가 추가되는 만큼 점진적으로 지도에 마커를 추가합니다.
  useEffect(() => {
    const kakao = window.kakao as unknown as any;
    const map = mapInstanceRef.current;
    if (!isOpenApiMode) return;
    if (!mapLoaded || !map || !kakao?.maps) return;

    if (openApiMarkers.length < openApiRenderedCountRef.current) {
      try {
        openApiMapMarkersRef.current.forEach((m) => m.setMap(null));
      } catch {
        // ignore
      }
      openApiMapMarkersRef.current = [];
      openApiRenderedCountRef.current = 0;
      openApiBoundsRef.current = null;
    }

    if (!openApiBoundsRef.current) {
      openApiBoundsRef.current = new kakao.maps.LatLngBounds();
    }
    const bounds = openApiBoundsRef.current;

    for (
      let i = openApiRenderedCountRef.current;
      i < openApiMarkers.length;
      i++
    ) {
      const p = openApiMarkers[i];
      const markerPosition = new kakao.maps.LatLng(p.lat, p.lng);
      const marker = new kakao.maps.Marker({
        position: markerPosition,
        map,
        title: p.title,
      });

      openApiMapMarkersRef.current.push(marker);
      bounds.extend(markerPosition);

      kakao.maps.event.addListener(marker, "click", () => {
        if (infoWindowRef.current) {
          const content = document.createElement("div");
          content.style.padding = "6px";
          content.style.fontSize = "12px";
          content.textContent = p.title;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);
        }
      });
    }
    openApiRenderedCountRef.current = openApiMarkers.length;

    if (openApiMarkers.length > 0) {
      try {
        if (openApiFitTimerRef.current != null) {
          window.clearTimeout(openApiFitTimerRef.current);
        }
      } catch {
        // ignore
      }
      openApiFitTimerRef.current = window.setTimeout(() => {
        const kakao2 = window.kakao as unknown as any;
        const map2 = mapInstanceRef.current;
        if (!map2 || !kakao2?.maps) return;
        const b = openApiBoundsRef.current;
        if (b) map2.setBounds(b);
      }, 400);
    }
  }, [isOpenApiMode, mapLoaded, openApiMarkers]);

  useEffect(() => {
    if (isOpenApiMode) return;
    try {
      if (openApiFitTimerRef.current != null) {
        window.clearTimeout(openApiFitTimerRef.current);
        openApiFitTimerRef.current = null;
      }
    } catch {
      // ignore
    }
    try {
      openApiMapMarkersRef.current.forEach((m) => m.setMap(null));
    } catch {
      // ignore
    }
    openApiMapMarkersRef.current = [];
    openApiRenderedCountRef.current = 0;
    openApiBoundsRef.current = null;
  }, [isOpenApiMode]);

  // 로컬 마커: 목록(멤버십)이 바뀔 때만 전체 재구성합니다.
  useEffect(() => {
    const kakao = window.kakao;
    const map = mapInstanceRef.current;
    if (!mapLoaded || !map || !kakao?.maps) return;
    if (isOpenApiMode) return;

    try {
      markersRef.current.forEach((m) => m.setMap(null));
    } catch {
      // ignore
    }
    markersRef.current = [];
    markerByCenterIdRef.current.clear();
    renderedMarkerIdsRef.current.clear();
    try {
      infoWindowRef.current?.close();
    } catch {
      // ignore
    }

    const bounds = new kakao.maps.LatLngBounds();
    let hasAnyMarker = false;

    for (const center of visibleCenters) {
      if (center.lat == null || center.lng == null) continue;
      const markerPosition = new kakao.maps.LatLng(center.lat, center.lng);
      const marker = new kakao.maps.Marker({
        position: markerPosition,
        map,
        title: center.name,
      });

      markersRef.current.push(marker);
      markerByCenterIdRef.current.set(center.id, marker);
      renderedMarkerIdsRef.current.add(center.id);
      bounds.extend(markerPosition);
      hasAnyMarker = true;

      kakao.maps.event.addListener(marker, "click", () => {
        setSelectedCenter(center);
        if (infoWindowRef.current) {
          const content = document.createElement("div");
          content.style.padding = "6px";
          content.style.fontSize = "12px";
          content.textContent = center.name;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);
        }
      });
    }

    if (hasAnyMarker) {
      map.setBounds(bounds);
    }
  }, [mapLoaded, visibleCentersKey, isOpenApiMode]);

  // 로컬 마커: 좌표가 채워지면(지오코딩) 새 마커만 "증분 추가"합니다.
  useEffect(() => {
    const kakao = window.kakao;
    const map = mapInstanceRef.current;
    if (!mapLoaded || !map || !kakao?.maps) return;
    if (isOpenApiMode) return;

    for (const center of visibleCenters) {
      if (center.lat == null || center.lng == null) continue;
      if (renderedMarkerIdsRef.current.has(center.id)) continue;

      const markerPosition = new kakao.maps.LatLng(center.lat, center.lng);
      const marker = new kakao.maps.Marker({
        position: markerPosition,
        map,
        title: center.name,
      });

      markersRef.current.push(marker);
      markerByCenterIdRef.current.set(center.id, marker);
      renderedMarkerIdsRef.current.add(center.id);

      kakao.maps.event.addListener(marker, "click", () => {
        setSelectedCenter(center);
        if (infoWindowRef.current) {
          const content = document.createElement("div");
          content.style.padding = "6px";
          content.style.fontSize = "12px";
          content.textContent = center.name;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);
        }
      });
    }
  }, [mapLoaded, visibleCenters, isOpenApiMode]);

  useEffect(() => {
    setSelectedCenter(null);
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "counseling" | "child")
            }
          >
            <TabsList>
              <TabsTrigger value="counseling">주변 상담소</TabsTrigger>
              <TabsTrigger value="child">주변 아동센터</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`${centerLabel} 이름 또는 주소 검색`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoadingActive ? (
              <div className="text-sm text-muted-foreground flex items-center">
                JSON 데이터 불러오는 중...
              </div>
            ) : null}
          </div>

          <details className="mt-4 rounded-lg border bg-muted/20 p-4">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              OpenAPI URI 마커
            </summary>
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                JSON을 반환하는 OpenAPI URI를 한 줄에 하나씩 입력하면, 응답에
                포함된 좌표(lat/lng 또는 x/y)를 지도 마커로 표시합니다.
              </p>
              <Textarea
                value={openApiUrlsText}
                onChange={(e) => setOpenApiUrlsText(e.target.value)}
                placeholder={`예) https://example.com/api/points\n(여러 개 입력 가능: 줄바꿈/쉼표)`}
                className="min-h-24"
              />
              {openApiMarkersError ? (
                <p className="text-xs text-red-500">{openApiMarkersError}</p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={loadMarkersFromOpenApi}
                  disabled={isLoadingOpenApiMarkers}
                >
                  {isLoadingOpenApiMarkers
                    ? "불러오는 중..."
                    : "URI로 마커 표시"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-transparent"
                  onClick={clearOpenApiMarkers}
                  disabled={!isOpenApiMode && openApiMarkers.length === 0}
                >
                  마커 해제
                </Button>
              </div>
            </div>
          </details>

          {activeError && (
            <p className="text-xs text-red-500 mt-3">
              JSON 데이터를 불러오지 못했습니다. (샘플 데이터로 표시됩니다) -{" "}
              {activeError}
            </p>
          )}
          {mapLoaded &&
          markerableVisibleCount === 0 &&
          !isLoadingActive &&
          !activeError ? (
            <p className="text-xs text-amber-600 mt-3">
              표시할 좌표(위도/경도) 데이터가 없습니다. JSON 키/값(위도, 경도)을
              확인해주세요.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative h-[500px] rounded-xl overflow-hidden border bg-muted">
          <div ref={mapRef} className="w-full h-full" />
          {!mapLoaded && !kakaoLoadError ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              지도를 불러오는 중...
            </div>
          ) : null}
          {kakaoLoadError ? (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-red-600 bg-background/80">
              {kakaoLoadError}
            </div>
          ) : null}
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {visibleCenters.map((center) => (
            <CenterCard
              key={center.id}
              center={center}
              isSelected={selectedCenter?.id === center.id}
              onClick={() => handleCenterSelect(center)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SolutionsPage() {
  const [selectedTherapy, setSelectedTherapy] = useState("art-therapy");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Video Hero */}
      <div className="-mt-14">
        <VideoHero
          subtitle="전문가 추천"
          title="맞춤 솔루션"
          description="전문가가 제안하는 다양한 치료법과 활동을 통해 아이의 건강한 정서 발달을 도와주세요."
          height="small"
        />
      </div>

      <main className="flex-1 bg-gradient-to-b from-slate-50 to-white">
        {/* Main Content */}
        <section className="py-12 pb-20">
          <div className="container mx-auto px-4 lg:px-8">
            <Tabs defaultValue="therapy" className="space-y-10">
              <div className="flex justify-center">
                <TabsList className="grid w-full max-w-2xl grid-cols-4 h-auto p-1.5 bg-white shadow-lg shadow-slate-200/50 border border-slate-100 rounded-2xl">
                  <TabsTrigger value="therapy" className="gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                    <Heart className="h-4 w-4 hidden sm:block" />
                    치료법 제안
                  </TabsTrigger>
                  <TabsTrigger value="colors" className="gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                    <Palette className="h-4 w-4 hidden sm:block" />
                    색상 추천
                  </TabsTrigger>
                  <TabsTrigger value="activities" className="gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                    <Lightbulb className="h-4 w-4 hidden sm:block" />
                    활동 가이드
                  </TabsTrigger>
                  <TabsTrigger value="centers" className="gap-2 rounded-xl py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                    <MapPin className="h-4 w-4 hidden sm:block" />
                    센터 찾기
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Therapy Methods Tab */}
              <TabsContent value="therapy" className="space-y-8">
                {/* Section header */}
                <div className="text-center max-w-xl mx-auto">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">감정 표현을 도와주는 치료법</h2>
                  <p className="text-sm text-slate-400">아이에게 맞는 치료법을 선택하고 가정에서 실천해 보세요</p>
                </div>

                <div className="grid gap-5 md:grid-cols-3 mb-8">
                  {therapyMethods.map((method) => {
                    const Icon = method.icon;
                    const isActive = selectedTherapy === method.id;
                    return (
                      <div
                        key={method.id}
                        className={`group cursor-pointer rounded-2xl border p-6 transition-all duration-300 ${
                          isActive
                            ? "border-teal-200 bg-gradient-to-br from-teal-50/50 to-white shadow-xl shadow-teal-100/40 -translate-y-1"
                            : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg hover:-translate-y-0.5"
                        }`}
                        onClick={() => setSelectedTherapy(method.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                              isActive
                                ? "bg-gradient-to-br from-teal-400 to-emerald-500 ring-4 ring-teal-200/30"
                                : `${method.color} ring-4 ring-slate-100`
                            }`}
                          >
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className={`font-bold mb-1 transition-colors ${isActive ? "text-teal-700" : "text-slate-800"}`}>
                              {method.title}
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                              {method.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Therapy Activities */}
                {therapyMethods.map(
                  (method) =>
                    method.id === selectedTherapy && (
                      <div key={method.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                          <h3 className="text-lg font-bold text-slate-900">{method.title} 활동</h3>
                          <p className="text-sm text-slate-400 mt-1">
                            가정에서 쉽게 할 수 있는 {method.title} 활동입니다
                          </p>
                        </div>
                        <div className="p-6 md:p-8">
                          <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                          >
                            {method.activities.map((activity, index) => (
                              <AccordionItem
                                key={index}
                                value={`activity-${index}`}
                                className="border-b border-slate-100 last:border-0"
                              >
                                <AccordionTrigger className="hover:no-underline py-5">
                                  <div className="flex items-center gap-4 text-left">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-md ring-4 ring-teal-100/30">
                                      <span className="text-sm font-bold text-white">
                                        {index + 1}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-800">
                                        {activity.name}
                                      </p>
                                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                        <Clock className="h-3 w-3" />
                                        {activity.duration}
                                      </p>
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="pl-14 space-y-4 pb-2">
                                    <p className="text-slate-500 leading-relaxed">
                                      {activity.description}
                                    </p>
                                    <div className="bg-teal-50/50 rounded-xl p-4">
                                      <p className="text-sm font-semibold text-teal-700 mb-3">
                                        진행 방법
                                      </p>
                                      <ol className="space-y-2.5">
                                        {activity.steps.map(
                                          (step, stepIndex) => (
                                            <li
                                              key={stepIndex}
                                              className="flex items-start gap-2.5 text-sm text-slate-600"
                                            >
                                              <ChevronRight className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                                              {step}
                                            </li>
                                          ),
                                        )}
                                      </ol>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </div>
                      </div>
                    ),
                )}
              </TabsContent>

              {/* Color Recommendations Tab */}
              <TabsContent value="colors" className="space-y-8">
                <div className="text-center max-w-xl mx-auto">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">감정별 색상 추천</h2>
                  <p className="text-sm text-slate-400">색상은 아이의 감정을 표현하고 치유하는 강력한 도구입니다</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {colorRecommendations.map((rec) => (
                    <div key={rec.emotion} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all duration-300">
                      {/* Color strip */}
                      <div className="flex h-2">
                        {rec.colorClasses.map((colorClass, index) => (
                          <div key={index} className={`flex-1 ${colorClass}`} />
                        ))}
                      </div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-slate-800">
                            {rec.emotion}을 느낄 때
                          </h3>
                          <div className="flex gap-1.5">
                            {rec.colorClasses.map((colorClass, index) => (
                              <div
                                key={index}
                                className={`h-7 w-7 rounded-full ${colorClass} ring-2 ring-white shadow-sm`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-slate-400 mb-4 leading-relaxed">{rec.description}</p>
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            추천 색상: {rec.colors.join(" · ")}
                          </p>
                          <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs font-semibold text-slate-600 mb-2">
                              추천 활동
                            </p>
                            <ul className="space-y-1.5">
                              {rec.activities.map((activity, index) => (
                                <li
                                  key={index}
                                  className="text-sm text-slate-500 flex items-center gap-2"
                                >
                                  <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                                  {activity}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border border-teal-100/50 p-6">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shrink-0 shadow-lg ring-4 ring-teal-200/30">
                      <Lightbulb className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 mb-2">
                        색상 활용 팁
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        아이가 특정 색상을 거부하거나 선호한다면 그것도 중요한
                        신호입니다. 색상 선택을 강요하지 말고, 아이가
                        자연스럽게 선택하도록 해주세요. 시간이 지나면서
                        선호하는 색상이 변화하는 것도 자연스러운 현상입니다.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Home Activities Tab */}
              <TabsContent value="activities" className="space-y-8">
                <div className="text-center max-w-xl mx-auto">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">가정에서 할 수 있는 활동</h2>
                  <p className="text-sm text-slate-400">아이와 함께 즐기며 정서 발달을 도울 수 있는 활동들입니다</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {homeActivities.map((activity) => (
                    <div key={activity.title} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all duration-300">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-bold text-slate-800">
                            {activity.title}
                          </h3>
                          <span className="text-xs font-semibold bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-600 px-3 py-1.5 rounded-full border border-teal-100/50 shrink-0 ml-2">
                            {activity.ageRange}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                          {activity.description}
                        </p>

                        <div className="flex gap-3 mb-4">
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {activity.duration}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                            <Star className="h-3.5 w-3.5 text-slate-400" />
                            {activity.frequency}
                          </span>
                        </div>

                        <div className="mb-4">
                          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                            준비물
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {activity.materials.map((material, index) => (
                              <span
                                key={index}
                                className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100/50"
                              >
                                {material}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-teal-50/50 rounded-xl p-4">
                          <p className="text-xs font-semibold text-teal-700 mb-2">
                            기대 효과
                          </p>
                          <ul className="space-y-1.5">
                            {activity.benefits.map((benefit, index) => (
                              <li
                                key={index}
                                className="text-sm text-slate-600 flex items-center gap-2"
                              >
                                <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-100/50 p-6">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shrink-0 shadow-lg ring-4 ring-violet-200/30">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 mb-2">
                        전문가 상담이 필요하신가요?
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed mb-4">
                        가정에서의 활동만으로 부족하다고 느껴지신다면, 전문
                        상담소의 도움을 받아보세요. 주변의 아동 심리 상담소를
                        찾아보실 수 있습니다.
                      </p>
                      <Button
                        className="gap-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/20"
                        asChild
                      >
                        <a href="/counseling">
                          주변 상담소 찾기
                          <ChevronRight className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Center Finder Tab */}
              <TabsContent value="centers" className="space-y-8">
                <div className="text-center max-w-xl mx-auto">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">주변 상담센터 찾기</h2>
                  <p className="text-sm text-slate-400">내 위치 기반으로 가까운 아동심리 상담센터를 찾아보세요</p>
                </div>
                <CenterFinder />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
