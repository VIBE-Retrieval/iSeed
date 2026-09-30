"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Check,
  Smartphone,
  ArrowRight,
  Shield,
  Zap,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Shield,
    color: "bg-gradient-to-br from-blue-500 to-indigo-500",
    ringColor: "ring-blue-200",
    title: "프라이버시 보장",
    items: [
      { text: "분석 기록이 남지 않아요", highlight: false },
      { text: "가명으로 분석", highlight: true, suffix: "할 수 있어요" },
    ],
  },
  {
    icon: Zap,
    color: "bg-gradient-to-br from-amber-400 to-orange-500",
    ringColor: "ring-amber-200",
    title: "간편한 그림 분석",
    items: [
      { text: "사진 한 장으로", highlight: true, suffix: " 바로 분석!" },
      { text: "분석 결과, 솔루션까지 한번에!", highlight: false },
    ],
  },
];

export function DailyTipSection() {
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
      className="py-16 md:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden relative"
    >
      {/* Background decoration */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-bl from-teal-50/50 to-transparent rounded-full pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-72 h-72 bg-gradient-to-tr from-blue-50/50 to-transparent rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        {/* Header */}
        <div
          className={`text-center mb-14 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-slate-400 text-sm mb-2 tracking-wide">
            센터에 직접 연락하기 어렵다면,
          </p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-10 text-balance">
            앱으로 <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500">간편하게</span> 그림 분석
          </h2>
          <Link href="/analysis">
            <Button
              size="lg"
              className="rounded-full px-10 gap-2 h-13 text-base shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300"
            >
              <Sparkles className="h-4 w-4" />
              그림 분석하기
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto">
          <div
            className={`bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-12"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left - Phone Visual */}
              <div className="bg-gradient-to-br from-teal-400 via-teal-500 to-teal-700 p-8 md:p-12 flex items-center justify-center min-h-[400px] relative overflow-hidden">
                {/* Animated background orbs */}
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/[0.07] rounded-full animate-pulse" style={{ animationDuration: "4s" }} />
                <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/[0.05] rounded-full animate-pulse" style={{ animationDuration: "6s" }} />
                <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/[0.04] rounded-full animate-pulse" style={{ animationDuration: "5s" }} />

                <div className="relative flex items-end gap-3">
                  {/* Phone 1 (background) */}
                  <div
                    className={`w-36 md:w-40 -mr-6 transition-all duration-1000 ${
                      isVisible ? "opacity-60 translate-y-0" : "opacity-0 translate-y-8"
                    }`}
                    style={{ transitionDelay: "500ms" }}
                  >
                    <div className="bg-white/15 backdrop-blur-md rounded-2xl p-1.5 shadow-2xl border border-white/20">
                      <div className="bg-white rounded-xl overflow-hidden">
                        {/* Status bar */}
                        <div className="flex items-center justify-between px-3 pt-2 pb-1">
                          <div className="h-1.5 w-8 bg-slate-200 rounded" />
                          <div className="flex gap-1">
                            <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
                            <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
                          </div>
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 rounded-full bg-teal-100" />
                            <div className="h-2 w-14 bg-slate-100 rounded" />
                          </div>
                          <div className="h-14 bg-gradient-to-r from-slate-50 to-teal-50/50 rounded-lg" />
                          <div className="h-14 bg-gradient-to-r from-slate-50 to-teal-50/50 rounded-lg" />
                          <div className="h-8 bg-slate-50 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phone 2 (foreground) */}
                  <div
                    className={`w-44 md:w-52 relative z-10 transition-all duration-1000 ${
                      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                    }`}
                    style={{ transitionDelay: "400ms" }}
                  >
                    <div className="bg-white/20 backdrop-blur-md rounded-3xl p-1.5 shadow-2xl border border-white/30">
                      <div className="bg-gradient-to-b from-white to-teal-50/80 rounded-2xl p-5 min-h-[280px] flex flex-col items-center justify-center relative">
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-b-2xl" />

                        <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mb-4 shadow-xl shadow-teal-500/30 mt-4">
                          <Smartphone className="w-9 h-9 text-white" />
                        </div>
                        <span className="text-slate-800 font-bold text-lg mb-0.5">
                          마음그림
                        </span>
                        <span className="text-slate-400 text-xs tracking-wide">
                          AI 그림 심리 분석
                        </span>
                        <div className="mt-5 w-full space-y-2.5">
                          <div className="h-2.5 bg-gradient-to-r from-teal-200 to-teal-100 rounded-full w-full" />
                          <div className="h-2.5 bg-gradient-to-r from-teal-100 to-teal-50 rounded-full w-3/4" />
                          <div className="h-2.5 bg-teal-50 rounded-full w-1/2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right - Features */}
              <div className="p-6 md:p-10 flex flex-col justify-center">
                <div className="space-y-5">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={index}
                        className={`group rounded-2xl border border-slate-100 overflow-hidden transition-all duration-700 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-50 ${
                          isVisible
                            ? "opacity-100 translate-x-0"
                            : "opacity-0 translate-x-8"
                        }`}
                        style={{ transitionDelay: `${400 + index * 150}ms` }}
                      >
                        {/* Feature Header */}
                        <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white">
                          <div
                            className={`w-9 h-9 rounded-xl ${feature.color} flex items-center justify-center shadow-md ring-2 ${feature.ringColor} ring-opacity-30 group-hover:scale-110 transition-transform duration-300`}
                          >
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-bold text-slate-800 text-sm">
                            {feature.title}
                          </span>
                        </div>
                        {/* Feature Content */}
                        <div className="px-5 py-4 bg-white">
                          <div className="space-y-3">
                            {feature.items.map((item, itemIndex) => (
                              <div
                                key={itemIndex}
                                className="flex items-start gap-3"
                              >
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                                  <Check
                                    className="w-3 h-3 text-teal-600"
                                    strokeWidth={3}
                                  />
                                </div>
                                <span className="text-sm text-slate-600 leading-relaxed">
                                  {item.highlight ? (
                                    <>
                                      <span className="text-teal-600 font-semibold">
                                        {item.text}
                                      </span>
                                      {item.suffix}
                                    </>
                                  ) : (
                                    item.text
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
