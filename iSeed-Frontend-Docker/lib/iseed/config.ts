/**
 * iSeed 서비스 설정 / Feature Flag
 *
 * 공모전(GovTech) 버전에서는 아래 5가지를 핵심 서비스로 노출합니다.
 *   1. 그림 심리검사   2. AI 분석   3. 마음 리포트   4. 마음활동/게임   5. 씨앗 성장
 *
 * ⚠️ 기존 기능(맘스퀘어 커뮤니티, 주변 상담소, 맞춤 솔루션)은
 *    코드와 API를 그대로 보존하고, 여기 플래그로만 메뉴에서 숨깁니다.
 *    다시 쓰고 싶으면 해당 값을 true 로 바꾸기만 하면 됩니다.
 */

export const BRAND = {
  name: "iSeed",
  nameKo: "아이씨드",
  slogan: "아이의 작은 마음 신호를 발견하고, 함께 키워요.",
  subCopy: "그림 속 작은 신호에서 시작되는 마음 성장",
  reportTitle: "iSeed 마음 리포트",
} as const

export const FEATURES = {
  /** 그림 심리검사 + AI 분석 + 리포트 (핵심) */
  drawingAnalysis: true,
  /** 마음활동 / 게임 (핵심, iSeed 신규) */
  activities: true,
  /** 마음 씨앗 성장 (핵심, iSeed 신규) */
  seedGrowth: true,
  /** 마이페이지 */
  mypage: true,

  // ── 아래는 기존 기능: 코드는 남아 있고 메뉴에서만 숨김 ──────────────
  /** 맘스퀘어 커뮤니티 (/community) */
  community: false,
  /** 주변 상담소 지도 (/counseling) */
  counseling: false,
  /** 맞춤 솔루션 (/solutions) */
  solutions: false,
  /** 상담 챗봇 플로팅 버튼 */
  chatbot: true,
} as const

export type FeatureKey = keyof typeof FEATURES

export function isEnabled(key: FeatureKey): boolean {
  return FEATURES[key] === true
}

/**
 * 심리 분석 결과를 보호자에게 보여줄 때 항상 함께 노출하는 안내 문구.
 * iSeed는 진단 서비스가 아니라 보조적 정서지원 서비스입니다.
 */
export const DISCLAIMER = {
  short: "이 결과는 전문적인 심리 진단을 대체하지 않습니다.",
  long:
    "iSeed의 분석은 아이의 그림에서 관찰된 정서 신호를 정리한 보조 자료입니다. " +
    "특정 질환을 진단하거나 단정하지 않으며, 유사한 신호가 지속적으로 관찰될 경우 " +
    "아동 심리 전문가와의 상담을 권장합니다.",
} as const
