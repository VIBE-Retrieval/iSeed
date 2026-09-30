"use client"

import React from "react"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  ImageIcon, 
  X,
  Info
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"

const categories = [
  { id: "free", label: "자유게시판" },
  { id: "tips", label: "육아 꿀팁" },
  { id: "qna", label: "Q&A" },
  { id: "review", label: "상담 후기" },
]

const suggestedTags = ["그림분석", "발달검사", "미술치료", "놀이치료", "정서발달", "5세", "7세", "불안", "ADHD", "부모상담"]

export default function CommunityWritePage() {
  const router = useRouter()
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
  const [category, setCategory] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [images, setImages] = useState<string[]>([])

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().replace(/^#/, "")
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && images.length < 5) {
      const newImages = Array.from(files).slice(0, 5 - images.length).map(file => 
        URL.createObjectURL(file)
      )
      setImages([...images, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const getAuthToken = () => {
    if (typeof window === "undefined") return null
    return (
      localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
    )
  }

  const handleSubmit = async () => {
    const token = getAuthToken()
    if (!token) {
      alert("로그인이 필요합니다.")
      router.push("/login")
      return
    }
    try {
      const response = await fetch(`${apiBaseUrl}/community/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category_slug: category,
          title,
          content,
          tags,
          images,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = errorData?.detail?.message || "게시글 등록에 실패했습니다."
        throw new Error(message)
      }
      router.push("/community")
    } catch (error) {
      const message = error instanceof Error ? error.message : "게시글 등록에 실패했습니다."
      alert(message)
    }
  }

  const isValid = category && title.length >= 5 && content.length >= 10

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          {/* Back Button */}
          <Link href="/community" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            커뮤니티로 돌아가기
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>새 글 작성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">카테고리 *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  placeholder="제목을 입력하세요 (최소 5자)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground text-right">{title.length}/100</p>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">내용 *</Label>
                <Textarea
                  id="content"
                  placeholder="내용을 입력하세요 (최소 10자)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground text-right">{content.length}/5000</p>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>이미지 첨부 (최대 5장)</Label>
                <div className="flex flex-wrap gap-3">
                  {images.map((image, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                      <img src={image || "/placeholder.svg"} alt={`첨부 이미지 ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full text-white hover:bg-black/70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </label>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">태그 (최대 5개)</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  id="tags"
                  placeholder="태그 입력 후 Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={tags.length >= 5}
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs text-muted-foreground mr-1">추천:</span>
                  {suggestedTags.filter(t => !tags.includes(t)).slice(0, 6).map(tag => (
                    <button
                      key={tag}
                      onClick={() => addTag(tag)}
                      className="text-xs text-primary hover:underline"
                      disabled={tags.length >= 5}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guidelines */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>커뮤니티 이용 수칙</p>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      <li>다른 회원을 존중하고 예의 바른 언어를 사용해주세요</li>
                      <li>개인정보(이름, 연락처 등)는 게시하지 말아주세요</li>
                      <li>광고, 홍보성 글은 삭제될 수 있습니다</li>
                      <li>아이 사진 게시 시 개인정보 보호에 유의해주세요</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end">
                <Link href="/community">
                  <Button variant="outline" className="bg-transparent">취소</Button>
                </Link>
                <Button 
                  onClick={handleSubmit}
                  disabled={!isValid}
                >
                  등록하기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
