"use client";

import React from "react";

import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, Send, Bot, User, Minimize2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const defaultWelcomeMessage: Message = {
  id: "1",
  role: "assistant",
  content:
    "안녕하세요! iSeed 마음 도우미입니다. 아이의 그림 심리 분석이나 서비스 이용에 대해 궁금한 점이 있으시면 편하게 물어보세요.",
  timestamp: new Date(),
};

const analysisWelcomeMessage: Message = {
  id: "1",
  role: "assistant",
  content:
    "해석 결과에 대해 추가 설명이 필요하시면 말씀해 주세요. '결과에서는 자신감이 부족하다고 나왔는데, 우리 아이는 오히려 자신감이 넘쳐요. 왜 그럴 수 있나요?'처럼 분석과 실제가 다를 때의 궁금증도 편하게 물어보세요.",
  timestamp: new Date(),
};

const defaultResponses = [
  "마음검사는 아이가 그린 집·나무·사람 그림 4장을 AI가 살펴보고 마음 리포트로 정리해 드려요. 상단 메뉴의 '마음검사'에서 시작하실 수 있어요.",
  "아이의 그림에는 감정과 생각이 담겨 있습니다. 색상 사용, 크기, 위치 등을 종합적으로 분석하여 아이의 마음을 이해할 수 있도록 도와드려요.",
  "분석이 끝나면 결과에 맞는 마음활동을 추천해 드려요. 활동을 마칠 때마다 아이의 마음 씨앗이 자랍니다.",
  "상단 메뉴의 '마음활동'에서 호흡, 마음 색깔, 친구의 마음 같은 활동을 아이와 함께 해보실 수 있어요.",
  "지금은 답변을 준비하지 못했어요. 잠시 후 다시 물어봐 주세요.",
];

const analysisResponses = [
  "종합 점수는 여러 요소(구성요소, 색상 사용, 공간 활용, 표현력)를 종합해 산출한 지표입니다. 점수가 높을수록 전반적인 표현이 안정적이라는 의미예요.",
  "발달 단계 평가는 연령대 평균과 비교한 지표로, 또래 대비 어떤 부분이 강점/보완인지 알려줍니다. 궁금한 항목을 지정해 주세요.",
  "감정 상태 해석은 색상·크기·배치와 같은 표현 특성을 기반으로 합니다. 특정 색상이나 요소의 의미가 궁금하시면 알려 주세요.",
  "그림 검사는 그 순간의 표현을 바탕으로 한 참고 지표예요. 일상에서 보이는 모습과 다를 수 있으며, 그 차이에 대한 이유도 설명해 드릴 수 있어요.",
  "추가 설명이 필요한 결과 항목을 콕 집어 말씀해 주시면 그 부분을 더 자세히 풀어드릴게요.",
];

/** 결과 페이지에서 sessionStorage/globalThis에 저장된 분석 결과를 읽어 챗봇용 컨텍스트로 변환합니다. */
function getAnalysisContextForChatbot(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  const g = globalThis as typeof globalThis & { __analysisResponse?: unknown };
  let raw: unknown = g.__analysisResponse;
  if (!raw) {
    try {
      const s = sessionStorage.getItem("analysisResponse");
      raw = s ? JSON.parse(s) : null;
    } catch {
      raw = null;
    }
  }
  if (!raw || typeof raw !== "object") return null;
  const response = raw as Record<string, unknown>;
  const child = (response.child as Record<string, unknown>) || {};
  const results = (response.results as Record<string, unknown>) || {};
  const comparison = (response.comparison as Record<string, unknown>) || {};
  const psych = (comparison.psychology as Record<string, unknown>)?.scores as
    | Record<string, number>
    | undefined;
  const overall = (response["전체_심리_결과"] as Record<string, unknown>) || {};
  const drawingScores = (
    comparison.drawing_scores as Record<string, unknown> | undefined
  )?.aggregated as Record<string, unknown> | undefined;
  const activityRec = response.activity_recommendations as
    | { activities?: { id: string; title: string }[] }
    | undefined;

  // 그림별 해석은 interpretation 만 추려서 보냄 (image_json·metrics 등 대용량 필드 제외)
  const interpretations: Record<string, unknown> = {};
  for (const key of ["tree", "house", "man", "woman"]) {
    const interp = (results[key] as Record<string, unknown> | undefined)
      ?.interpretation;
    if (interp) interpretations[key] = { interpretation: interp };
  }

  return {
    childName: child.name ?? "아이",
    age: child.age ?? "-",
    overallScore: comparison.overall_score ?? 0,
    summary: typeof overall["종합_요약"] === "string" ? overall["종합_요약"] : "",
    developmentStage:
      (comparison.development as Record<string, unknown>)?.stage ?? "",
    emotionalState: comparison.emotional_state ?? "",
    psychologyScores: psych ?? undefined,
    drawingScores: drawingScores ?? undefined,
    overall,
    interpretations,
    activities: activityRec?.activities?.map((a) => ({ id: a.id, title: a.title })) ?? [],
  };
}

export function ChatbotModal() {
  const pathname = usePathname();
  const isAnalysisResult = pathname?.startsWith("/analysis/result");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [
    isAnalysisResult ? analysisWelcomeMessage : defaultWelcomeMessage,
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const responses = useMemo(
    () => (isAnalysisResult ? analysisResponses : defaultResponses),
    [isAnalysisResult],
  );
  const chatbotBaseUrl =
    process.env.NEXT_PUBLIC_AIMODELS_BASE_URL ?? "http://localhost:8080";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const adjustTextareaHeight = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const maxHeight = 100; // 약 4줄
    ta.style.height = `${Math.max(40, Math.min(ta.scrollHeight, maxHeight))}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  useEffect(() => {
    setMessages([
      isAnalysisResult ? analysisWelcomeMessage : defaultWelcomeMessage,
    ]);
    setIsOpen(false);
  }, [isAnalysisResult]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const body: {
        question: string;
        analysis_context?: Record<string, unknown>;
      } = {
        question: userMessage.content,
      };
      if (isAnalysisResult) {
        const analysisContext = getAnalysisContextForChatbot();
        if (analysisContext) body.analysis_context = analysisContext;
      }
      const response = await fetch(`${chatbotBaseUrl}/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error("챗봇 응답 실패");
      }
      const data = (await response.json()) as { answer?: string };
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          data.answer?.trim() ||
          "현재 답변을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed z-50 shadow-lg transition-all duration-300 flex items-center justify-center ${
          isAnalysisResult
            ? "bottom-6 left-1/2 h-14 w-[calc(100vw-32px)] max-w-[640px] -translate-x-1/2 rounded-full bg-primary text-white hover:bg-primary/90 px-6"
            : "bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-white hover:bg-primary/90"
        } ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
        aria-label="채팅 열기"
      >
        {isAnalysisResult ? (
          <>
            <MessageCircle className="h-5 w-5 mr-2" />
            <span className="text-sm md:text-base font-medium">
              추가적인 설명이 필요하신가요?
            </span>
          </>
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Chat Modal */}
      <div
        className={`fixed z-50 w-[360px] max-w-[calc(100vw-48px)] h-[480px] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 ${
          isAnalysisResult
            ? "bottom-24 left-1/2 -translate-x-1/2"
            : "bottom-24 right-6"
        } ${isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4 pointer-events-none"}`}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-primary px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                iSeed 마음 도우미
              </h3>
              <p className="text-white/80 text-xs">무엇이든 물어보세요</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="채팅 최소화"
            >
              <Minimize2 className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="채팅 닫기"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.role === "user"
                    ? "bg-primary text-white"
                    : "bg-white border border-slate-200 text-primary"
                }`}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-white rounded-tr-sm"
                    : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm"
                }`}
              >
                {message.role === "assistant" ? (
                  <div
                    className="text-sm leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: message.content }}
                  />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {message.content}
                  </p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span
                    className="h-2 w-2 bg-slate-300 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-2 w-2 bg-slate-300 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-2 w-2 bg-slate-300 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 p-3 bg-white border-t border-slate-200">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              className="flex-1 border-slate-200 focus:border-primary rounded-2xl px-4 py-2.5 min-h-[40px] max-h-[100px] resize-none overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              disabled={isLoading}
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="rounded-full h-10 w-10 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            AI 상담 도우미는 참고용이며, 전문 상담을 대체하지 않습니다.
          </p>
        </div>
      </div>
    </>
  );
}
