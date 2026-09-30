"use client"

/**
 * 게임 2 - 오늘의 마음 색깔 (EMOTION / 감정 인식)
 *
 * 아이가 지금 감정을 색 카드로 고르고, 얼마나 크게 느끼는지 표시한 뒤 기록합니다.
 * 선택 결과는 localStorage(iseed:mood-log:v1)에 남아 마이페이지에서 되돌아볼 수 있습니다.
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { ActivityGameProps } from "@/lib/activities/registry"

const MOOD_LOG_KEY = "iseed:mood-log:v1"

const MOODS = [
  { id: "joy", label: "기쁨", emoji: "😊", color: "#FDE68A", text: "text-amber-900" },
  { id: "sad", label: "슬픔", emoji: "😢", color: "#BFDBFE", text: "text-blue-900" },
  { id: "angry", label: "화남", emoji: "😠", color: "#FECACA", text: "text-red-900" },
  { id: "scared", label: "무서움", emoji: "😨", color: "#DDD6FE", text: "text-violet-900" },
  { id: "calm", label: "편안함", emoji: "😌", color: "#BBF7D0", text: "text-emerald-900" },
]

const SIZES = [
  { value: 1, label: "조금" },
  { value: 2, label: "보통" },
  { value: 3, label: "많이" },
]

export function MoodColorGame({ onComplete }: ActivityGameProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [size, setSize] = useState<number>(2)
  const [saved, setSaved] = useState(false)

  const mood = MOODS.find((m) => m.id === selected)

  const handleSave = () => {
    if (!mood) return
    const entry = {
      moodId: mood.id,
      label: mood.label,
      intensity: size,
      at: new Date().toISOString(),
    }
    try {
      const raw = window.localStorage.getItem(MOOD_LOG_KEY)
      const list = raw ? (JSON.parse(raw) as unknown[]) : []
      window.localStorage.setItem(MOOD_LOG_KEY, JSON.stringify([entry, ...list].slice(0, 60)))
    } catch {
      /* 저장 실패해도 활동은 완료 처리 */
    }
    setSaved(true)
    onComplete(
      `오늘의 마음: ${mood.label} (${SIZES.find((s) => s.value === size)?.label ?? ""})`
    )
  }

  return (
    <Card>
      <CardContent className="p-6 md:p-10">
        {saved && mood ? (
          <div className="flex flex-col items-center text-center">
            <div
              className="flex h-32 w-32 items-center justify-center rounded-full"
              style={{ backgroundColor: mood.color }}
            >
              <span className="text-6xl" aria-hidden>
                {mood.emoji}
              </span>
            </div>
            <p className="mt-6 text-lg font-semibold text-foreground">
              오늘의 마음 색깔은 &lsquo;{mood.label}&rsquo;이었어요
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              마음에 이름을 붙이는 건 마음을 돌보는 첫걸음이에요.
            </p>
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => {
                setSaved(false)
                setSelected(null)
                setSize(2)
              }}
            >
              다시 고르기
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-center text-base font-medium text-foreground">
              지금 내 마음과 가장 닮은 색을 골라보세요
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {MOODS.map((m) => {
                const isActive = selected === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelected(m.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      isActive
                        ? "border-primary shadow-md scale-[1.03]"
                        : "border-transparent hover:border-slate-200"
                    }`}
                    style={{ backgroundColor: m.color }}
                    aria-pressed={isActive}
                  >
                    <span className="text-3xl" aria-hidden>
                      {m.emoji}
                    </span>
                    <span className={`text-sm font-semibold ${m.text}`}>{m.label}</span>
                  </button>
                )
              })}
            </div>

            {selected && (
              <div className="mt-8">
                <p className="text-center text-sm text-muted-foreground">
                  얼마나 크게 느껴지나요?
                </p>
                <div className="mt-3 flex justify-center gap-2">
                  {SIZES.map((s) => (
                    <Button
                      key={s.value}
                      variant={size === s.value ? "default" : "outline"}
                      onClick={() => setSize(s.value)}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <Button size="lg" disabled={!selected} onClick={handleSave}>
                오늘의 마음 기록하기
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MoodColorGame
