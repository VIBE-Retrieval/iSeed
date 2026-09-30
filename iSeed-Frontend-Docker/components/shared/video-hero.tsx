"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

interface VideoHeroProps {
  title: string
  subtitle?: string
  highlightText?: string
  description?: string
  ctaText?: string
  ctaHref?: string
  height?: "full" | "medium" | "small"
}

export function VideoHero({
  title,
  subtitle,
  highlightText,
  description,
  ctaText,
  ctaHref,
  height = "medium"
}: VideoHeroProps) {
  const heightClass = {
    full: "h-screen",
    medium: "h-[50vh] min-h-[400px]",
    small: "h-[40vh] min-h-[300px]"
  }

  return (
    <section className={`relative ${heightClass[height]} w-full overflow-hidden`}>
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source
          src="https://videos.pexels.com/video-files/3209211/3209211-uhd_2560_1440_25fps.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 pt-14">
        <div className="max-w-3xl mx-auto">
          {subtitle && (
            <p className="text-white/90 text-base md:text-lg mb-2">
              {subtitle}
            </p>
          )}
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            {highlightText ? (
              <>
                {title.split(highlightText)[0]}
                <span className="text-primary">{highlightText}</span>
                {title.split(highlightText)[1]}
              </>
            ) : (
              title
            )}
          </h1>

          {description && (
            <p className="text-white/80 text-sm md:text-base leading-relaxed mb-6 max-w-xl mx-auto">
              {description}
            </p>
          )}

          {ctaText && ctaHref && (
            <Link href={ctaHref}>
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 rounded-full px-8 font-medium"
              >
                {ctaText}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
