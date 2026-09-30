"use client"

import { Check } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const features = [
  {
    image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&h=400&fit=crop",
    label: "아이의 마음을 읽는",
    title: "AI 그림 분석",
    description: "그림에 담긴 아이의 마음,\n이제 AI로 정확하게 읽어보세요!",
    checks: ["최신 딥러닝 기반 분석", "아동 심리 전문가 검증"],
  },
  {
    image: "https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=600&h=400&fit=crop",
    label: "일회성이 아닌",
    title: "성장 추적 시스템",
    description: "한 번으로 끝나지 않는,\n아이의 성장을 함께 기록해요!",
    checks: ["시간별 변화 추적", "발달 단계별 맞춤 분석"],
  },
  {
    image: "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=600&h=400&fit=crop",
    label: "프라이버시 철통 보안",
    title: "안전한 공간",
    description: "누가 알까봐,\n걱정되는 마음 놓으세요!",
    checks: ["데이터 암호화 보관", "100% 비공개 분석"],
  },
]

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return { ref, isInView }
}

export function FeaturesSection() {
  const headerRef = useInView(0.2)
  const cardsRef = useInView(0.1)

  return (
    <section className="py-20 md:py-28 bg-slate-100 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div 
          ref={headerRef.ref}
          className={`text-center max-w-3xl mx-auto mb-14 transition-all duration-700 ease-out ${
            headerRef.isInView 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-muted-foreground mb-2">
            단순한 그림 분석이 아닙니다
          </p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
            iSeed는 아이의 마음을 발견하고 함께 키웁니다
          </h2>
        </div>

        {/* Cards */}
        <div 
          ref={cardsRef.ref}
          className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto"
        >
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`flex flex-col transition-all duration-700 ease-out ${
                cardsRef.isInView 
                  ? "opacity-100 translate-y-0" 
                  : "opacity-0 translate-y-12"
              }`}
              style={{ 
                transitionDelay: cardsRef.isInView ? `${index * 150}ms` : "0ms" 
              }}
            >
              {/* Image */}
              <div className={`aspect-[4/3] rounded-xl overflow-hidden mb-6 transition-all duration-700 ease-out ${
                cardsRef.isInView 
                  ? "opacity-100 scale-100" 
                  : "opacity-0 scale-95"
              }`}
              style={{ 
                transitionDelay: cardsRef.isInView ? `${index * 150 + 100}ms` : "0ms" 
              }}
              >
                <img
                  src={feature.image || "/placeholder.svg"}
                  alt={feature.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Content */}
              <div className={`text-center transition-all duration-700 ease-out ${
                cardsRef.isInView 
                  ? "opacity-100 translate-y-0" 
                  : "opacity-0 translate-y-4"
              }`}
              style={{ 
                transitionDelay: cardsRef.isInView ? `${index * 150 + 200}ms` : "0ms" 
              }}
              >
                <p className="text-sm text-muted-foreground mb-1">
                  {feature.label}
                </p>
                <h3 className="text-xl font-bold text-primary mb-4">
                  {feature.title}
                </h3>
                
                {/* Divider */}
                <div className={`h-px bg-slate-300 mx-auto mb-4 transition-all duration-500 ease-out ${
                  cardsRef.isInView ? "w-12" : "w-0"
                }`}
                style={{ 
                  transitionDelay: cardsRef.isInView ? `${index * 150 + 300}ms` : "0ms" 
                }}
                />
                
                {/* Description */}
                <p className="text-sm text-muted-foreground whitespace-pre-line mb-4 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Checks */}
                <div className="space-y-2">
                  {feature.checks.map((check, checkIndex) => (
                    <div 
                      key={checkIndex} 
                      className={`flex items-center justify-center gap-2 text-sm transition-all duration-500 ease-out ${
                        cardsRef.isInView 
                          ? "opacity-100 translate-x-0" 
                          : "opacity-0 -translate-x-4"
                      }`}
                      style={{ 
                        transitionDelay: cardsRef.isInView ? `${index * 150 + 400 + checkIndex * 100}ms` : "0ms" 
                      }}
                    >
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">{check}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
