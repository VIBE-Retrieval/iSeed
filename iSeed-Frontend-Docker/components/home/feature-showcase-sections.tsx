"use client";

import { useEffect, useRef, useState } from "react";
import {
  Palette,
  BookImage,
  MessageCircle,
  Users,
  MapPin,
  User,
  ArrowRight,
  Sparkles,
  PenLine,
  Bot,
  Heart,
  Navigation,
  BarChart3,
  Camera,
  Image,
  Send,
  ThumbsUp,
  MessageSquare,
  Search,
  Phone,
  TrendingUp,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsInView(true);
      },
      { threshold },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

/* ─────────────────────────────────────────────
   1. AI 그림 분석
   ───────────────────────────────────────────── */
export function AnalysisShowcase() {
  const { ref, isInView } = useInView();

  return (
    <section
      ref={ref}
      className="py-20 md:py-28 bg-gradient-to-b from-white to-teal-50/30 overflow-hidden"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left - Text */}
          <div
            className={`transition-all duration-700 ${
              isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-600 text-xs font-semibold px-4 py-2 rounded-full mb-5 border border-teal-100/50">
              <Palette className="h-3.5 w-3.5" />
              핵심 기능
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              AI가 읽어주는{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500">
                아이의 마음
              </span>
            </h2>
            <p className="text-slate-500 leading-relaxed mb-8 text-sm md:text-base">
              아이가 그린 그림에는 말로 표현하지 못하는 감정이 담겨 있습니다.
              최신 딥러닝 기술과 아동심리 전문 데이터를 기반으로
              그림 속 색상, 구도, 표현을 종합 분석합니다.
            </p>

            <div className="space-y-3 mb-8">
              {[
                { icon: Sparkles, text: "감정 상태, 자아인식, 대인관계 분석" },
                { icon: BarChart3, text: "또래 비교 발달 데이터 제공" },
                { icon: Camera, text: "사진 촬영으로 간편하게 업로드" },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                    isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                  style={{ transitionDelay: `${300 + i * 100}ms` }}
                >
                  <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-teal-500" />
                  </div>
                  <span className="text-sm text-slate-600">{item.text}</span>
                </div>
              ))}
            </div>

            <Link href="/analysis">
              <Button className="rounded-full px-8 gap-2 shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 transition-all">
                그림 분석 시작하기
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Right - Visual */}
          <div
            className={`transition-all duration-700 ${
              isInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="relative">
              {/* Main card */}
              <div className="bg-white rounded-3xl shadow-xl shadow-teal-100/50 border border-slate-100 p-6 md:p-8">
                {/* Mock drawing area */}
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 mb-6 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-teal-600 font-medium">
                    분석 중...
                  </div>
                  {/* Simple house illustration */}
                  <div className="text-center">
                    <div className="w-20 h-16 bg-amber-200/60 rounded-lg mx-auto relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[44px] border-r-[44px] border-b-[32px] border-l-transparent border-r-transparent border-b-rose-200/60" />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-8 bg-amber-300/60 rounded-t-lg" />
                      <div className="absolute top-2 left-2 w-4 h-4 bg-sky-200/60 rounded-sm" />
                      <div className="absolute top-2 right-2 w-4 h-4 bg-sky-200/60 rounded-sm" />
                    </div>
                    <div className="flex justify-center gap-1 mt-2">
                      <div className="w-8 h-10 bg-green-200/60 rounded-full" />
                      <div className="w-6 h-8 bg-green-300/60 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Mock analysis result */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">감정 분석 결과</span>
                    <span className="text-xs text-teal-500 font-medium bg-teal-50 px-2.5 py-1 rounded-full">완료</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "안정감", value: 85, color: "bg-teal-400" },
                      { label: "자신감", value: 72, color: "bg-emerald-400" },
                      { label: "사회성", value: 90, color: "bg-cyan-400" },
                    ].map((bar, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-12">{bar.label}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${bar.color} rounded-full transition-all duration-1000 ease-out`}
                            style={{
                              width: isInView ? `${bar.value}%` : "0%",
                              transitionDelay: `${800 + i * 200}ms`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 w-8">{bar.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div
                className={`absolute -top-4 -right-4 bg-gradient-to-br from-teal-400 to-emerald-500 text-white rounded-2xl px-4 py-2.5 shadow-lg transition-all duration-700 ${
                  isInView ? "opacity-100 scale-100" : "opacity-0 scale-75"
                }`}
                style={{ transitionDelay: "600ms" }}
              >
                <div className="text-xs font-medium opacity-80">정확도</div>
                <div className="text-lg font-bold">95.2%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   3. AI 챗봇 상담
   ───────────────────────────────────────────── */
export function ChatbotShowcase() {
  const { ref, isInView } = useInView();

  return (
    <section
      ref={ref}
      className="py-20 md:py-28 bg-gradient-to-b from-amber-50/20 to-blue-50/20 overflow-hidden"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left - Text */}
          <div
            className={`transition-all duration-700 ${
              isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 text-xs font-semibold px-4 py-2 rounded-full mb-5 border border-blue-100/50">
              <MessageCircle className="h-3.5 w-3.5" />
              AI 챗봇
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              언제든 상담할 수 있는{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">
                AI 상담사
              </span>
            </h2>
            <p className="text-slate-500 leading-relaxed mb-8 text-sm md:text-base">
              육아에 대한 고민, 아이의 행동이 걱정될 때,
              24시간 언제든 AI 상담사와 대화하세요.
              아동심리 전문 지식을 바탕으로 따뜻하고 정확한 답변을 드립니다.
            </p>

            <div className="space-y-3 mb-8">
              {[
                { icon: Bot, text: "아동심리 전문 AI 상담" },
                { icon: Shield, text: "대화 내용 100% 비공개" },
                { icon: Send, text: "24시간 언제든 이용 가능" },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                    isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                  style={{ transitionDelay: `${300 + i * 100}ms` }}
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-sm text-slate-600">{item.text}</span>
                </div>
              ))}
            </div>

            <Button className="rounded-full px-8 gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/20 transition-all">
              챗봇 상담 시작하기
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Right - Chat Visual */}
          <div
            className={`transition-all duration-700 ${
              isInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="bg-white rounded-3xl shadow-xl shadow-blue-100/50 border border-slate-100 overflow-hidden">
              {/* Chat header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">iSeed AI 마음 도우미</div>
                  <div className="text-white/60 text-xs flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-300" />
                    온라인
                  </div>
                </div>
              </div>

              {/* Chat messages */}
              <div className="p-5 space-y-4 min-h-[320px]">
                {/* Bot message */}
                <div
                  className={`flex gap-2.5 transition-all duration-500 ${
                    isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: "400ms" }}
                >
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="bg-slate-50 rounded-2xl rounded-tl-md px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      안녕하세요! iSeed AI 마음 도우미입니다. 어떤 고민이 있으신가요? 😊
                    </p>
                  </div>
                </div>

                {/* User message */}
                <div
                  className={`flex justify-end transition-all duration-500 ${
                    isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: "700ms" }}
                >
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl rounded-tr-md px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-white leading-relaxed">
                      아이가 요즘 유치원에 가기 싫어하는데 어떻게 해야 할까요?
                    </p>
                  </div>
                </div>

                {/* Bot reply */}
                <div
                  className={`flex gap-2.5 transition-all duration-500 ${
                    isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: "1000ms" }}
                >
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="bg-slate-50 rounded-2xl rounded-tl-md px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      아이가 유치원을 거부하는 것은 흔한 일이에요.
                      먼저 아이의 이야기를 <span className="text-blue-600 font-medium">충분히 들어주시고</span>,
                      유치원에서의 구체적인 상황을 파악해 보세요.
                    </p>
                  </div>
                </div>
              </div>

              {/* Input area */}
              <div className="px-5 pb-5">
                <div className="flex items-center gap-2 bg-slate-50 rounded-full px-4 py-2.5 border border-slate-100">
                  <span className="text-sm text-slate-300 flex-1">메시지를 입력하세요...</span>
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <Send className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   4. 맘스퀘어 (커뮤니티)
   ───────────────────────────────────────────── */
export function CommunityShowcase() {
  const { ref, isInView } = useInView();

  return (
    <section
      ref={ref}
      className="py-20 md:py-28 bg-gradient-to-b from-blue-50/20 to-pink-50/20 overflow-hidden"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left - Visual */}
          <div
            className={`order-2 md:order-1 transition-all duration-700 ${
              isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="bg-white rounded-3xl shadow-xl shadow-pink-100/50 border border-slate-100 p-6">
              {/* Community header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-slate-800 text-sm">맘스퀘어</span>
                </div>
                <span className="text-[10px] text-pink-500 bg-pink-50 px-2.5 py-1 rounded-full font-medium">인기글</span>
              </div>

              {/* Posts */}
              <div className="space-y-3">
                {[
                  {
                    title: "5살 아이 분리불안, 이렇게 극복했어요",
                    author: "행복한맘",
                    likes: 128,
                    comments: 34,
                  },
                  {
                    title: "그림 분석 결과 보고 깜짝 놀랐어요!",
                    author: "아이사랑",
                    likes: 95,
                    comments: 21,
                  },
                  {
                    title: "육아 스트레스 해소법 공유합니다",
                    author: "쑥쑥이맘",
                    likes: 73,
                    comments: 18,
                  },
                ].map((post, i) => (
                  <div
                    key={i}
                    className={`bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-100 transition-all duration-500 hover:border-pink-100 hover:shadow-sm ${
                      isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                    style={{ transitionDelay: `${500 + i * 150}ms` }}
                  >
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">{post.title}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{post.author}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Heart className="w-3 h-3" /> {post.likes}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <MessageSquare className="w-3 h-3" /> {post.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <div
              className={`relative -mt-3 ml-auto mr-4 w-fit bg-gradient-to-br from-pink-400 to-rose-500 text-white rounded-2xl px-4 py-2.5 shadow-lg transition-all duration-700 ${
                isInView ? "opacity-100 scale-100" : "opacity-0 scale-75"
              }`}
              style={{ transitionDelay: "800ms" }}
            >
              <div className="text-xs font-medium opacity-80">활성 회원</div>
              <div className="text-lg font-bold">2,340명</div>
            </div>
          </div>

          {/* Right - Text */}
          <div
            className={`order-1 md:order-2 transition-all duration-700 ${
              isInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-600 text-xs font-semibold px-4 py-2 rounded-full mb-5 border border-pink-100/50">
              <Users className="h-3.5 w-3.5" />
              맘스퀘어
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              함께 나누면{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
                마음이 가벼워져요
              </span>
            </h2>
            <p className="text-slate-500 leading-relaxed mb-8 text-sm md:text-base">
              같은 고민을 가진 부모님들과 경험과 정보를 나눠보세요.
              육아 꿀팁부터 그림 분석 후기까지,
              따뜻한 커뮤니티에서 서로 응원합니다.
            </p>

            <div className="space-y-3 mb-8">
              {[
                { icon: MessageSquare, text: "자유로운 육아 고민 상담" },
                { icon: ThumbsUp, text: "그림 분석 후기 공유" },
                { icon: Heart, text: "서로 응원하는 따뜻한 커뮤니티" },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                    isInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                  }`}
                  style={{ transitionDelay: `${300 + i * 100}ms` }}
                >
                  <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-pink-500" />
                  </div>
                  <span className="text-sm text-slate-600">{item.text}</span>
                </div>
              ))}
            </div>

            <Link href="/community">
              <Button className="rounded-full px-8 gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/20 transition-all">
                맘스퀘어 둘러보기
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   5. 주변 상담소
   ───────────────────────────────────────────── */
export function CounselingShowcase() {
  const { ref, isInView } = useInView();

  return (
    <section
      ref={ref}
      className="py-20 md:py-28 bg-gradient-to-b from-pink-50/20 to-violet-50/20 overflow-hidden"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left - Text */}
          <div
            className={`transition-all duration-700 ${
              isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-50 to-purple-50 text-violet-600 text-xs font-semibold px-4 py-2 rounded-full mb-5 border border-violet-100/50">
              <MapPin className="h-3.5 w-3.5" />
              주변 상담소
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              가까운 곳에서{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-500">
                전문 상담
              </span>
              을 받으세요
            </h2>
            <p className="text-slate-500 leading-relaxed mb-8 text-sm md:text-base">
              내 주변의 전문 아동심리 상담센터를 한눈에 찾아보세요.
              거리, 전문 분야, 후기를 확인하고
              바로 예약까지 연결해 드립니다.
            </p>

            <div className="space-y-3 mb-8">
              {[
                { icon: Search, text: "위치 기반 상담소 검색" },
                { icon: Phone, text: "바로 전화 연결 가능" },
                { icon: Navigation, text: "길찾기 및 거리 안내" },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                    isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                  style={{ transitionDelay: `${300 + i * 100}ms` }}
                >
                  <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-violet-500" />
                  </div>
                  <span className="text-sm text-slate-600">{item.text}</span>
                </div>
              ))}
            </div>

            <Link href="/counseling">
              <Button className="rounded-full px-8 gap-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/20 transition-all">
                주변 상담소 찾기
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Right - Map Visual */}
          <div
            className={`transition-all duration-700 ${
              isInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="bg-white rounded-3xl shadow-xl shadow-violet-100/50 border border-slate-100 overflow-hidden">
              {/* Map mockup */}
              <div className="bg-gradient-to-br from-violet-50 via-slate-50 to-purple-50 p-8 relative min-h-[200px]">
                {/* Map grid lines */}
                <div className="absolute inset-0 opacity-10">
                  {[...Array(6)].map((_, i) => (
                    <div key={`h-${i}`} className="absolute left-0 right-0 border-b border-slate-400" style={{ top: `${(i + 1) * 16.66}%` }} />
                  ))}
                  {[...Array(6)].map((_, i) => (
                    <div key={`v-${i}`} className="absolute top-0 bottom-0 border-r border-slate-400" style={{ left: `${(i + 1) * 16.66}%` }} />
                  ))}
                </div>

                {/* Location pins */}
                {[
                  { top: "20%", left: "30%", delay: "500ms" },
                  { top: "45%", left: "55%", delay: "650ms", main: true },
                  { top: "35%", left: "75%", delay: "800ms" },
                  { top: "65%", left: "25%", delay: "950ms" },
                ].map((pin, i) => (
                  <div
                    key={i}
                    className={`absolute transition-all duration-500 ${
                      isInView ? "opacity-100 scale-100" : "opacity-0 scale-0"
                    }`}
                    style={{ top: pin.top, left: pin.left, transitionDelay: pin.delay }}
                  >
                    <div className={`${pin.main ? "w-10 h-10" : "w-7 h-7"} rounded-full ${pin.main ? "bg-violet-500 ring-4 ring-violet-200" : "bg-violet-300"} flex items-center justify-center shadow-lg`}>
                      <MapPin className={`${pin.main ? "w-5 h-5" : "w-3.5 h-3.5"} text-white`} />
                    </div>
                    {pin.main && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-2 h-2 rounded-full bg-violet-300 animate-ping" />
                    )}
                  </div>
                ))}
              </div>

              {/* Counseling center list */}
              <div className="p-5 space-y-3">
                {[
                  { name: "마음숲 아동상담센터", distance: "350m", rating: "4.9", specialty: "아동심리" },
                  { name: "행복한 마음 클리닉", distance: "1.2km", rating: "4.8", specialty: "청소년상담" },
                ].map((center, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 bg-slate-50 rounded-xl p-3.5 border border-slate-100 transition-all duration-500 ${
                      isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                    style={{ transitionDelay: `${1000 + i * 150}ms` }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-700 truncate">{center.name}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{center.distance}</span>
                        <span>·</span>
                        <span>⭐ {center.rating}</span>
                        <span>·</span>
                        <span>{center.specialty}</span>
                      </div>
                    </div>
                    <Phone className="w-4 h-4 text-violet-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   6. 마이페이지
   ───────────────────────────────────────────── */
export function MypageShowcase() {
  const { ref, isInView } = useInView();

  return (
    <section
      ref={ref}
      className="py-20 md:py-28 bg-gradient-to-b from-violet-50/20 to-slate-50 overflow-hidden"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left - Visual */}
          <div
            className={`order-2 md:order-1 transition-all duration-700 ${
              isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
              {/* Profile header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="font-bold text-slate-800">김서연 님</div>
                  <div className="text-xs text-slate-400">가입일: 2025.01.15</div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "분석 횟수", value: "24", color: "from-teal-50 to-emerald-50", textColor: "text-teal-600" },
                  { label: "마음활동", value: "56", color: "from-amber-50 to-orange-50", textColor: "text-amber-600" },
                  { label: "연속 기록", value: "12일", color: "from-blue-50 to-indigo-50", textColor: "text-blue-600" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={`bg-gradient-to-br ${stat.color} rounded-xl p-3 text-center transition-all duration-500 ${
                      isInView ? "opacity-100 scale-100" : "opacity-0 scale-90"
                    }`}
                    style={{ transitionDelay: `${500 + i * 100}ms` }}
                  >
                    <div className={`text-xl font-bold ${stat.textColor}`}>{stat.value}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Growth chart */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-600">월별 성장 리포트</span>
                  <span className="text-[10px] text-teal-500 font-medium">전체보기</span>
                </div>
                <div className="flex items-end gap-2 h-20">
                  {[30, 45, 40, 55, 65, 60, 75, 80, 70, 85, 90, 88].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-gradient-to-t from-teal-400 to-teal-200 rounded-t-sm transition-all duration-700"
                        style={{
                          height: isInView ? `${h}%` : "0%",
                          transitionDelay: `${800 + i * 60}ms`,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[8px] text-slate-300">1월</span>
                  <span className="text-[8px] text-slate-300">12월</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Text */}
          <div
            className={`order-1 md:order-2 transition-all duration-700 ${
              isInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-100 to-slate-50 text-slate-600 text-xs font-semibold px-4 py-2 rounded-full mb-5 border border-slate-200/50">
              <User className="h-3.5 w-3.5" />
              마이페이지
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              아이의 성장을{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-800">
                한눈에 확인
              </span>
            </h2>
            <p className="text-slate-500 leading-relaxed mb-8 text-sm md:text-base">
              그림 분석 기록, 마음활동, 씨앗 성장까지
              아이의 모든 성장 데이터를 한곳에서 관리하고
              월별 리포트로 확인하세요.
            </p>

            <div className="space-y-3 mb-8">
              {[
                { icon: BarChart3, text: "분석 기록 & 성장 리포트" },
                { icon: TrendingUp, text: "감정 변화 추이 그래프" },
                { icon: Shield, text: "개인정보 안전 관리" },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                    isInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                  }`}
                  style={{ transitionDelay: `${300 + i * 100}ms` }}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="text-sm text-slate-600">{item.text}</span>
                </div>
              ))}
            </div>

            <Link href="/mypage">
              <Button className="rounded-full px-8 gap-2 bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 shadow-lg shadow-slate-500/20 transition-all">
                마이페이지 가기
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
