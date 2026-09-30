import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/home/hero-section"
import { FeaturesSection } from "@/components/home/features-section"
import { StatsSection } from "@/components/home/stats-section"
import { SeedJourneySection } from "@/components/home/seed-journey-section"
import {
  AnalysisShowcase,
  ChatbotShowcase,
  CommunityShowcase,
  CounselingShowcase,
  MypageShowcase,
} from "@/components/home/feature-showcase-sections"
import { FEATURES } from "@/lib/iseed/config"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero with header overlay - no top padding needed */}
        <div className="-mt-14">
          <HeroSection />
        </div>
        <FeaturesSection />
        <StatsSection />
        <AnalysisShowcase />
        {/* iSeed: Seed → Sprout → Leaf → Tree 성장 여정 */}
        {FEATURES.seedGrowth && <SeedJourneySection />}
        {/* 아래 기존 섹션들은 삭제하지 않고 FEATURES 플래그로만 노출을 제어합니다 */}
        {FEATURES.chatbot && <ChatbotShowcase />}
        {FEATURES.community && <CommunityShowcase />}
        {FEATURES.counseling && <CounselingShowcase />}
        {FEATURES.mypage && <MypageShowcase />}
      </main>
      <Footer />
    </div>
  )
}
