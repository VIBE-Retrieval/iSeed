"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative h-[90vh] min-h-[600px] max-h-[900px] overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          poster="https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=1920&q=80"
        >
          <source
            src="https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4"
            type="video/mp4"
          />
        </video>
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              아이의 마음을 이해하는 시대,
              <br />
              <span className="text-primary">iSeed</span>
            </h1>
            
            <p className="mt-6 text-base md:text-lg text-white/90 leading-relaxed">
              아이가 말로 표현하지 못하는 감정이 있듯,
              <br />
              그림에는 <span className="text-primary font-medium">심리 분석</span>이 필요합니다
            </p>

            <div className="mt-8">
              <Link href="/analysis">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 rounded-full px-8 h-12 text-base font-medium shadow-lg"
                >
                  그림 분석 시작하기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  )
}
