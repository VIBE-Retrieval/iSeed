"use client"

/**
 * "나의 마음 씨앗" 카드
 * 기존 디자인 시스템(Card / Badge / Progress / Button)을 그대로 사용합니다.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sprout } from "lucide-react"
import {
  loadSeed,
  nextCheckupDate,
  nextStageFor,
  progressToNext,
  stageForPoint,
  STAGES,
  type SeedState,
} from "@/lib/iseed/seed"

export function SeedCard({
  compact = false,
  className = "",
}: {
  compact?: boolean
  className?: string
}) {
  const [seed, setSeed] = useState<SeedState | null>(null)

  useEffect(() => {
    setSeed(loadSeed())
    const handler = () => setSeed(loadSeed())
    window.addEventListener("iseed:seed-updated", handler)
    window.addEventListener("storage", handler)
    return () => {
      window.removeEventListener("iseed:seed-updated", handler)
      window.removeEventListener("storage", handler)
    }
  }, [])

  // SSR/하이드레이션 불일치 방지
  if (!seed) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sprout className="h-5 w-5 text-primary" />
            나의 마음 씨앗
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    )
  }

  const stage = stageForPoint(seed.growthPoint)
  const next = nextStageFor(seed.growthPoint)
  const percent = progressToNext(seed.growthPoint)
  const checkup = nextCheckupDate(seed.lastAnalysisAt)

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-primary" />
            나의 마음 씨앗
          </span>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Lv.{stage.level} {stage.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <span className="text-3xl" aria-hidden>
              {stage.emoji}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">현재 단계 · {stage.label}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{stage.message}</p>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>성장 포인트 {seed.growthPoint}점</span>
            <span>
              {next ? `다음 단계 ${next.label}까지 ${next.threshold - seed.growthPoint}점` : "최고 단계"}
            </span>
          </div>
          <Progress value={percent} className="h-2" />
        </div>

        {!compact && (
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((s) => (
              <span
                key={s.stage}
                className={`rounded-full border px-2.5 py-1 text-xs ${
                  seed.growthPoint >= s.threshold
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-muted/50 text-muted-foreground"
                }`}
              >
                {s.emoji} {s.label}
              </span>
            ))}
          </div>
        )}

        {!compact && seed.completedActivities.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-foreground">최근 마음활동</p>
            <ul className="mt-1.5 space-y-1">
              {seed.completedActivities.slice(0, 3).map((a, i) => (
                <li key={`${a.activityId}-${i}`} className="text-xs text-muted-foreground">
                  · {a.title}
                  {a.memo ? ` — ${a.memo}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!compact && checkup && (
          <p className="text-xs text-muted-foreground">
            다음 관찰 권장 시점 · {checkup.toLocaleDateString("ko-KR")} 무렵
          </p>
        )}

        <Link href="/activities" className="block">
          <Button className="w-full gap-2">
            마음활동 하러 가기
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

export default SeedCard
