"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock, Sparkles } from "lucide-react"
import { SeedCard } from "@/components/iseed/seed-card"
import { ACTIVITIES, CATEGORY_META, isPlayable } from "@/lib/activities/registry"
import { DISCLAIMER } from "@/lib/iseed/config"

interface RecommendedActivity {
  id: string
  title?: string
  reason?: string
  category_label?: string
}

export default function ActivitiesPage() {
  const [recommended, setRecommended] = useState<RecommendedActivity[]>([])

  // 직전 분석 결과가 있으면 추천 활동을 상단에 강조
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("analysisResponse")
      if (!raw) return
      const data = JSON.parse(raw)
      const list = data?.activity_recommendations?.activities
      if (Array.isArray(list)) setRecommended(list)
    } catch {
      /* 추천이 없어도 목록은 정상 표시 */
    }
  }, [])

  const recommendedIds = new Set(recommended.map((r) => r.id))

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-secondary/30 to-background pt-14">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary">
              마음활동
            </Badge>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              아이와 함께하는 마음활동
            </h1>
            <p className="mt-1 text-muted-foreground">
              분석 결과에 맞는 활동을 하나씩 해보면 아이의 마음 씨앗이 자라요.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              {recommended.length > 0 && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="h-5 w-5 text-primary" />
                      이번 분석 결과에 맞는 추천 활동
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recommended.map((rec) => (
                      <div key={rec.id} className="rounded-lg bg-background p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{rec.title}</span>
                          {rec.category_label && (
                            <Badge variant="outline" className="text-xs">
                              {rec.category_label}
                            </Badge>
                          )}
                        </div>
                        {rec.reason && (
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {rec.reason}
                          </p>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">{DISCLAIMER.short}</p>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {ACTIVITIES.map((activity) => {
                  const meta = CATEGORY_META[activity.category]
                  const playable = isPlayable(activity.id)
                  const isRecommended = recommendedIds.has(activity.id)
                  return (
                    <Card
                      key={activity.id}
                      className={isRecommended ? "border-primary/40 shadow-sm" : ""}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl" aria-hidden>
                              {activity.emoji}
                            </span>
                            <CardTitle className="text-base">{activity.title}</CardTitle>
                          </div>
                          {isRecommended && (
                            <Badge className="shrink-0 bg-primary/10 text-primary" variant="secondary">
                              추천
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-1 text-xs ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {activity.summary}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />약 {activity.durationMin}분
                          </span>
                          <span>🌱 +{activity.growthPoint}점</span>
                        </div>
                        {playable ? (
                          <Link href={`/activities/${activity.id}`} className="block">
                            <Button className="w-full gap-2" size="sm">
                              시작하기
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        ) : (
                          <Button className="w-full" size="sm" variant="outline" disabled>
                            준비 중
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            <div className="space-y-6">
              <SeedCard />
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {DISCLAIMER.long}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
