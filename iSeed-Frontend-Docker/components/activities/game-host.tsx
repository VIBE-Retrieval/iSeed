"use client"

/**
 * 마음활동 실행 호스트.
 * id → 게임 컴포넌트 매핑을 한 곳에서 관리합니다.
 * 새 게임을 추가하면 GAME_MAP 에 한 줄만 추가하면 됩니다.
 */

import { useCallback, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Sprout } from "lucide-react"
import type { ActivityGameProps, ActivityDefinition } from "@/lib/activities/registry"
import { completeActivity, stageForPoint } from "@/lib/iseed/seed"
import CalmCloudGame from "./games/calm-cloud"
import MoodColorGame from "./games/mood-color"
import FriendFeelingGame from "./games/friend-feeling"
import EmotionJengaGame from "./games/emotion-jenga"

const GAME_MAP: Record<string, React.ComponentType<ActivityGameProps>> = {
  "calm-cloud": CalmCloudGame,
  "mood-color": MoodColorGame,
  "friend-feeling": FriendFeelingGame,
  "emotion-jenga": EmotionJengaGame,
}

export function GameHost({ activity }: { activity: ActivityDefinition }) {
  const Game = GAME_MAP[activity.id]
  const [result, setResult] = useState<{
    point: number
    total: number
    stageLabel: string
    leveledUp: boolean
    memo?: string
  } | null>(null)

  const handleComplete = useCallback(
    (memo?: string) => {
      const { seed, leveledUp } = completeActivity({
        activityId: activity.id,
        title: activity.title,
        category: activity.category,
        growthPoint: activity.growthPoint,
        memo,
      })
      const stage = stageForPoint(seed.growthPoint)
      setResult({
        point: activity.growthPoint,
        total: seed.growthPoint,
        stageLabel: `${stage.emoji} ${stage.label}`,
        leveledUp,
        memo,
      })
    },
    [activity],
  )

  if (!Game) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <span className="text-5xl" aria-hidden>
            {activity.emoji}
          </span>
          <p className="mt-4 font-semibold text-foreground">준비 중인 활동이에요</p>
          <p className="mt-1 text-sm text-muted-foreground">
            이 활동은 곧 만나볼 수 있어요. 먼저 다른 마음활동을 해볼까요?
          </p>
          <Link href="/activities" className="mt-6 inline-block">
            <Button variant="outline">마음활동 목록으로</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Game onComplete={handleComplete} />

      {result && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-3 text-center md:flex-row md:justify-between md:text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Sprout className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    마음 씨앗이 +{result.point} 자랐어요!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    현재 단계 {result.stageLabel} · 누적 {result.total}점
                    {result.leveledUp ? " · 새로운 단계로 자랐어요 🎉" : ""}
                  </p>
                  {result.memo && (
                    <p className="mt-1 text-xs text-muted-foreground">기록: {result.memo}</p>
                  )}
                </div>
              </div>
              <Link href="/activities">
                <Button className="gap-2">
                  다른 마음활동 보기
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default GameHost
