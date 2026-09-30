import React from "react"
import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ChatbotModal } from '@/components/chatbot/chatbot-modal'
import './globals.css'

const notoSansKr = Noto_Sans_KR({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-kr"
});

export const metadata: Metadata = {
  title: 'iSeed(아이씨드) - 아이의 작은 마음 신호를 발견하고, 함께 키워요',
  description:
    'iSeed(아이씨드)는 아이의 그림 속 작은 마음 신호를 AI로 살펴보고, 보호자용 마음 리포트와 맞춤 마음활동으로 아이의 마음 씨앗이 자라도록 돕는 아동 정서지원 플랫폼입니다.',
  generator: 'iSeed',
  icons: {
    icon: '/iseed.ico',
    apple: '/iseed.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} font-sans antialiased`}>
        {children}
        <ChatbotModal />
        <Analytics />
      </body>
    </html>
  )
}
