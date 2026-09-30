"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { VideoHero } from "@/components/shared/video-hero"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Search, 
  MessageCircle, 
  Heart, 
  Eye,
  TrendingUp,
  Clock,
  PenSquare,
  Bookmark,
  Award,
  Users,
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { Pagination } from "@/components/ui/pagination-simple"

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

const defaultCategories = [
  { id: "all", label: "전체" },
  { id: "free", label: "자유게시판" },
  { id: "tips", label: "육아 꿀팁" },
  { id: "qna", label: "Q&A" },
  { id: "review", label: "상담 후기" },
  { id: "expert", label: "전문가 칼럼" },
]

const EXPERT_AVATAR_COLORS = ["bg-teal-500", "bg-cyan-500", "bg-emerald-500", "bg-sky-500", "bg-violet-500"]

const popularTags = ["그림분석", "발달검사", "미술치료", "놀이치료", "정서발달", "5세", "7세", "불안"]

// Scroll animation hook
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

const POSTS_PER_PAGE = 5

export default function CommunityPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState(defaultCategories)
  const [sortBy, setSortBy] = useState<"view_count" | "like_count" | "latest">(
    "view_count"
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    comments: 0,
    experts: 0,
  })
  const [experts, setExperts] = useState<{ user_id: number; name: string; title: string; answer_count: number }[]>([])

  const heroAnim = useScrollAnimation()
  const searchAnim = useScrollAnimation()
  const contentAnim = useScrollAnimation()

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, searchQuery])

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

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/community/categories`)
      if (!response.ok) return
      const data = await response.json()
      const mapped = [
        { id: "all", label: "전체" },
        ...data.map((item: { slug: string; label: string }) => ({
          id: item.slug,
          label: item.label,
        })),
      ]
      setCategories(mapped)
    } catch {
      setCategories(defaultCategories)
    }
  }

  const fetchPosts = async (signal?: AbortSignal) => {
    setIsLoading(true)
    setErrorMessage("")
    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        search: searchQuery,
        sort: sortBy,
        page: String(currentPage),
        page_size: String(POSTS_PER_PAGE),
      })
      const token = getAuthToken()
      const response = await fetch(
        `${apiBaseUrl}/community/posts?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          signal,
        }
      )
      if (!response.ok) {
        throw new Error("게시글을 불러오지 못했습니다.")
      }
      const data = await response.json()
      const mapped = (data.items ?? []).map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        author: {
          id: item.author?.id ?? null,
          name: item.author?.name ?? "익명",
          badge: item.author?.badge ?? undefined,
          profileImageUrl: item.author?.profile_image_url ?? undefined,
        },
        category: item.category,
        createdAt: formatDateLabel(item.created_at),
        views: item.view_count,
        likes: item.like_count,
        comments: item.comment_count,
        isLiked: item.is_liked,
        isBookmarked: item.is_bookmarked,
        tags: item.tags ?? [],
      }))
      setPosts(mapped)
      setTotalPages(Math.max(1, Math.ceil((data.total ?? 0) / POSTS_PER_PAGE)))
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      setErrorMessage(
        error instanceof Error ? error.message : "게시글을 불러오지 못했습니다."
      )
      setPosts([])
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${apiBaseUrl}/community/stats`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) {
          throw new Error("커뮤니티 통계를 불러오지 못했습니다.")
        }
        return response.json()
      })
      .then(data => {
        setStats({
          users: Number(data.users ?? 0),
          posts: Number(data.posts ?? 0),
          comments: Number(data.comments ?? 0),
          experts: Number(data.experts ?? 0),
        })
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === "AbortError") return
      })
    return () => controller.abort()
  }, [apiBaseUrl])

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

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      fetchPosts(controller.signal)
    }, 200)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [selectedCategory, searchQuery, sortBy, currentPage])

  const toggleLike = (postId: number) => {
    const token = getAuthToken()
    if (!token) {
      alert("로그인이 필요합니다.")
      return
    }
    fetch(`${apiBaseUrl}/community/posts/${postId}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(response => response.json())
      .then(data => {
        setPosts(prev =>
          prev.map(post =>
            post.id === postId
              ? { ...post, isLiked: data.is_liked, likes: data.like_count }
              : post
          )
        )
      })
      .catch(() => {
        alert("좋아요 처리에 실패했습니다.")
      })
  }

  const toggleBookmark = (postId: number) => {
    const token = getAuthToken()
    if (!token) {
      alert("로그인이 필요합니다.")
      return
    }
    fetch(`${apiBaseUrl}/community/posts/${postId}/bookmark`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(response => response.json())
      .then(data => {
        setPosts(prev =>
          prev.map(post =>
            post.id === postId
              ? { ...post, isBookmarked: data.is_bookmarked }
              : post
          )
        )
      })
      .catch(() => {
        alert("북마크 처리에 실패했습니다.")
      })
  }

  const categoryLabels: Record<string, string> = {
    free: "자유게시판",
    tips: "육아 꿀팁",
    qna: "Q&A",
    review: "상담 후기",
    expert: "전문가 칼럼"
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      
      {/* Video Hero */}
      <div className="-mt-14">
        <VideoHero
          subtitle="부모님들의 소통 공간"
          title="맘스퀘어"
          description="부모님들의 이야기를 나누고, 전문가의 조언을 받아보세요."
          height="small"
        />
      </div>

      <main className="flex-1">
        {/* Search Section */}
        <div 
          ref={searchAnim.ref}
          className={`py-10 transition-all duration-700 ${
            searchAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="궁금한 내용을 검색해보세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base rounded-full border-slate-200 bg-slate-50 focus:bg-white shadow-sm"
                />
              </div>

              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {popularTags.map(tag => (
                  <button 
                    key={tag} 
                    className="px-3 py-1.5 text-sm text-slate-500 hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
                    onClick={() => setSearchQuery(tag)}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="border-y border-slate-100 bg-slate-50/50">
          <div className="container mx-auto px-4 lg:px-8 py-6">
            <div className="flex justify-center gap-12 md:gap-20">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">
                  {stats.users.toLocaleString("ko-KR")}
                </p>
                <p className="text-xs text-slate-500 mt-1">회원</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">
                  {stats.posts.toLocaleString("ko-KR")}
                </p>
                <p className="text-xs text-slate-500 mt-1">게시글</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">
                  {stats.comments.toLocaleString("ko-KR")}
                </p>
                <p className="text-xs text-slate-500 mt-1">댓글</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {stats.experts.toLocaleString("ko-KR")}
                </p>
                <p className="text-xs text-slate-500 mt-1">전문가</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div 
          ref={contentAnim.ref}
          className={`container mx-auto px-4 lg:px-8 py-10 transition-all duration-700 delay-100 ${
            contentAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            {/* Posts */}
            <div className="lg:col-span-3">
              {/* Category & Sort */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                        selectedCategory === category.id
                          ? "bg-primary text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
                
                <Link href="/community/write" className="hidden md:block">
                  <Button className="gap-2 rounded-full">
                    <PenSquare className="h-4 w-4" />
                    글쓰기
                  </Button>
                </Link>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-4 mb-6 text-sm">
                <button
                  onClick={() => setSortBy("latest")}
                  className={`flex items-center gap-1.5 ${
                    sortBy === "latest" ? "text-primary font-medium" : "text-slate-500"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  최신순
                </button>
                <button
                  onClick={() => setSortBy("view_count")}
                  className={`flex items-center gap-1.5 ${
                    sortBy === "view_count" ? "text-primary font-medium" : "text-slate-500"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  인기순
                </button>
                <button
                  onClick={() => setSortBy("like_count")}
                  className={`flex items-center gap-1.5 ${
                    sortBy === "like_count" ? "text-primary font-medium" : "text-slate-500"
                  }`}
                >
                  <Heart className="h-4 w-4" />
                  공감순
                </button>
              </div>

              {/* Posts List */}
              <div className="divide-y divide-slate-100">
                {isLoading && (
                  <div className="py-10 text-center text-slate-400">
                    게시글을 불러오는 중입니다...
                  </div>
                )}
                {!isLoading && errorMessage && (
                  <div className="py-10 text-center text-red-500">{errorMessage}</div>
                )}
                {!isLoading && !errorMessage && posts.map((post, index) => (
                  <article 
                    key={post.id} 
                    className="py-6 first:pt-0 transition-all duration-300 hover:bg-slate-50/50 -mx-4 px-4 rounded-lg"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10 flex shrink-0">
                        {resolveProfileImageUrl(post.author.profileImageUrl) && (
                          <AvatarImage
                            src={resolveProfileImageUrl(post.author.profileImageUrl) as string}
                            alt={post.author.name}
                          />
                        )}
                        <AvatarFallback className={`text-white text-sm ${
                          post.author.badge === "전문가" ? "bg-primary" : "bg-slate-400"
                        }`}>
                          {post.author.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-primary font-medium">
                            {categoryLabels[post.category]}
                          </span>
                          {post.author.badge && null}
                        </div>
                        
                        <Link href={`/community/${post.id}`}>
                          <h3 className="font-semibold text-slate-800 hover:text-primary transition-colors line-clamp-1">
                            {post.title}
                          </h3>
                        </Link>
                        
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                          {post.content}
                        </p>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>{post.author.name}</span>
                            <span>·</span>
                            <span>{post.createdAt}</span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <button 
                              className={`flex items-center gap-1 text-xs transition-colors ${
                                post.isLiked ? "text-red-500" : "text-slate-400 hover:text-red-500"
                              }`}
                              onClick={() => toggleLike(post.id)}
                            >
                              <Heart className={`h-3.5 w-3.5 ${post.isLiked ? "fill-current" : ""}`} />
                              {post.likes}
                            </button>
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <MessageCircle className="h-3.5 w-3.5" />
                              {post.comments}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Eye className="h-3.5 w-3.5" />
                              {post.views}
                            </span>
                            <button 
                              className={`transition-colors ${
                                post.isBookmarked ? "text-primary" : "text-slate-400 hover:text-primary"
                              }`}
                              onClick={() => toggleBookmark(post.id)}
                            >
                              <Bookmark className={`h-3.5 w-3.5 ${post.isBookmarked ? "fill-current" : ""}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {!isLoading && !errorMessage && posts.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-slate-400">검색 결과가 없습니다</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}

              {/* Mobile Write Button */}
              <Link href="/community/write" className="block md:hidden mt-6">
                <Button className="w-full gap-2 rounded-full">
                  <PenSquare className="h-4 w-4" />
                  글쓰기
                </Button>
              </Link>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Active Experts */}
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

              {/* Popular Tags */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  인기 태그
                </h3>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(tag => (
                    <button 
                      key={tag} 
                      className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-primary/10 hover:text-primary rounded-full transition-colors"
                      onClick={() => setSearchQuery(tag)}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner */}
              <div className="bg-gradient-to-br from-primary to-teal-600 rounded-2xl p-6 text-white">
                <h4 className="font-semibold mb-2">전문가 상담 받기</h4>
                <p className="text-sm text-white/80 mb-4">
                  우리 아이 맞춤 상담을 받아보세요
                </p>
                <Link href="/counseling">
                  <Button size="sm" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                    상담 신청
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
