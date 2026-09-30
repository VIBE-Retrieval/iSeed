"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Heart, ThumbsUp } from "lucide-react"
import Link from "next/link"

const reviews = [
  {
    id: 1,
    icon: Heart,
    iconColor: "text-amber-400",
    label: "경청과 공감",
    title: "상담하고 나올 때 아이의\n표정이 점점 밝아져요",
    category: "청소년상담",
    content: "아이가 불안도가 높고, 자신감이 낮아서 상담을 시작했는데요. 회차를 거듭할수록 상담실 문을 나서는 아이의 표정이 밝아져서 부모로서 마음이 편안해요.",
    highlightText: "아이의 표정이 밝아져서 부모로서 마음이 편안해요",
    sessionInfo: "상담 24회차 진행중",
  },
  {
    id: 2,
    icon: ThumbsUp,
    iconColor: "text-primary",
    label: "변화를 이끄는 상담",
    title: "뭘 해도 해결 못한 고민이\n싹 사라졌어요",
    category: "아동상담",
    content: "아이가 마음이 불편할 때 배앓이가 심했는데, 지금은 증상이 싹 사라졌어요. 선생님께 배운 양육지식이 큰 도움이 되었어요.",
    highlightText: "지금은 증상이 싹 사라졌어요",
    sessionInfo: "상담 12회차 진행중",
  },
  {
    id: 3,
    icon: ThumbsUp,
    iconColor: "text-primary",
    label: "변화를 이끄는 상담",
    title: "정신과 약보다\n나아지는 속도가 빨라요",
    category: "성인 개인상담",
    content: "상담 받기 전 2년 동안 우울, 불안으로 병원 다니면서 약을 먹었지만 좋아지지 않았어요. 상담 시작한지 3달도 되기 전에 변하기 시작해서 너무 신기해요.",
    highlightText: "상담 시작한지 3달도 되기 전에 변하기 시작해서",
    sessionInfo: "상담 12회차 진행중",
  },
  {
    id: 4,
    icon: Heart,
    iconColor: "text-amber-400",
    label: "경청과 공감",
    title: "아이와의 관계가\n눈에 띄게 좋아졌어요",
    category: "부모상담",
    content: "아이와 대화가 잘 안되고 갈등이 많았는데, 상담을 통해 아이의 마음을 이해하게 되었어요. 서로 마음을 열고 대화할 수 있게 되었습니다.",
    highlightText: "서로 마음을 열고 대화할 수 있게 되었습니다",
    sessionInfo: "상담 8회차 진행중",
  },
  {
    id: 5,
    icon: ThumbsUp,
    iconColor: "text-primary",
    label: "변화를 이끄는 상담",
    title: "그림에서 아이 마음을\n읽을 수 있게 됐어요",
    category: "그림심리분석",
    content: "아이가 그린 그림이 무엇을 의미하는지 몰랐는데, 분석 결과를 보고 아이의 숨은 감정을 알게 되었어요. 정말 놀라운 경험이었습니다.",
    highlightText: "아이의 숨은 감정을 알게 되었어요",
    sessionInfo: "분석 3회차 완료",
  },
]

const CARD_WIDTH = 240
const CARD_GAP = 16

export function StatsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  // Scroll animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Auto slide every 2.5 seconds
  useEffect(() => {
    if (!isVisible) return
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [isVisible])

  // Calculate translateX for smooth sliding
  const translateX = -currentIndex * (CARD_WIDTH + CARD_GAP)

  return (
    <section 
      ref={sectionRef}
      className="py-12 md:py-16 bg-gradient-to-b from-teal-100 via-teal-50 to-teal-100 overflow-hidden"
    >
      {/* Header */}
      <div 
        className={`text-center mb-8 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Laurel wreath icon */}
        <div className="flex justify-center mb-2">
          <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
            <path d="M24 8C20 8 16 12 14 18C12 14 8 12 6 14C4 16 6 22 10 26C6 28 4 34 6 36C8 38 14 36 18 32C16 38 18 44 22 44C24 44 26 42 26 38" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M24 8C28 8 32 12 34 18C36 14 40 12 42 14C44 16 42 22 38 26C42 28 44 34 42 36C40 38 34 36 30 32C32 38 30 44 26 44C24 44 22 42 22 38" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
        <p className="text-slate-600 text-sm mb-1">
          상담 후에는 이렇게 느끼실 거예요
        </p>
        <h2 className="text-xl md:text-2xl font-bold text-primary">
          생생하고 진솔한 상담 후기
        </h2>
      </div>

      {/* Cards Container */}
      <div 
        className={`relative transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "200ms" }}
      >
        {/* Sliding Track - centers 3 cards */}
        <div 
          className="flex transition-transform duration-700 ease-in-out"
          style={{ 
            transform: `translateX(calc(50% - ${CARD_WIDTH * 1.5 + CARD_GAP}px + ${translateX}px))`,
          }}
        >
          {reviews.map((review, index) => {
            const Icon = review.icon
            // Calculate distance from current center
            const distance = Math.abs(index - currentIndex)
            const isCenter = distance === 0
            const isAdjacent = distance === 1
            
            let opacity = 0.3
            if (isCenter) opacity = 1
            else if (isAdjacent) opacity = 0.5

            return (
              <div
                key={review.id}
                className="flex-shrink-0 transition-opacity duration-700 ease-in-out"
                style={{
                  width: CARD_WIDTH,
                  marginRight: CARD_GAP,
                  opacity,
                }}
              >
                <Card className="bg-white border-0 shadow-sm h-full">
                  <CardContent className="p-3 md:p-4">
                    {/* Label */}
                    <div className="flex items-center gap-1 mb-1.5">
                      <Icon className={`h-3 w-3 ${review.iconColor}`} fill="currentColor" />
                      <span className="text-[10px] text-primary font-medium">{review.label}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xs md:text-sm font-bold text-slate-800 leading-tight whitespace-pre-line mb-1">
                      {review.title}
                    </h3>

                    {/* Category */}
                    <span className="text-[10px] text-slate-400">{review.category}</span>

                    {/* Divider */}
                    <div className="border-t border-slate-100 my-2" />

                    {/* Content */}
                    <p className="text-[10px] md:text-[11px] text-slate-500 leading-relaxed mb-3 line-clamp-4">
                      {review.content.split(review.highlightText).map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && (
                            <span className="text-primary font-medium">{review.highlightText}</span>
                          )}
                        </span>
                      ))}
                    </p>

                    {/* Session Button */}
                    <button className="bg-primary text-white text-[10px] font-medium px-2.5 py-1 rounded">
                      {review.sessionInfo}
                    </button>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </div>

      {/* More Link */}
      <div 
        className={`text-center mt-8 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: "400ms" }}
      >
        <Link 
          href="/community" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors"
        >
          상담 후기 더 보기
          <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center">
            <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </div>
    </section>
  )
}
