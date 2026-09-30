"use client"

import React from "react"

import { useEffect, useRef, useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ArrowLeft,
  User,
  Bell,
  Shield,
  CreditCard,
  LogOut,
  Trash2,
  ChevronRight,
  Camera,
  Loader2
} from "lucide-react"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
    community: true
  })
  const [profile, setProfile] = useState<{ name: string; email: string }>({ name: "", email: "" })
  const [profileImageUrl, setProfileImageUrl] = useState("")
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveErrorMessage, setSaveErrorMessage] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token =
      localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
    if (!token) {
      setProfileLoading(false)
      return
    }
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          return
        }
        const data = await response.json()
        setProfile({
          name: data.name ?? "",
          email: data.email ?? "",
        })
        const imageUrl = data.profile_image_url ?? "base"
        if (imageUrl === "base") {
          setProfileImageUrl("")
          setProfileImagePreview(null)
        } else {
          setProfileImageUrl(imageUrl)
          setProfileImagePreview(imageUrl)
        }
      } catch {
        // ignore profile fetch errors for now
      } finally {
        setProfileLoading(false)
      }
    }
    fetchProfile()
  }, [apiBaseUrl])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        setProfileImageFile(file)
        setProfileImagePreview(dataUrl)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setProfileImageFile(null)
    setProfileImagePreview(profileImageUrl ? profileImageUrl : null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setSaveErrorMessage("")
    setSaveSuccess(false)
    const token =
      localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
    if (!token) {
      setSaveErrorMessage("로그인이 필요합니다.")
      setIsSaving(false)
      return
    }
    if (!profileImageFile) {
      setSaveErrorMessage("변경할 사진을 선택해 주세요.")
      setIsSaving(false)
      return
    }
    try {
      const formData = new FormData()
      formData.append("image", profileImageFile)
      const response = await fetch(`${apiBaseUrl}/users/me/profile-image`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      if (!response.ok) {
        throw new Error("profile update failed")
      }
      try {
        const data = await response.json()
        if (data?.profile_image_url) {
          setProfileImageUrl(data.profile_image_url)
          setProfileImagePreview(data.profile_image_url)
        }
      } catch {
        // ignore non-json responses
      }
      setProfileImageFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setSaveSuccess(true)
    } catch {
      setSaveErrorMessage("프로필 사진 저장에 실패했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {/* Back Button */}
          <Link href="/mypage" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            마이페이지로 돌아가기
          </Link>

          <h1 className="text-2xl font-bold text-foreground mb-6">설정</h1>

          <div className="space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  프로필 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Image */}
                <div className="space-y-3">
                  <Label>프로필 사진</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-20 w-20 border-2 border-slate-200">
                        <AvatarImage src={profileImagePreview || undefined} alt="프로필" />
                        <AvatarFallback className="bg-primary/10 text-primary text-xl">
                          {profile.name?.trim() ? profile.name.trim().slice(0, 1) : "?"}
                        </AvatarFallback>
                      </Avatar>
                      {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="profile-upload"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-transparent"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Camera className="h-4 w-4" />
                        사진 변경
                      </Button>
                      {profileImagePreview && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={handleRemoveImage}
                        >
                          사진 삭제
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    사진 변경 후 저장하면 프로필이 업데이트됩니다.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    readOnly
                    className="bg-muted/50"
                    placeholder={profileLoading ? "불러오는 중..." : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    readOnly
                    className="bg-muted/50"
                    placeholder={profileLoading ? "불러오는 중..." : ""}
                  />
                </div>
                <Button className="mt-2" onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    "변경사항 저장"
                  )}
                </Button>
                {saveSuccess && (
                  <p className="text-sm text-emerald-600">프로필 사진이 저장되었습니다.</p>
                )}
                {saveErrorMessage && (
                  <p className="text-sm text-destructive">{saveErrorMessage}</p>
                )}
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-5 w-5 text-primary" />
                  알림 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notif">이메일 알림</Label>
                    <p className="text-sm text-muted-foreground">분석 완료 및 중요 알림을 이메일로 받습니다</p>
                  </div>
                  <Switch 
                    id="email-notif" 
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notif">푸시 알림</Label>
                    <p className="text-sm text-muted-foreground">앱 푸시 알림을 받습니다</p>
                  </div>
                  <Switch 
                    id="push-notif" 
                    checked={notifications.push}
                    onCheckedChange={(checked) => setNotifications({...notifications, push: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="community-notif">커뮤니티 알림</Label>
                    <p className="text-sm text-muted-foreground">내 글에 대한 댓글, 좋아요 알림</p>
                  </div>
                  <Switch 
                    id="community-notif" 
                    checked={notifications.community}
                    onCheckedChange={(checked) => setNotifications({...notifications, community: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing-notif">마케팅 알림</Label>
                    <p className="text-sm text-muted-foreground">이벤트 및 프로모션 정보</p>
                  </div>
                  <Switch 
                    id="marketing-notif" 
                    checked={notifications.marketing}
                    onCheckedChange={(checked) => setNotifications({...notifications, marketing: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  보안 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <span>비밀번호 변경</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                <Separator />
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <span>2단계 인증 설정</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                <Separator />
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <span>로그인 기록</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>

            {/* Subscription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                  구독 관리
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground">현재 구독 중인 플랜이 없습니다.</p>
                </div>
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <span>결제 수단 관리</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                <Separator className="my-2" />
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <span>결제 내역</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-lg text-destructive">계정 관리</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full gap-2 bg-transparent">
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full gap-2">
                      <Trash2 className="h-4 w-4" />
                      계정 삭제
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>정말 계정을 삭제하시겠습니까?</AlertDialogTitle>
                      <AlertDialogDescription>
                        계정을 삭제하면 모든 데이터(분석 기록, 아이 정보, 커뮤니티 활동 등)가 영구적으로 삭제되며 복구할 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        삭제하기
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
