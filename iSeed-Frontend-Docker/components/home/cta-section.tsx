"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Upload,
  Brain,
  BarChart3,
  Lightbulb,
} from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Upload,
    color: "from-blue-400 to-blue-600",
    ringColor: "ring-blue-200",
    accentBg: "bg-blue-50",
    title: "그림 업로드 또는 직접 그리기",
    time: "1분 이내 소요",
    description:
      "아이의 그림을 촬영하여 업로드하거나, 앱에서 직접 그릴 수 있습니다. 집 그림, 나무 그림, 가족 그림 등 다양한 유형의 그림을 분석할 수 있습니다.",
    highlight: "다양한 유형의 그림을 분석",
  },
  {
    step: "02",
    icon: Brain,
    color: "from-teal-400 to-teal-600",
    ringColor: "ring-teal-200",
    accentBg: "bg-teal-50",
    title: "AI 심층 분석 진행",
    time: "약 30초 소요",
    description:
      "전문 아동심리 데이터를 학습한 AI가 그림의 색상, 구도, 표현 방식 등을 종합적으로 분석합니다. 발달심리학 기반의 정확한 분석 결과를 제공합니다.",
    highlight: "발달심리학 기반의 정확한 분석",
  },
  {
    step: "03",
    icon: BarChart3,
    color: "from-amber-400 to-orange-500",
    ringColor: "ring-amber-200",
    accentBg: "bg-amber-50",
    title: "맞춤형 분석 결과 확인",
    time: "",
    description:
      "감정 상태, 대인관계, 자아인식 등 다양한 영역의 분석 결과를 확인하세요. 또래 아이들과의 발달 비교 데이터도 함께 제공됩니다.",
    highlight: "또래 아이들과의 발달 비교",
  },
  {
    step: "04",
    icon: Lightbulb,
    color: "from-violet-400 to-purple-500",
    ringColor: "ring-violet-200",
    accentBg: "bg-violet-50",
    title: "맞춤 솔루션 및 활동 추천",
    time: "",
    description:
      "분석 결과에 따른 추천 도서, 놀이 활동, 대화법 등을 안내해 드립니다. 필요시 주변 전문 상담센터 연결도 가능합니다.",
    highlight: "주변 전문 상담센터 연결",
  },
];

export function CTASection() {
  const [openIndex, setOpenIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.15 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const toggleStep = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  const renderDescription = (description: string, highlight: string) => {
    if (!highlight) return description;
    const parts = description.split(highlight);
    return (
      <>
        {parts[0]}
        <span className="text-teal-600 font-semibold">{highlight}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden relative"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-teal-50/30 to-transparent rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-violet-50/20 to-transparent rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Header */}
        <div
          className={`text-center mb-14 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-50 to-emerald-50 text-primary text-xs font-semibold px-5 py-2 rounded-full mb-5 border border-teal-100/50 shadow-sm">
            <Brain className="h-3.5 w-3.5" />
            분석 프로세스
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 text-balance leading-tight">
            마음그림 <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500">맞춤 분석</span> 프로세스
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed tracking-wide">
            아이의 마음을 더 쉽게 이해할 수 있도록,
            <br className="hidden md:block" />
            마음그림 전문 분석 서비스가 책임집니다
          </p>
        </div>

        {/* Steps with timeline */}
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[2.15rem] top-8 bottom-8 w-px bg-gradient-to-b from-blue-200 via-teal-200 via-amber-200 to-violet-200 hidden md:block" />

            <div className="space-y-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isOpen = openIndex === index;

                return (
                  <div
                    key={index}
                    className={`relative transition-all duration-700 ${
                      isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-8"
                    }`}
                    style={{ transitionDelay: `${200 + index * 100}ms` }}
                  >
                    <div
                      className={`bg-white rounded-2xl border transition-all duration-500 ${
                        isOpen
                          ? "border-teal-200/60 shadow-xl shadow-teal-100/40"
                          : "border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200"
                      }`}
                    >
                      {/* Step Header */}
                      <button
                        onClick={() => toggleStep(index)}
                        className="w-full px-5 md:px-6 py-4 md:py-5 flex items-center gap-4 text-left group"
                      >
                        {/* Step Icon */}
                        <div
                          className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shrink-0 shadow-lg ring-4 ${step.ringColor} ring-opacity-25 group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-600 text-xs font-bold tracking-wider">
                              STEP {step.step}
                            </span>
                            {step.time && (
                              <span className="text-[10px] text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-100">
                                {step.time}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-slate-800 text-sm md:text-base truncate">
                            {step.title}
                          </h3>
                        </div>

                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                            isOpen
                              ? "bg-teal-50 rotate-180"
                              : "bg-slate-50 group-hover:bg-slate-100"
                          }`}
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-colors duration-300 ${
                              isOpen ? "text-teal-500" : "text-slate-400"
                            }`}
                          />
                        </div>
                      </button>

                      {/* Step Content */}
                      <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${
                          isOpen
                            ? "max-h-40 opacity-100"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="px-5 md:px-6 pb-5 pl-[4.75rem]">
                          <div className={`${step.accentBg} rounded-xl p-4`}>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {renderDescription(
                                step.description,
                                step.highlight,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom connector */}
          <div
            className={`flex justify-center mt-10 transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "700ms" }}
          >
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-slate-200" />
              <span className="bg-gradient-to-r from-teal-50 to-emerald-50 px-4 py-1.5 rounded-full border border-teal-100/50 text-teal-600 font-medium text-xs">
                간단한 4단계로 완료
              </span>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
