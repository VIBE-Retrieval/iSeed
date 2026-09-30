"use client"

import { Button } from "@/components/ui/button"
import { Check, Lock, Calendar } from "lucide-react"
import Link from "next/link"

const features = [
  {
    icon: Lock,
    title: "프라이버시 보장",
    items: [
      { text: "분석 기록이 남지 않아요", highlight: false },
      { text: "가명으로 분석", highlight: true, suffix: "할 수 있어요" },
    ],
  },
  {
    icon: Calendar,
    title: "간편한 그림 분석",
    items: [
      { text: "사진 한 장으로", highlight: true, suffix: " 바로 분석!" },
      { text: "분석 결과, 솔루션까지 한번에!", highlight: false },
    ],
  },
]

export function DailyTipSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-teal-50 to-teal-100/50">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-slate-600 mb-2">센터에 직접 연락하기 어렵다면,</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            앱으로 간편하게 그림 분석
          </h2>
          <Link href="/analysis">
            <Button className="rounded-full px-8">
              그림 분석하기
            </Button>
          </Link>
        </div>

        {/* Content Card */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Phone Mockups */}
              <div className="relative flex justify-center items-end gap-4">
                {/* Phone 1 */}
                <div className="relative w-40 md:w-48">
                  <div className="bg-slate-100 rounded-[2rem] p-2 shadow-lg">
                    <div className="bg-white rounded-[1.5rem] overflow-hidden">
                      <div className="bg-slate-50 p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-primary/20" />
                          <div className="h-2 w-16 bg-slate-200 rounded" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-16 bg-slate-100 rounded-lg" />
                          <div className="h-16 bg-slate-100 rounded-lg" />
                          <div className="h-10 bg-slate-100 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Phone 2 */}
                <div className="relative w-44 md:w-52 -ml-8 z-10">
                  <div className="bg-gradient-to-br from-teal-400 to-teal-500 rounded-[2rem] p-2 shadow-xl">
                    <div className="bg-gradient-to-br from-teal-300 to-teal-400 rounded-[1.5rem] p-6 min-h-[280px] flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-3 overflow-hidden">
                        <img src="/iseed.png" alt="iSeed" className="w-7 h-7 object-contain" />
                      </div>
                      <span className="text-white font-medium text-sm">iSeed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="border border-slate-100 rounded-xl overflow-hidden">
                    {/* Feature Header */}
                    <div className="bg-primary px-4 py-3 flex items-center gap-2">
                      <feature.icon className="w-4 h-4 text-white" />
                      <span className="font-medium text-white text-sm">{feature.title}</span>
                    </div>
                    {/* Feature Content */}
                    <div className="p-4 bg-white">
                      <div className="space-y-2 mb-4">
                        {feature.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-600">
                              {item.highlight ? (
                                <>
                                  <span className="text-primary font-medium">{item.text}</span>
                                  {item.suffix}
                                </>
                              ) : (
                                item.text
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                      {/* Mini Screenshot */}
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex gap-2">
                          <div className="flex-1 h-8 bg-slate-100 rounded" />
                          <div className="flex-1 h-8 bg-slate-100 rounded" />
                        </div>
                        <div className="mt-2 h-6 bg-primary/10 rounded flex items-center justify-center">
                          <span className="text-[10px] text-primary font-medium">
                            {index === 0 ? "익명 분석 가능" : "바로 분석하기"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
