import { Check, ChevronDown } from "lucide-react"

const stats = [
  {
    label: "브랜드 대상",
    value: "1위",
  },
  {
    label: "분석 만족도",
    value: "4.9/5점",
  },
  {
    label: "누적 분석 수",
    value: "10만 건",
  },
  {
    label: "온라인",
    value: "24시 운영",
  },
]

const benefits = [
  "아이의 숨겨진 감정을 이해하게 됩니다.",
  "발달 상태를 객관적으로 파악하게 됩니다.",
  "아이와의 소통 방법을 알게 됩니다.",
]

export function HowItWorksSection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-slate-500 mb-2">
            수많은 부모님들이 선택한 이유,
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            그만큼 효과가 있었기 때문입니다
          </h2>
        </div>

        {/* Stats Card */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gradient-to-r from-teal-50 via-teal-100 to-teal-200 rounded-[2rem] p-8 md:p-10">
            <div className="flex flex-wrap justify-center gap-4 md:gap-0 md:justify-between">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center justify-center w-28 h-28 md:w-32 md:h-32 rounded-full"
                  style={{
                    background: `linear-gradient(180deg, 
                      hsl(175, ${45 + index * 12}%, ${85 - index * 8}%) 0%, 
                      hsl(175, ${50 + index * 12}%, ${75 - index * 8}%) 100%)`
                  }}
                >
                  <span className="text-xs text-slate-600 mb-1">{stat.label}</span>
                  <span className="text-xl md:text-2xl font-bold text-slate-800">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center mb-8">
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
            <ChevronDown className="h-6 w-6 text-primary" />
          </div>
        </div>

        {/* Benefits List */}
        <div className="max-w-2xl mx-auto space-y-3">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="flex items-center justify-center gap-3 bg-slate-50 rounded-full py-4 px-6"
            >
              <Check className="h-5 w-5 text-primary shrink-0" />
              <span className="text-slate-700 font-medium">{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
