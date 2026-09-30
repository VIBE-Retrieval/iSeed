"use client"

/**
 * 게임 1 - 마음 구름 날리기 (ANXIETY / 호흡 이완)
 *
 * 들이마시기 4초 → 멈추기 2초 → 내쉬기 6초 를 한 사이클로,
 * 4사이클을 마치면 활동 완료.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { ActivityGameProps } from "@/lib/activities/registry"

type Phase = "inhale" | "hold" | "exhale"

const PHASES: { phase: Phase; label: string; seconds: number; hint: string }[] = [
  { phase: "inhale", label: "숨 들이마시기", seconds: 4, hint: "코로 천천히 들이마셔요" },
  { phase: "hold", label: "잠깐 멈추기", seconds: 2, hint: "그대로 멈춰요" },
  { phase: "exhale", label: "천천히 내쉬기", seconds: 6, hint: "입으로 길게 후~" },
]

const TOTAL_CYCLES = 4

interface BreathState {
  phaseIndex: number
  remaining: number
  cycle: number
}

const INITIAL: BreathState = { phaseIndex: 0, remaining: PHASES[0].seconds, cycle: 0 }

export function CalmCloudGame({ onComplete }: ActivityGameProps) {
  const [running, setRunning] = useState(false)
  const [breath, setBreath] = useState<BreathState>(INITIAL)
  const [finished, setFinished] = useState(false)
  const completedRef = useRef(false)

  const { phaseIndex, remaining, cycle } = breath
  const current = PHASES[phaseIndex]

  const reset = useCallback(() => {
    setRunning(false)
    setBreath(INITIAL)
    setFinished(false)
    completedRef.current = false
  }, [])

  // 단일 타이머로 단계/남은시간/사이클을 한 번에 진행시킨다.
  // (상태를 쪼개면 stale closure 때문에 단계와 초가 어긋난다)
  useEffect(() => {
    if (!running || finished) return
    const timer = setInterval(() => {
      setBreath((prev) => {
        if (prev.remaining > 1) {
          return { ...prev, remaining: prev.remaining - 1 }
        }
        const nextIndex = (prev.phaseIndex + 1) % PHASES.length
        const nextCycle = nextIndex === 0 ? prev.cycle + 1 : prev.cycle
        if (nextCycle >= TOTAL_CYCLES) {
          setRunning(false)
          setFinished(true)
          return { phaseIndex: prev.phaseIndex, remaining: 0, cycle: TOTAL_CYCLES }
        }
        return {
          phaseIndex: nextIndex,
          remaining: PHASES[nextIndex].seconds,
          cycle: nextCycle,
        }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [running, finished])

  useEffect(() => {
    if (finished && !completedRef.current) {
      completedRef.current = true
      onComplete(`호흡 활동 ${TOTAL_CYCLES}회 완료`)
    }
  }, [finished, onComplete])

  // 구름 크기: 들이마실 때 커지고, 내쉴 때 작아짐
  const scale =
    current.phase === "inhale"
      ? 0.7 + 0.3 * ((current.seconds - remaining + 1) / current.seconds)
      : current.phase === "hold"
        ? 1
        : 1 - 0.3 * ((current.seconds - remaining + 1) / current.seconds)

  return (
    <Card>
      <CardContent className="p-6 md:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-56 w-full items-center justify-center md:h-64">
            <div
              className="flex items-center justify-center rounded-full bg-sky-100 transition-transform duration-1000 ease-in-out"
              style={{
                width: 180,
                height: 180,
                transform: `scale(${running && !finished ? scale : 0.85})`,
              }}
            >
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-sky-200/70">
                <span className="text-5xl" aria-hidden>
                  ☁️
                </span>
              </div>
            </div>
          </div>

          {finished ? (
            <div className="mt-2 space-y-2">
              <p className="text-lg font-semibold text-foreground">잘 했어요! 마음 구름을 모두 날려 보냈어요 🎉</p>
              <p className="text-sm text-muted-foreground">
                숨을 천천히 쉬면 두근거리는 마음이 조금씩 가라앉아요.
              </p>
            </div>
          ) : running ? (
            <div className="mt-2 space-y-1">
              <p className="text-2xl font-bold text-foreground">{current.label}</p>
              <p className="text-sm text-muted-foreground">{current.hint}</p>
              <p className="mt-2 text-5xl font-bold tabular-nums text-sky-600">{remaining}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {cycle + 1} / {TOTAL_CYCLES} 번째 호흡
              </p>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-lg font-semibold text-foreground">천천히 숨을 쉬어볼까요?</p>
              <p className="text-sm text-muted-foreground">
                구름이 커지면 들이마시고, 작아지면 천천히 내쉬어요. 모두 {TOTAL_CYCLES}번이에요.
              </p>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            {!running && !finished && (
              <Button size="lg" onClick={() => setRunning(true)}>
                시작하기
              </Button>
            )}
            {running && (
              <Button size="lg" variant="outline" onClick={() => setRunning(false)}>
                잠깐 멈추기
              </Button>
            )}
            {!running && !finished && (cycle > 0 || phaseIndex > 0) && (
              <Button size="lg" variant="ghost" onClick={reset}>
                처음부터
              </Button>
            )}
            {finished && (
              <Button size="lg" variant="outline" onClick={reset}>
                한 번 더 하기
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CalmCloudGame
