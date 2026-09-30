"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Award, Star, Users, Clock } from "lucide-react";

const stats = [
  {
    label: "브랜드 대상",
    value: "1위",
    icon: Award,
    color: "from-amber-400 to-orange-500",
    iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
    ringColor: "ring-amber-200",
  },
  {
    label: "분석 만족도",
    value: "4.9/5",
    icon: Star,
    color: "from-teal-400 to-teal-600",
    iconBg: "bg-gradient-to-br from-teal-400 to-teal-600",
    ringColor: "ring-teal-200",
  },
  {
    label: "누적 분석 수",
    value: "10만+",
    icon: Users,
    color: "from-blue-400 to-indigo-500",
    iconBg: "bg-gradient-to-br from-blue-400 to-indigo-500",
    ringColor: "ring-blue-200",
  },
  {
    label: "온라인 운영",
    value: "24시간",
    icon: Clock,
    color: "from-violet-400 to-purple-500",
    iconBg: "bg-gradient-to-br from-violet-400 to-purple-500",
    ringColor: "ring-violet-200",
  },
];

const benefits = [
  "아이의 숨겨진 감정을 이해하게 됩니다.",
  "발달 상태를 객관적으로 파악하게 됩니다.",
  "아이와의 소통 방법을 알게 됩니다.",
];

export function HowItWorksSection() {
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

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-28 bg-gradient-to-b from-white via-slate-50/50 to-white overflow-hidden relative"
    >
      {/* Subtle background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-teal-50/40 to-transparent rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Header */}
        <div
          className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-50 to-emerald-50 text-primary text-xs font-semibold px-5 py-2 rounded-full mb-5 border border-teal-100/50 shadow-sm">
            <Award className="h-3.5 w-3.5" />
            검증된 서비스
          </div>
          <p className="text-slate-400 mb-3 text-sm tracking-wide">
            수많은 부모님들이 선택한 이유,
          </p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 text-balance leading-tight">
            그만큼 <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500">효과</span>가 있었기 때문입니다
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="max-w-4xl mx-auto mb-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`group relative bg-white rounded-2xl p-6 text-center transition-all duration-700 border border-slate-100 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-2 cursor-default ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${200 + index * 100}ms` }}
                >
                  {/* Hover glow effect */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${stat.iconBg} mb-4 shadow-lg ring-4 ${stat.ringColor} ring-opacity-30 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-400 font-medium tracking-wide">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Divider with dots */}
        <div
          className={`flex justify-center items-center gap-2 mb-14 transition-all duration-700 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-teal-200" />
          <div className="w-2 h-2 rounded-full bg-teal-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-teal-200" />
          <div className="w-1 h-1 rounded-full bg-teal-100" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-teal-200" />
        </div>

        {/* Benefits List */}
        <div className="max-w-xl mx-auto space-y-3">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`group flex items-center gap-4 bg-white rounded-2xl py-4 px-6 transition-all duration-700 border border-slate-100 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-100/50 ${
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-8"
              }`}
              style={{ transitionDelay: `${700 + index * 100}ms` }}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0 shadow-md shadow-teal-500/25 group-hover:scale-110 transition-transform duration-300">
                <Check className="h-4 w-4 text-white" strokeWidth={3} />
              </div>
              <span className="text-slate-700 font-medium text-sm md:text-base">
                {benefit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
