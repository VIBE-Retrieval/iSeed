"use client"

/**
 * 게임 4 - 감정 젠가 (EXPRESSION / 자기표현, 보호자와 함께)
 *
 * 보호자와 아이가 번갈아 3D 젠가 블록을 뽑고, 블록 색에 맞는 감정 질문에 제한 시간 안에 대답합니다.
 *   빨강: 분노·짜증 / 파랑: 슬픔·걱정·두려움 / 노랑: 기쁨·행복·자존감 / 초록: 소원·관계·소통
 *
 * 게임 본체는 three.js 기반 단독 페이지(public/games/emotion-jenga/index.html)이고,
 * 여기서는 iframe 으로 띄운 뒤 한 판이 끝났을 때 보내는 메시지를 받아 씨앗 성장에 반영합니다.
 */

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Maximize2 } from "lucide-react"
import type { ActivityGameProps } from "@/lib/activities/registry"

const GAME_URL = "/games/emotion-jenga/index.html"

interface JengaResult {
  type: "iseed:activity-complete"
  activityId: "emotion-jenga"
  asked: number
  stars: number
  pulled: number
  minutes: number
  fell: boolean
  colorCount?: Record<string, number>
}

const COLOR_LABEL: Record<string, string> = {
  red: "분노·짜증",
  blue: "슬픔·걱정",
  yellow: "기쁨·자존감",
  green: "소원·관계",
}

function describe(r: JengaResult): string {
  const opened = Object.entries(r.colorCount || {})
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `${COLOR_LABEL[c] ?? c} ${n}`)
    .join(", ")
  return `질문 ${r.asked}개 · 별 ${r.stars}개 · ${r.minutes}분${opened ? ` (열린 감정: ${opened})` : ""}`
}

export function EmotionJengaGame({ onComplete }: ActivityGameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // 같은 출처의 우리 게임 iframe 에서 온 메시지만 처리
      if (e.origin !== window.location.origin) return
      if (e.source !== frameRef.current?.contentWindow) return
      const data = e.data as JengaResult
      if (!data || data.type !== "iseed:activity-complete" || data.activityId !== "emotion-jenga") return
      onComplete(describe(data))
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [onComplete])

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative h-[78vh] min-h-[600px] w-full bg-sky-100">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              감정 젠가를 불러오는 중…
            </div>
          )}
          <iframe
            ref={frameRef}
            src={GAME_URL}
            title="감정 젠가"
            className="absolute inset-0 h-full w-full border-0"
            // 음성 인식(마이크)·전체 화면 허용
            allow="microphone; autoplay; fullscreen"
            onLoad={() => setLoaded(true)}
          />
        </div>
        <div className="flex flex-col gap-2 border-t bg-muted/30 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            보호자가 먼저 블록을 뽑아요. 아이가 무슨 말을 하든 반박하지 말고 공감만 해주세요.
            한 판을 마치면(그만 · 무너짐) 마음 씨앗이 자라요.
          </span>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            // 새 탭이 아닌 전체 화면으로 열어야 게임 종료 신호를 받아 씨앗 포인트가 쌓임
            onClick={() => frameRef.current?.requestFullscreen?.().catch(() => {})}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            전체 화면으로 하기
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default EmotionJengaGame
