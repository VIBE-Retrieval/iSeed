import { NextRequest } from "next/server";

/**
 * GET /api/image-proxy?url=...
 * 서버에서 이미지 URL을 fetch해서 그대로 반환 (PDF 저장 시 CORS 회피용)
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
    return new Response("Invalid url", { status: 400 });
  }
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AiMind-PDF/1.0" },
    });
    if (!res.ok) {
      return new Response("Upstream error", { status: res.status });
    }
    const blob = await res.blob();
    const contentType = res.headers.get("content-type") || blob.type || "image/jpeg";
    return new Response(blob, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    console.error("[image-proxy]", e);
    return new Response("Fetch failed", { status: 502 });
  }
}
