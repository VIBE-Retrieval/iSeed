"use client"

import Link from "next/link"
import { use } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Clock } from "lucide-react"
import { GameHost } from "@/components/activities/game-host"
import { SeedCard } from "@/components/iseed/seed-card"
import { CATEGORY_META, getActivity } from "@/lib/activities/registry"

export default function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const activity = getActivity(id)

  if (!activity) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-b from-secondary/30 to-background pt-14">
          <div className="container mx-auto px-4 py-16">
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <p className="font-semibold text-foreground">활동을 찾을 수 없어요</p>
                <Link href="/activities" className="mt-6 inline-block">
                  <Button variant="outline">마음활동 목록으로</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const meta = CATEGORY_META[activity.category]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-secondary/30 to-background pt-14">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/activities"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            마음활동 목록
          </Link>

          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-xs ${meta.color}`}>
                {meta.label}
              </span>
              <Badge variant="outline" className="gap-1 text-xs">
                <Clock className="h-3 w-3" />약 {activity.durationMin}분
              </Badge>
              <Badge variant="outline" className="text-xs">
                🌱 +{activity.growthPoint}점
              </Badge>
            </div>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold text-foreground md:text-3xl">
              <span aria-hidden>{activity.emoji}</span>
              {activity.title}
            </h1>
            <p className="mt-1 text-muted-foreground">{activity.guide}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <GameHost activity={activity} />
            <div>
              <SeedCard compact />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
