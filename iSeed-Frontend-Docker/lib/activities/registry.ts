/**
 * iSeed 마음활동 / 게임 레지스트리
 *
 * 게임을 추가하려면:
 *   1. components/activities/games/<your-game>.tsx 를 만들고 ActivityGameProps 를 받습니다.
 *   2. 아래 ACTIVITIES 에 항목을 추가하고 component 를 연결합니다.
 *   3. (선택) AI 추천과 연동하려면 iSeed-AiModels-Docker/recommendation_service.py 의
 *      ACTIVITY_CATALOG 에 같은 id 를 등록합니다.
 * 그 외에는 아무것도 고칠 필요가 없습니다.
 */

import type { ComponentType } from "react"

export type ActivityCategory =
  | "ANXIETY"
  | "EMOTION"
  | "EXPRESSION"
  | "SELF_ESTEEM"
  | "SOCIAL"

export const CATEGORY_META: Record<
  ActivityCategory,
  { label: string; description: string; color: string; emoji: string }
> = {
  ANXIETY: {
    label: "불안 / 긴장 완화",
    description: "긴장을 낮추고 몸과 마음을 편안하게 하는 활동",
    color: "bg-sky-100 text-sky-700 border-sky-200",
    emoji: "☁️",
  },
  EMOTION: {
    label: "감정 인식",
    description: "지금 내 마음이 어떤 색인지 알아차리는 활동",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    emoji: "🎨",
  },
  EXPRESSION: {
    label: "자기표현",
    description: "마음속 이야기를 밖으로 꺼내 보는 활동",
    color: "bg-violet-100 text-violet-700 border-violet-200",
    emoji: "💬",
  },
  SELF_ESTEEM: {
    label: "자기효능감",
    description: "'나는 할 수 있어'라는 마음을 키우는 활동",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    emoji: "⭐",
  },
  SOCIAL: {
    label: "사회적 감정 이해",
    description: "친구와 가족의 마음을 헤아려 보는 활동",
    color: "bg-rose-100 text-rose-700 border-rose-200",
    emoji: "🤝",
  },
}

/** 게임 컴포넌트가 공통으로 받는 props */
export interface ActivityGameProps {
  /** 게임을 끝까지 마쳤을 때 호출. memo 는 아이가 남긴 선택/기록 */
  onComplete: (memo?: string) => void
}

export interface ActivityDefinition {
  id: string
  title: string
  category: ActivityCategory
  summary: string
  /** 아이에게 보여줄 한 줄 안내 */
  guide: string
  durationMin: number
  growthPoint: number
  emoji: string
  /** 아직 구현되지 않은 활동은 component 가 없습니다 (목록에 '준비 중'으로 표시) */
  component?: ComponentType<ActivityGameProps>
}

/**
 * 컴포넌트는 페이지에서 동적으로 연결합니다 (서버 컴포넌트 경계 문제 회피).
 * 메타데이터만 여기에 둡니다.
 */
export const ACTIVITIES: ActivityDefinition[] = [
  {
    id: "calm-cloud",
    title: "마음 구름 날리기",
    category: "ANXIETY",
    summary: "숨을 천천히 들이마시고 내쉬며 마음속 구름을 날려 보내요.",
    guide: "구름이 커지면 숨을 들이마시고, 작아지면 천천히 내쉬어요.",
    durationMin: 3,
    growthPoint: 20,
    emoji: "☁️",
  },
  {
    id: "mood-color",
    title: "오늘의 마음 색깔",
    category: "EMOTION",
    summary: "지금 내 마음과 가장 닮은 색을 골라 기록해요.",
    guide: "오늘 내 마음은 어떤 색인가요? 마음에 드는 색을 골라보세요.",
    durationMin: 2,
    growthPoint: 15,
    emoji: "🎨",
  },
  {
    id: "friend-feeling",
    title: "친구의 마음은 어떨까?",
    category: "SOCIAL",
    summary: "상황 카드를 보고 친구가 느낄 감정을 함께 찾아봐요.",
    guide: "이야기를 읽고, 친구가 어떤 마음일지 골라보세요.",
    durationMin: 4,
    growthPoint: 25,
    emoji: "🤝",
  },
  {
    id: "emotion-jenga",
    title: "감정 젠가",
    category: "EXPRESSION",
    summary: "보호자와 번갈아 블록을 뽑고, 블록 색에 맞는 마음 질문에 대답해요.",
    guide: "보호자가 먼저 블록을 뽑아요. 질문에 시간 안에 대답하면 별을 받아요.",
    durationMin: 15,
    growthPoint: 30,
    emoji: "🧱",
  },
  {
    id: "story-seed",
    title: "내 그림 이야기 들려주기",
    category: "EXPRESSION",
    summary: "내가 그린 그림에 이름을 붙이고 이야기를 만들어요.",
    guide: "곧 만나요!",
    durationMin: 5,
    growthPoint: 25,
    emoji: "💬",
  },
  {
    id: "brave-badge",
    title: "오늘의 용기 배지",
    category: "SELF_ESTEEM",
    summary: "오늘 해낸 작은 일을 찾아 스스로에게 배지를 달아줘요.",
    guide: "곧 만나요!",
    durationMin: 3,
    growthPoint: 20,
    emoji: "⭐",
  },
]

/** 실제로 플레이 가능한 게임 id (components/activities/game-host.tsx 와 동기화) */
export const PLAYABLE_IDS = ["calm-cloud", "mood-color", "friend-feeling", "emotion-jenga"] as const

export function getActivity(id: string): ActivityDefinition | undefined {
  return ACTIVITIES.find((a) => a.id === id)
}

export function isPlayable(id: string): boolean {
  return (PLAYABLE_IDS as readonly string[]).includes(id)
}
