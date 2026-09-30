"use client"

/**
 * 게임 3 - 친구의 마음은 어떨까? (SOCIAL / 사회적 감정 이해)
 *
 * 상황 카드 4개를 보여주고, 친구가 느낄 감정을 고르게 합니다.
 * 정답/오답을 평가하기보다 "그렇게 느낄 수 있어요"라고 알려주는 방식입니다.
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ActivityGameProps } from "@/lib/activities/registry"

const EMOTIONS = [
  { id: "joy", label: "기쁨", emoji: "😊" },
  { id: "sad", label: "슬픔", emoji: "😢" },
  { id: "angry", label: "화남", emoji: "😠" },
  { id: "embarrassed", label: "당황", emoji: "😳" },
  { id: "scared", label: "무서움", emoji: "😨" },
]

interface Scene {
  id: string
  text: string
  expected: string
  feedback: string
  alt: string
}

const SCENES: Scene[] = [
  {
    id: "s1",
    text: "친구가 아끼던 인형을 잃어버렸어요.",
    expected: "sad",
    feedback: "맞아요. 소중한 걸 잃으면 슬픈 마음이 들어요. 옆에서 이야기를 들어주면 큰 힘이 돼요.",
    alt: "그렇게 느낄 수도 있어요. 사람마다 마음은 다르게 찾아와요. 친구에게 직접 물어보면 더 잘 알 수 있어요.",
  },
  {
    id: "s2",
    text: "친구가 발표를 하는데 갑자기 모두가 쳐다봤어요.",
    expected: "embarrassed",
    feedback: "맞아요. 시선이 모이면 당황스러울 수 있어요. '괜찮아'라고 말해주면 좋아요.",
    alt: "그럴 수도 있어요. 같은 상황에서도 사람마다 다른 마음이 들 수 있답니다.",
  },
  {
    id: "s3",
    text: "친구가 만든 블록을 다른 친구가 무너뜨렸어요.",
    expected: "angry",
    feedback: "맞아요. 열심히 만든 걸 망가뜨리면 화가 나요. 화는 나쁜 게 아니라 알려주는 신호예요.",
    alt: "그렇게 느낄 수도 있어요. 마음은 한 가지만 오지 않고 여러 개가 같이 오기도 해요.",
  },
  {
    id: "s4",
    text: "친구가 오랫동안 기다리던 생일 선물을 받았어요.",
    expected: "joy",
    feedback: "맞아요! 기다리던 일이 이루어지면 정말 기뻐요. 같이 기뻐해 주면 더 커져요.",
    alt: "그럴 수도 있어요. 기쁜 일에도 긴장되는 마음이 섞일 수 있거든요.",
  },
]

export function FriendFeelingGame({ onComplete }: ActivityGameProps) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [answers, setAnswers] = useState<string[]>([])
  const [done, setDone] = useState(false)

  const scene = SCENES[index]
  const matched = picked === scene?.expected

  const handleNext = () => {
    const nextAnswers = picked ? [...answers, picked] : answers
    setAnswers(nextAnswers)
    if (index + 1 >= SCENES.length) {
      setDone(true)
      const hit = nextAnswers.filter((a, i) => a === SCENES[i].expected).length
      onComplete(`상황 ${SCENES.length}개 완료 (마음 맞추기 ${hit}회)`)
      return
    }
    setIndex(index + 1)
    setPicked(null)
  }

  if (done) {
    const hit = answers.filter((a, i) => a === SCENES[i].expected).length
    return (
      <Card>
        <CardContent className="p-6 md:p-10 text-center">
          <span className="text-6xl" aria-hidden>
            🤝
          </span>
          <p className="mt-4 text-lg font-semibold text-foreground">
            친구의 마음을 {SCENES.length}번이나 생각해 봤어요!
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            내 생각과 같았던 건 {hit}번이에요. 다르게 느끼는 것도 전혀 이상하지 않아요.
          </p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => {
              setIndex(0)
              setPicked(null)
              setAnswers([])
              setDone(false)
            }}
          >
            한 번 더 하기
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6 md:p-10">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            {index + 1} / {SCENES.length}
          </Badge>
        </div>

        <p className="mt-6 text-center text-lg font-semibold leading-relaxed text-foreground md:text-xl">
          {scene.text}
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          친구는 어떤 마음일까요?
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {EMOTIONS.map((e) => {
            const isActive = picked === e.id
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => setPicked(e.id)}
                disabled={picked !== null}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 bg-white p-4 transition-all disabled:cursor-default ${
                  isActive
                    ? "border-primary shadow-md scale-[1.03]"
                    : "border-slate-200 hover:border-primary/40"
                }`}
                aria-pressed={isActive}
              >
                <span className="text-3xl" aria-hidden>
                  {e.emoji}
                </span>
                <span className="text-sm font-semibold text-slate-700">{e.label}</span>
              </button>
            )
          })}
        </div>

        {picked && (
          <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm leading-relaxed text-foreground">
              {matched ? scene.feedback : scene.alt}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Button size="lg" disabled={!picked} onClick={handleNext}>
            {index + 1 >= SCENES.length ? "마치기" : "다음 이야기"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default FriendFeelingGame
