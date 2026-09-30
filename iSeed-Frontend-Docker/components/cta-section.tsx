"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"

const steps = [
  {
    step: "01",
    title: "그림 업로드 또는 직접 그리기",
    time: "*1분 이내 소요",
    description: "아이의 그림을 촬영하여 업로드하거나, 앱에서 직접 그릴 수 있습니다. 집 그림, 나무 그림, 가족 그림 등 다양한 유형의 그림을 분석할 수 있습니다.",
    highlight: "다양한 유형의 그림을 분석"
  },
  {
    step: "02", 
    title: "AI 심층 분석 진행",
    time: "*약 30초 소요",
    description: "전문 아동심리 데이터를 학습한 AI가 그림의 색상, 구도, 표현 방식 등을 종합적으로 분석합니다. 발달심리학 기반의 정확한 분석 결과를 제공합니다.",
    highlight: "발달심리학 기반의 정확한 분석"
  },
  {
    step: "03",
    title: "맞춤형 분석 결과 확인",
    time: "",
    description: "감정 상태, 대인관계, 자아인식 등 다양한 영역의 분석 결과를 확인하세요. 또래 아이들과의 발달 비교 데이터도 함께 제공됩니다.",
    highlight: "또래 아이들과의 발달 비교"
  },
  {
    step: "04",
    title: "맞춤 솔루션 및 활동 추천",
    time: "",
    description: "분석 결과에 따른 추천 도서, 놀이 활동, 대화법 등을 안내해 드립니다. 필요시 주변 전문 상담센터 연결도 가능합니다.",
    highlight: "주변 전문 상담센터 연결"
  }
]

export function CTASection() {
  const [openIndex, setOpenIndex] = useState(0)

  const toggleStep = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index)
  }

  const renderDescription = (description: string, highlight: string) => {
    if (!highlight) return description
    const parts = description.split(highlight)
    return (
      <>
        {parts[0]}
        <span className="text-primary font-medium">{highlight}</span>
        {parts[1]}
      </>
    )
  }

  return (
    <section className="py-16 md:py-24 bg-slate-100">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            iSeed 맞춤 분석 프로세스
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            아이의 마음을 더 쉽게 이해할 수 있도록, 부모님의 첫걸음이 헛되지 않도록,<br className="hidden md:block" />
            iSeed 분석 서비스가 책임집니다
          </p>
        </div>

        {/* Accordion Steps */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`border-b border-slate-100 last:border-b-0 ${openIndex === index ? 'bg-white' : 'bg-white'}`}
              >
                {/* Step Header */}
                <button
                  onClick={() => toggleStep(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-primary font-bold text-sm">STEP {step.step}</span>
                    <span className="font-semibold text-foreground">{step.title}</span>
                    {step.time && (
                      <span className="text-xs text-muted-foreground">{step.time}</span>
                    )}
                  </div>
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                </button>

                {/* Step Content */}
                {openIndex === index && (
                  <div className="px-6 pb-6">
                    <div className="pl-[72px] text-sm text-muted-foreground leading-relaxed">
                      {renderDescription(step.description, step.highlight)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
