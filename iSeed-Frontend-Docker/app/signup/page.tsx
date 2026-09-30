"use client";

import React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, ArrowLeft, Check } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
  });

  const passwordRequirements = [
    { label: "8자 이상", met: formData.password.length >= 8 },
    { label: "영문 포함", met: /[a-zA-Z]/.test(formData.password) },
    { label: "숫자 포함", met: /[0-9]/.test(formData.password) },
  ];
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeTerms || !formData.agreePrivacy) {
      alert("이용약관과 개인정보처리방침에 동의해주세요.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          agree_terms: formData.agreeTerms,
          agree_privacy: formData.agreePrivacy,
          agree_marketing: formData.agreeMarketing,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData?.detail?.message || "회원가입에 실패했습니다.";
        throw new Error(message);
      }
      setIsLoading(false);
      router.push("/login");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "회원가입에 실패했습니다.";
      alert(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">홈으로 돌아가기</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="text-center space-y-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 justify-center"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary overflow-hidden">
                <img
                  src="/iseed.png"
                  alt="iSeed"
                  className="h-6 w-6 object-contain"
                />
              </div>
              <span className="text-2xl font-semibold text-foreground">
                iSeed
              </span>
            </Link>
            <p className="text-muted-foreground">
              아이의 마음을 이해하는 첫 걸음
            </p>
          </div>

          {/* Signup Card */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl">회원가입</CardTitle>
              <CardDescription>
                계정을 만들어 iSeed 서비스를 시작하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="홍길동"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="비밀번호를 입력하세요"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">비밀번호 표시 토글</span>
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {passwordRequirements.map((req, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-1 text-xs ${
                          req.met ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full flex items-center justify-center ${
                            req.met ? "bg-primary/10" : "bg-muted"
                          }`}
                        >
                          {req.met && <Check className="h-2.5 w-2.5" />}
                        </div>
                        {req.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="비밀번호를 다시 입력하세요"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">비밀번호 표시 토글</span>
                    </Button>
                  </div>
                  {formData.confirmPassword &&
                    formData.password !== formData.confirmPassword && (
                      <p className="text-xs text-destructive">
                        비밀번호가 일치하지 않습니다
                      </p>
                    )}
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="agreeTerms"
                      checked={formData.agreeTerms}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          agreeTerms: checked === true,
                        })
                      }
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="agreeTerms"
                      className="text-sm font-normal cursor-pointer leading-relaxed"
                    >
                      <span className="text-destructive">*</span>{" "}
                      <Link
                        href="/terms"
                        className="text-primary hover:underline"
                      >
                        이용약관
                      </Link>
                      에 동의합니다
                    </Label>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="agreePrivacy"
                      checked={formData.agreePrivacy}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          agreePrivacy: checked === true,
                        })
                      }
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="agreePrivacy"
                      className="text-sm font-normal cursor-pointer leading-relaxed"
                    >
                      <span className="text-destructive">*</span>{" "}
                      <Link
                        href="/privacy"
                        className="text-primary hover:underline"
                      >
                        개인정보처리방침
                      </Link>
                      에 동의합니다
                    </Label>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="agreeMarketing"
                      checked={formData.agreeMarketing}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          agreeMarketing: checked === true,
                        })
                      }
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="agreeMarketing"
                      className="text-sm font-normal cursor-pointer leading-relaxed"
                    >
                      마케팅 정보 수신에 동의합니다 (선택)
                    </Label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isLoading || !formData.agreeTerms || !formData.agreePrivacy
                  }
                >
                  {isLoading ? "가입 중..." : "회원가입"}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    또는
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full gap-2 bg-transparent"
                  type="button"
                  onClick={() => {
                    const baseUrl =
                      process.env.NEXT_PUBLIC_API_BASE_URL ??
                      "http://localhost:8000";
                    window.location.href = `${baseUrl}/auth/google/login`;
                  }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google로 계속하기
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2 bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] border-[#FEE500]"
                  type="button"
                  onClick={() => {
                    const baseUrl =
                      process.env.NEXT_PUBLIC_API_BASE_URL ??
                      "http://localhost:8000";
                    window.location.href = `${baseUrl}/auth/kakao/login`;
                  }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"
                    />
                  </svg>
                  카카오로 계속하기
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              로그인
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
