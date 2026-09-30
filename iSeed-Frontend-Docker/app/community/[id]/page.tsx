"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Award, Bookmark, Eye, Heart, MessageCircle, ChevronRight } from "lucide-react"

interface Post {
  id: number
  title: string
  content: string
  author: {
    id?: number | null
    name: string
    badge?: string
    profileImageUrl?: string
  }
  category: string
  createdAt: string
  views: number
  likes: number
  comments: number
  isLiked: boolean
  isBookmarked: boolean
  tags: string[]
}

interface Comment {
  id: number
  postId: number
  userId: number
  parentId?: number | null
  content: string
  createdAt: string
  author: {
    id?: number | null
    name: string
    badge?: string
    profileImageUrl?: string
  }
}

const EXPERT_AVATAR_COLORS = ["bg-teal-500", "bg-cyan-500", "bg-emerald-500", "bg-sky-500", "bg-violet-500"]

const categoryLabels: Record<string, string> = {
  free: "자유게시판",
  tips: "육아 꿀팁",
  qna: "Q&A",
  review: "상담 후기",
  expert: "전문가 칼럼"
}

export default function CommunityPostPage() {
  const params = useParams<{ id: string }>()
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({})
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [experts, setExperts] = useState<{ user_id: number; name: string; title: string; answer_count: number }[]>([])

  const resolveProfileImageUrl = (value?: string | null) => {
    if (!value || value === "base") return null
    const trimmed = value.trim()
    if (
      trimmed.startsWith("data:") ||
      trimmed.startsWith("blob:") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://")
    ) {
      return trimmed
    }
    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(trimmed)) {
      return `https://${trimmed}`
    }
    const base =
      apiBaseUrl || (typeof window !== "undefined" ? window.location.origin : "")
    const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
    return base ? new URL(normalizedPath, base).toString() : normalizedPath
  }

  const getAuthToken = () => {
    if (typeof window === "undefined") return null
    return (
      localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
    )
  }

  const formatDateLabel = (value: string) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    parsed.setHours(parsed.getHours() + 9)
    return parsed.toLocaleString("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const submitComment = async (content: string, parentId?: number | null) => {
    const trimmed = content.trim()
    if (!trimmed) return
    const token = getAuthToken()
    if (!token) {
      alert("로그인이 필요합니다.")
      return
    }
    if (!params?.id) return
    setIsSubmitting(true)
    try {
      const response = await fetch(
        `${apiBaseUrl}/community/posts/${params.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            parentId ? { content: trimmed, parent_id: parentId } : { content: trimmed }
          ),
        }
      )
      if (!response.ok) {
        throw new Error("댓글 등록에 실패했습니다.")
      }
      const data = await response.json()
      const mapped: Comment = {
        id: data.id,
        postId: data.post_id,
        userId: data.user_id,
        parentId: data.parent_id,
        content: data.content,
        createdAt: formatDateLabel(data.created_at),
        author: {
          id: data.author?.id ?? null,
          name: data.author?.name ?? "익명",
          badge: data.author?.badge ?? undefined,
          profileImageUrl: data.author?.profile_image_url ?? undefined,
        },
      }
      setComments(prev => [...prev, mapped])
      setPost(prev => (prev ? { ...prev, comments: prev.comments + 1 } : prev))
      if (parentId) {
        setReplyDrafts(prev => ({ ...prev, [parentId]: "" }))
        setActiveReplyId(null)
      } else {
        setNewComment("")
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "댓글 등록에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitComment = async () => {
    await submitComment(newComment)
  }

  const handleSubmitReply = async (parentId: number) => {
    await submitComment(replyDrafts[parentId] ?? "", parentId)
  }

  const repliesByParent = comments.reduce<Record<number, Comment[]>>((acc, comment) => {
    if (comment.parentId) {
      const key = comment.parentId
      if (!acc[key]) acc[key] = []
      acc[key].push(comment)
    }
    return acc
  }, {})

  const topLevelComments = comments.filter(comment => !comment.parentId)

  useEffect(() => {
    if (!params?.id) return
    const controller = new AbortController()
    const token = getAuthToken()
    setIsLoading(true)
    setErrorMessage("")
    const loadPost = fetch(`${apiBaseUrl}/community/posts/${params.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: controller.signal,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("게시글을 불러오지 못했습니다.")
        }
        return response.json()
      })
      .then(data => {
        setPost({
          id: data.id,
          title: data.title,
          content: data.content,
          author: {
            id: data.author?.id ?? null,
            name: data.author?.name ?? "익명",
            badge: data.author?.badge ?? undefined,
            profileImageUrl: data.author?.profile_image_url ?? undefined,
          },
          category: data.category,
          createdAt: formatDateLabel(data.created_at),
          views: data.view_count,
          likes: data.like_count,
          comments: data.comment_count,
          isLiked: data.is_liked,
          isBookmarked: data.is_bookmarked,
          tags: data.tags ?? [],
        })
      })

    const loadComments = fetch(
      `${apiBaseUrl}/community/posts/${params.id}/comments`,
      { signal: controller.signal }
    )
      .then(response => {
        if (!response.ok) {
          throw new Error("댓글을 불러오지 못했습니다.")
        }
        return response.json()
      })
      .then(data => {
        const mapped = (data ?? []).map((item: any) => ({
          id: item.id,
          postId: item.post_id,
          userId: item.user_id,
          parentId: item.parent_id,
          content: item.content,
          createdAt: formatDateLabel(item.created_at),
          author: {
            id: item.author?.id ?? null,
            name: item.author?.name ?? "익명",
            badge: item.author?.badge ?? undefined,
            profileImageUrl: item.author?.profile_image_url ?? undefined,
          },
        }))
        setComments(mapped)
      })

    Promise.all([loadPost, loadComments])
      .catch(error => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setErrorMessage(
          error instanceof Error ? error.message : "데이터를 불러오지 못했습니다."
        )
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [apiBaseUrl, params?.id])

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${apiBaseUrl}/community/experts`, { signal: controller.signal })
      .then(response => (response.ok ? response.json() : []))
      .then((data: { user_id: number; name: string; title: string; answer_count: number }[]) => {
        setExperts(Array.isArray(data) ? data : [])
      })
      .catch(() => setExperts([]))
    return () => controller.abort()
  }, [apiBaseUrl])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 lg:px-8 py-10">
          {isLoading && (
            <div className="py-16 text-center text-slate-400">
              게시글을 불러오는 중입니다...
            </div>
          )}
          {!isLoading && errorMessage && (
            <div className="py-16 text-center text-red-500">{errorMessage}</div>
          )}
          {!isLoading && !errorMessage && !post && (
            <div className="py-16 text-center text-slate-400">게시글이 없습니다</div>
          )}
          {post && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-3">
              <div className="mb-6">
                <nav className="text-xs text-slate-400">
                  <span>홈</span>
                  <span className="mx-2">/</span>
                  <span>맘스퀘어</span>
                  <span className="mx-2">/</span>
                  <span>{categoryLabels[post.category]}</span>
                </nav>
                <div className="flex items-center justify-between mt-2">
                  <h2 className="text-lg font-semibold text-slate-800">게시글 상세</h2>
                  <span className="text-xs text-slate-400">{post.createdAt}</span>
                </div>
                <div className="h-px bg-slate-100 mt-4" />
              </div>

              <Link
                href="/community"
                className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-4"
              >
                ← 목록으로
              </Link>

              <article className="py-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-primary font-medium">
                    {categoryLabels[post.category]}
                  </span>
                  {post.author.badge && null}
                </div>

                <h1 className="text-3xl font-semibold text-slate-900 leading-snug mb-4">
                  {post.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      {resolveProfileImageUrl(post.author.profileImageUrl) && (
                        <AvatarImage
                          src={resolveProfileImageUrl(post.author.profileImageUrl) as string}
                          alt={post.author.name}
                        />
                      )}
                      <AvatarFallback className={`text-white text-xs ${
                        post.author.badge === "전문가" ? "bg-primary" : "bg-slate-400"
                      }`}>
                        {post.author.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span>{post.author.name}</span>
                  </div>
                  <span>·</span>
                  <span>{post.createdAt}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {post.views}
                  </span>
                </div>

                <div className="min-h-[360px] py-8">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line text-base">
                    {post.content}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pb-6 border-b border-slate-100">
                  <span className={`flex items-center gap-1 ${post.isLiked ? "text-red-500" : ""}`}>
                    <Heart className={`h-3.5 w-3.5 ${post.isLiked ? "fill-current" : ""}`} />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {post.comments}
                  </span>
                  <span className={`flex items-center gap-1 ${post.isBookmarked ? "text-primary" : ""}`}>
                    <Bookmark className={`h-3.5 w-3.5 ${post.isBookmarked ? "fill-current" : ""}`} />
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-6">
                  {post.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs text-slate-600 bg-slate-100 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </article>

              <section className="border-t border-slate-100 pt-8">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">
                  댓글 {comments.length}
                </h3>
                <div className="mb-6">
                  <Textarea
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    placeholder="댓글을 입력하세요"
                    className="min-h-[96px]"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      onClick={handleSubmitComment}
                      disabled={isSubmitting || newComment.trim().length === 0}
                    >
                      {isSubmitting ? "등록 중..." : "댓글 등록"}
                    </Button>
                  </div>
                </div>
                {comments.length === 0 && (
                  <p className="text-sm text-slate-400">아직 댓글이 없습니다.</p>
                )}
                <div className="space-y-4">
                  {topLevelComments.map(comment => (
                    <div key={comment.id} className="rounded-xl border border-slate-100 p-4 bg-white">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {resolveProfileImageUrl(comment.author.profileImageUrl) && (
                              <AvatarImage
                                src={resolveProfileImageUrl(comment.author.profileImageUrl) as string}
                                alt={comment.author.name}
                              />
                            )}
                            <AvatarFallback className={`text-white text-[10px] ${
                              comment.author.badge === "전문가" ? "bg-primary" : "bg-slate-400"
                            }`}>
                              {comment.author.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-slate-600">{comment.author.name}</span>
                          {comment.author.badge && (
                            <span className="text-primary">{comment.author.badge}</span>
                          )}
                        </div>
                        <span>{comment.createdAt}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">
                        {comment.content}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() =>
                            setActiveReplyId(prev => (prev === comment.id ? null : comment.id))
                          }
                        >
                          답글 달기
                        </button>
                      </div>
                      {activeReplyId === comment.id && (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            value={replyDrafts[comment.id] ?? ""}
                            onChange={(event) =>
                              setReplyDrafts(prev => ({
                                ...prev,
                                [comment.id]: event.target.value,
                              }))
                            }
                            placeholder={`${comment.author.name}님에게 답글을 남겨보세요`}
                            className="min-h-[84px]"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setReplyDrafts(prev => ({ ...prev, [comment.id]: "" }))
                                setActiveReplyId(null)
                              }}
                            >
                              취소
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={
                                isSubmitting || (replyDrafts[comment.id] ?? "").trim().length === 0
                              }
                            >
                              {isSubmitting ? "등록 중..." : "답글 등록"}
                            </Button>
                          </div>
                        </div>
                      )}
                      {repliesByParent[comment.id]?.length ? (
                        <div className="mt-4 space-y-3">
                          {repliesByParent[comment.id].map(reply => (
                            <div
                              key={reply.id}
                              className="ml-8 rounded-xl border border-slate-100 p-4 bg-slate-50/60"
                            >
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    {resolveProfileImageUrl(reply.author.profileImageUrl) && (
                                      <AvatarImage
                                        src={resolveProfileImageUrl(reply.author.profileImageUrl) as string}
                                        alt={reply.author.name}
                                      />
                                    )}
                                    <AvatarFallback className={`text-white text-[10px] ${
                                      reply.author.badge === "전문가" ? "bg-primary" : "bg-slate-400"
                                    }`}>
                                      {reply.author.name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-slate-600">{reply.author.name}</span>
                                  {reply.author.badge && (
                                    <span className="text-primary">{reply.author.badge}</span>
                                  )}
                                </div>
                                <span>{reply.createdAt}</span>
                              </div>
                              <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">
                                {reply.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  활동 중인 전문가
                </h3>
                <div className="space-y-3">
                  {experts.slice(0, 5).map((expert, idx) => (
                    <div 
                      key={expert.user_id} 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`${EXPERT_AVATAR_COLORS[idx % EXPERT_AVATAR_COLORS.length]} text-white text-sm`}>
                          {expert.name?.[0] ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-800">{expert.name}</p>
                        <p className="text-xs text-slate-500">{expert.title}</p>
                      </div>
                      <span className="text-xs text-slate-400">
                        답변 {expert.answer_count}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-3 text-sm text-primary hover:underline flex items-center justify-center gap-1">
                  전문가 더보기 <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
