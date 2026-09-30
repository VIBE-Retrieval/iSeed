"use client"

/**
 * iSeed 성장 여정 섹션 (홈)
 * 기존 홈 섹션들의 레이아웃/타이포 규칙을 그대로 따릅니다.
 */

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { STAGES } from "@/lib/iseed/seed"
import { BRAND } from "@/lib/iseed/config"

const FLOW = [
  { step: "01", title: "마음 씨앗 찾기", desc: "집·나무·사람 그림을 올리면 AI가 그림 속 신호를 살펴봐요." },
  { step: "02", title: "마음 리포트", desc: "논문 근거(RAG)를 함께 담은 보호자용 리포트를 받아요." },
  { step: "03", title: "맞춤 마음활동", desc: "관찰된 신호에 맞는 활동을 아이와 함께 해봐요." },
  { step: "04", title: "씨앗 성장", desc: "활동을 마칠 때마다 씨앗이 새싹, 잎, 마음나무로 자라요." },
]

export function SeedJourneySection() {
  return (
    <section className="overflow-hidden bg-white py-20 md:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-2 text-muted-foreground">{BRAND.subCopy}</p>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">
            씨앗에서 마음나무까지, 아이와 함께 자라요
          </h2>
        </div>

        {/* 성장 단계 */}
        <div className="mx-auto mb-14 flex max-w-4xl flex-wrap items-center justify-center gap-3 md:gap-6">
          {STAGES.map((stage, i) => (
            <div key={stage.stage} className="flex items-center gap-3 md:gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 md:h-20 md:w-20">
                  <span className="text-3xl md:text-4xl" aria-hidden>
                    {stage.emoji}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">{stage.label}</p>
                <p className="text-xs text-muted-foreground">Lv.{stage.level}</p>
              </div>
              {i < STAGES.length - 1 && (
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* 서비스 플로우 */}
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-4">
          {FLOW.map((item) => (
            <div key={item.step} className="rounded-xl border border-border bg-slate-50 p-5">
              <span className="text-xs font-semibold text-primary">{item.step}</span>
              <h3 className="mt-1 font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center gap-3">
          <Link href="/analysis">
            <Button size="lg" className="gap-2 rounded-full px-8">
              마음 씨앗 찾기
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/activities">
            <Button size="lg" variant="outline" className="rounded-full px-8">
              마음활동 둘러보기
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default SeedJourneySection
