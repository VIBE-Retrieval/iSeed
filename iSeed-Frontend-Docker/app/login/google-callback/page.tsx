"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (token) {
      // 소셜 로그인은 기본적으로 로그인 유지 (localStorage)로 처리
      try {
        localStorage.setItem("auth_token", token);
        if (email) {
          localStorage.setItem("auth_email", email);
        }
      } catch {
        // 스토리지 오류는 무시하고 마이페이지로 이동 시도
      }
      router.replace("/mypage");
    } else {
      // 토큰이 없으면 로그인 페이지로 되돌리기
      router.replace("/login");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 -mt-[var(--header-height)]">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">구글 로그인 처리 중입니다...</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50" />}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
