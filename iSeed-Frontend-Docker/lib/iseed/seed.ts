/**
 * iSeed 마음 씨앗(Seed) 성장 상태 관리
 *
 * SEED(씨앗) → SPROUT(새싹) → LEAF(잎) → TREE(마음나무)
 *
 * 현재는 브라우저 localStorage 기반(MVP)이며,
 * 서버 저장으로 확장하기 쉽도록 자료구조를 분리해 두었습니다.
 * (향후 /users/me/seed 같은 API가 생기면 load/save만 교체하면 됩니다.)
 */

export type SeedStage = "SEED" | "SPROUT" | "LEAF" | "TREE"

export interface CompletedActivity {
  activityId: string
  title: string
  category: string
  completedAt: string
  growthPoint: number
  /** 게임별 결과 메모 (예: 오늘의 마음 색깔에서 고른 감정) */
  memo?: string
}

export interface SeedState {
  seedLevel: number
  seedStage: SeedStage
  growthPoint: number
  completedActivities: CompletedActivity[]
  /** 씨앗이 처음 생긴 시각 (첫 검사 완료 시) */
  createdAt?: string
  /** 마지막 검사 일시 - 재검사 안내용 */
  lastAnalysisAt?: string
  childName?: string
}

export const STORAGE_KEY = "iseed:seed:v1"

/** 단계별 정의 (누적 성장 포인트 기준) */
export const STAGES: {
  stage: SeedStage
  level: number
  label: string
  emoji: string
  threshold: number
  message: string
}[] = [
  {
    stage: "SEED",
    level: 1,
    label: "씨앗",
    emoji: "🌱",
    threshold: 0,
    message: "아이의 마음 씨앗이 생겼어요. 마음활동을 하면서 씨앗을 키워보세요.",
  },
  {
    stage: "SPROUT",
    level: 2,
    label: "새싹",
    emoji: "🌿",
    threshold: 40,
    message: "씨앗에서 새싹이 돋았어요! 조금씩 마음이 자라고 있어요.",
  },
  {
    stage: "LEAF",
    level: 3,
    label: "잎",
    emoji: "🍃",
    threshold: 100,
    message: "잎이 넓어졌어요. 아이가 마음을 표현하는 힘이 자라고 있어요.",
  },
  {
    stage: "TREE",
    level: 4,
    label: "마음나무",
    emoji: "🌳",
    threshold: 200,
    message: "든든한 마음나무가 되었어요. 함께 자라온 시간을 돌아봐요.",
  },
]

export const EMPTY_SEED: SeedState = {
  seedLevel: 1,
  seedStage: "SEED",
  growthPoint: 0,
  completedActivities: [],
}

export function stageForPoint(point: number) {
  let current = STAGES[0]
  for (const s of STAGES) {
    if (point >= s.threshold) current = s
  }
  return current
}

export function nextStageFor(point: number) {
  return STAGES.find((s) => s.threshold > point) ?? null
}

/** 다음 단계까지의 진행률 (0~100) */
export function progressToNext(point: number): number {
  const current = stageForPoint(point)
  const next = nextStageFor(point)
  if (!next) return 100
  const span = next.threshold - current.threshold
  if (span <= 0) return 100
  return Math.min(100, Math.round(((point - current.threshold) / span) * 100))
}

export function loadSeed(): SeedState {
  if (typeof window === "undefined") return { ...EMPTY_SEED }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_SEED }
    const parsed = JSON.parse(raw) as Partial<SeedState>
    const growthPoint = Number(parsed.growthPoint) || 0
    const stage = stageForPoint(growthPoint)
    return {
      seedLevel: stage.level,
      seedStage: stage.stage,
      growthPoint,
      completedActivities: Array.isArray(parsed.completedActivities)
        ? (parsed.completedActivities as CompletedActivity[])
        : [],
      createdAt: parsed.createdAt,
      lastAnalysisAt: parsed.lastAnalysisAt,
      childName: parsed.childName,
    }
  } catch {
    return { ...EMPTY_SEED }
  }
}

export function saveSeed(state: SeedState): SeedState {
  const stage = stageForPoint(state.growthPoint)
  const normalized: SeedState = {
    ...state,
    seedLevel: stage.level,
    seedStage: stage.stage,
  }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
      window.dispatchEvent(new CustomEvent("iseed:seed-updated", { detail: normalized }))
    } catch {
      /* 저장 실패해도 화면 동작은 유지 */
    }
  }
  return normalized
}

/** 첫 검사 완료 시 씨앗 생성 (이미 있으면 검사 시각만 갱신) */
export function ensureSeed(childName?: string): SeedState {
  const current = loadSeed()
  const now = new Date().toISOString()
  return saveSeed({
    ...current,
    createdAt: current.createdAt ?? now,
    lastAnalysisAt: now,
    childName: childName || current.childName,
  })
}

/** 마음활동 완료 → 성장 포인트 적립 */
export function completeActivity(entry: Omit<CompletedActivity, "completedAt">): {
  seed: SeedState
  leveledUp: boolean
} {
  const before = loadSeed()
  const beforeStage = stageForPoint(before.growthPoint)
  const record: CompletedActivity = { ...entry, completedAt: new Date().toISOString() }
  const after = saveSeed({
    ...before,
    createdAt: before.createdAt ?? record.completedAt,
    growthPoint: before.growthPoint + (entry.growthPoint || 0),
    completedActivities: [record, ...before.completedActivities].slice(0, 100),
  })
  return { seed: after, leveledUp: after.seedStage !== beforeStage.stage }
}

/** 데모/테스트용 초기화 */
export function resetSeed(): SeedState {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
      window.dispatchEvent(new CustomEvent("iseed:seed-updated", { detail: EMPTY_SEED }))
    } catch {
      /* noop */
    }
  }
  return { ...EMPTY_SEED }
}

/** 다음 관찰(재검사) 권장 시점 - 마지막 검사로부터 8주 */
export function nextCheckupDate(lastAnalysisAt?: string): Date | null {
  if (!lastAnalysisAt) return null
  const d = new Date(lastAnalysisAt)
  if (Number.isNaN(d.getTime())) return null
  d.setDate(d.getDate() + 56)
  return d
}
