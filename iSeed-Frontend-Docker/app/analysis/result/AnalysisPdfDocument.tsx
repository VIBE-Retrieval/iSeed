"use client";

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// 한글 표시 — 같은 출처 폰트 사용 (CORS 방지)
const FONT_FAMILY = "NanumGothic";
try {
  Font.register({
    family: FONT_FAMILY,
    src: "/fonts/NanumGothic-Regular.ttf",
  });
} catch {
  // 등록 실패 시 기본 폰트 사용
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: FONT_FAMILY,
    fontSize: 10,
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 16,
  },
  date: {
    fontSize: 9,
    color: "#94a3b8",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 4,
  },
  card: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rowGap: { marginRight: 12 },
  scoreBox: {
    width: 48,
    height: 48,
    backgroundColor: "#0d9488",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 6,
    flex: 1,
  },
  label: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 2,
  },
  imageRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  imageWrap: {
    width: "50%",
    paddingRight: 8,
    marginBottom: 8,
  },
  imageWrapRight: {
    width: "50%",
    paddingLeft: 8,
    marginBottom: 8,
  },
  imageLabel: {
    fontSize: 9,
    marginBottom: 4,
    fontWeight: "bold",
  },
  image: {
    width: "100%",
    height: 140,
    objectFit: "contain",
  },
  imagePlaceholder: {
    height: 140,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  bulletList: {
    marginLeft: 8,
    marginBottom: 4,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bulletDot: {
    width: 14,
    fontSize: 10,
    marginRight: 4,
  },
  interpretationBlock: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
  },
  interpretationHeading: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
  },
});

export type AnalysisPdfProps = {
  title: string;
  subtitle: string;
  date: string;
  overallScore: number;
  scoreLabel: string;
  summary: string;
  developmentStage: string;
  wholeResult: {
    종합_요약?: string;
    인상적_분석?: string;
    표상적_분석_종합?: string;
  } | null;
  boxImages: Record<string, string | null>;
  peerComparisonData: { name: string; child: number }[];
  developmentScores: { name: string; value: number; label?: string }[];
  interpretationSections: {
    drawingLabel: string;
    sections: { heading: string; content: string }[];
  }[];
  recommendations: { category: string; items: string[] }[];
};

export function AnalysisPdfDocument({
  title,
  subtitle,
  date,
  overallScore,
  scoreLabel,
  summary,
  developmentStage,
  wholeResult,
  boxImages,
  peerComparisonData,
  developmentScores,
  interpretationSections,
  recommendations,
}: AnalysisPdfProps) {
  const imageLabels: Record<string, string> = {
    tree: "나무",
    house: "집",
    man: "남자사람",
    woman: "여자사람",
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.date}>{date}</Text>

        {/* 종합 요약 카드 */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.scoreBox, styles.rowGap]}>
              <Text style={styles.scoreText}>{overallScore}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>종합 점수 (T-Score)</Text>
              <Text style={styles.bodyText}>{scoreLabel}</Text>
              <Text style={styles.label}>발달 단계</Text>
              <Text style={styles.bodyText}>{developmentStage}</Text>
            </View>
          </View>
          <Text style={styles.label}>전체 심리 결과 요약</Text>
          <Text style={styles.bodyText}>{summary}</Text>
        </View>

        {/* 전체 심리 결과 */}
        {wholeResult &&
          (wholeResult.종합_요약 ||
            wholeResult.인상적_분석 ||
            wholeResult.표상적_분석_종합) && (
            <>
              <Text style={styles.sectionTitle}>전체 심리 결과</Text>
              {wholeResult.종합_요약?.trim() && (
                <View style={styles.card}>
                  <Text style={styles.interpretationHeading}>종합 요약</Text>
                  <Text style={styles.bodyText}>{wholeResult.종합_요약}</Text>
                </View>
              )}
              {wholeResult.인상적_분석?.trim() && (
                <View style={styles.card}>
                  <Text style={styles.interpretationHeading}>인상적 분석</Text>
                  <Text style={styles.bodyText}>
                    {wholeResult.인상적_분석}
                  </Text>
                </View>
              )}
              {wholeResult.표상적_분석_종합?.trim() && (
                <View style={styles.card}>
                  <Text style={styles.interpretationHeading}>
                    표상적 분석 종합
                  </Text>
                  <Text style={styles.bodyText}>
                    {wholeResult.표상적_분석_종합}
                  </Text>
                </View>
              )}
            </>
          )}
      </Page>

      {/* 기본 분석 - 4장 이미지 (2x2 고정 그리드) */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>시각적 분석</Text>
        <View style={styles.imageRow}>
          <View style={styles.imageWrap}>
            <Text style={styles.imageLabel}>{imageLabels.tree}</Text>
            {boxImages.tree ? (
              <Image
                style={styles.image}
                src={boxImages.tree.startsWith("data:") ? boxImages.tree : `data:image/jpeg;base64,${boxImages.tree}`}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.label}>이미지 없음</Text>
              </View>
            )}
          </View>
          <View style={styles.imageWrapRight}>
            <Text style={styles.imageLabel}>{imageLabels.house}</Text>
            {boxImages.house ? (
              <Image
                style={styles.image}
                src={boxImages.house.startsWith("data:") ? boxImages.house : `data:image/jpeg;base64,${boxImages.house}`}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.label}>이미지 없음</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.imageRow}>
          <View style={styles.imageWrap}>
            <Text style={styles.imageLabel}>{imageLabels.man}</Text>
            {boxImages.man ? (
              <Image
                style={styles.image}
                src={boxImages.man.startsWith("data:") ? boxImages.man : `data:image/jpeg;base64,${boxImages.man}`}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.label}>이미지 없음</Text>
              </View>
            )}
          </View>
          <View style={styles.imageWrapRight}>
            <Text style={styles.imageLabel}>{imageLabels.woman}</Text>
            {boxImages.woman ? (
              <Image
                style={styles.image}
                src={boxImages.woman.startsWith("data:") ? boxImages.woman : `data:image/jpeg;base64,${boxImages.woman}`}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.label}>이미지 없음</Text>
              </View>
            )}
          </View>
        </View>

        {/* 발달 비교 */}
        {peerComparisonData.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>또래 비교 (T-Score)</Text>
            <View style={styles.card}>
              {peerComparisonData.map((row, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text style={styles.bodyText}>{row.name}</Text>
                  <Text style={styles.bodyText}>{row.child}점</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {developmentScores.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>발달 단계 점수</Text>
            <View style={styles.card}>
              {developmentScores.map((s, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text style={styles.bodyText}>{s.name}</Text>
                  <Text style={styles.bodyText}>
                    {s.value}점{s.label ? ` (${s.label})` : ""}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Page>

      {/* 심리 해석 */}
      {interpretationSections.map((block, blockIdx) => (
        <Page key={blockIdx} size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>{block.drawingLabel} 심리 해석</Text>
          {block.sections.map((sec, secIdx) => (
            <View key={secIdx} style={styles.interpretationBlock}>
              <Text style={styles.interpretationHeading}>{sec.heading}</Text>
              <Text style={styles.bodyText}>{sec.content}</Text>
            </View>
          ))}
        </Page>
      ))}

      {/* 추천 사항 */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>추천 사항</Text>
        {recommendations.map((rec, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.interpretationHeading}>{rec.category}</Text>
            {rec.items.map((item, j) => (
              <View key={j} style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={[styles.bodyText, { marginBottom: 2 }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        ))}
        <Text style={[styles.date, { marginTop: 24 }]}>
          — iSeed 마음 리포트
        </Text>
      </Page>
    </Document>
  );
}
