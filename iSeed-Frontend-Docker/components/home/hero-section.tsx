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
              아이의 작은 마음 신호를 발견하고,
              <br />
              함께 키워요 <span className="text-primary">iSeed</span>
            </h1>
            
            <p className="mt-6 text-base md:text-lg text-white/90 leading-relaxed">
              그림 속 작은 신호에서 시작되는 마음 성장.
              <br />
              <span className="text-primary font-medium">씨앗</span>에서 <span className="text-primary font-medium">마음나무</span>까지, 아이와 함께 키워요.
            </p>

            <div className="mt-8">
              <Link href="/analysis">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 rounded-full px-8 h-12 text-base font-medium shadow-lg"
                >
                  마음 씨앗 찾기 시작
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
