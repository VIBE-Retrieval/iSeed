import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export const runtime = "nodejs";

type JsonCacheEntry = { mtimeMs: number; data: unknown };
const jsonCache = new Map<string, JsonCacheEntry>();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const file = url.searchParams.get("file");
  const list = url.searchParams.get("list");

  // `AiMind-FrontEnd/json` 폴더의 로컬 JSON 파일을 읽어 반환합니다.
  // - 클라이언트에서 직접 JSON import(한글 파일명 포함) 시 Turbopack 빌드가 깨질 수 있어 API로 제공합니다.
  if (file) {
    const isJson = /\.json$/i.test(file);
    const hasTraversal =
      file.includes("..") || file.includes("/") || file.includes("\\");
    if (!isJson || hasTraversal) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }

    try {
      const filePath = path.join(process.cwd(), "json", file);
      // Dev 환경에서도 파일 변경이 즉시 반영되도록 mtime 기반 캐시 무효화를 적용합니다.
      const stat = await fs.stat(filePath);
      const cached = jsonCache.get(file);
      if (cached && cached.mtimeMs === stat.mtimeMs) {
        return NextResponse.json(cached.data);
      }

      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      jsonCache.set(file, { mtimeMs: stat.mtimeMs, data: parsed });
      return NextResponse.json(parsed);
    } catch (e) {
      jsonCache.delete(file);
      return NextResponse.json(
        {
          error: "Failed to read json file",
          file,
          message: e instanceof Error ? e.message : String(e),
        },
        { status: 404 },
      );
    }
  }

  // `AiMind-FrontEnd/json` 폴더에 있는 JSON 파일 목록을 반환합니다.
  // - 클라이언트에서 어떤 파일을 로드할지 동적으로 결정하기 위해 사용
  if (list) {
    try {
      const dirPath = path.join(process.cwd(), "json");
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files = entries
        .filter((e) => e.isFile())
        .map((e) => e.name)
        .filter((name) => /\.json$/i.test(name))
        .sort();

      return NextResponse.json({ files, count: files.length });
    } catch (e) {
      // 개발/배포 환경에 따라 `json/` 폴더가 아직 없을 수 있습니다.
      // 이 경우 500 대신 "빈 목록"으로 응답해 프론트가 샘플 데이터로 정상 동작하게 합니다.
      if (
        typeof e === "object" &&
        e &&
        "code" in e &&
        (e as { code?: unknown }).code === "ENOENT"
      ) {
        return NextResponse.json({
          files: [],
          count: 0,
          missing: true,
          message:
            "json folder not found. Expected at <projectRoot>/json (create folder and add *.json)",
        });
      }
      return NextResponse.json(
        {
          error: "Failed to list json files",
          message: e instanceof Error ? e.message : String(e),
        },
        { status: 500 },
      );
    }
  }

  const candidates = [
    "NEXT_PUBLIC_KAKAO_MAP_APP_KEY",
    "NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY",
    "NEXT_PUBLIC_KAKAO_JAVASCRIPT_API_KEY",
    "NEXT_PUBLIC_KAKAO_JS_KEY",
    "NEXT_PUBLIC_KAKAO_APP_KEY",
    "KAKAO_MAP_API_KEY",
    "KAKAO_MAP_APP_KEY",
    "NEXT_PUBLIC_KAKAO_MAP_API_KEY",
    "KAKAO_API_KEY",
    "KAKAO_JAVASCRIPT_KEY",
    "KAKAO_JAVASCRIPT_API_KEY",
    "KAKAO_JS_KEY",
    "KAKAO_APP_KEY",
    "KAKAO_MAP_KEY",
    "KAKAO_KEY",
    "NEXT_PUBLIC_KAKAO_MAP_KEY",
    "NEXT_PUBLIC_KAKAO_KEY",
  ] as const;

  const rawKey =
    process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ||
    process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY ||
    process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_API_KEY ||
    process.env.NEXT_PUBLIC_KAKAO_JS_KEY ||
    process.env.NEXT_PUBLIC_KAKAO_APP_KEY ||
    process.env.KAKAO_MAP_API_KEY ||
    process.env.KAKAO_MAP_APP_KEY ||
    process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY ||
    process.env.KAKAO_API_KEY ||
    process.env.KAKAO_JAVASCRIPT_KEY ||
    process.env.KAKAO_JAVASCRIPT_API_KEY ||
    process.env.KAKAO_JS_KEY ||
    process.env.KAKAO_APP_KEY ||
    process.env.KAKAO_MAP_KEY ||
    process.env.KAKAO_KEY ||
    process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ||
    process.env.NEXT_PUBLIC_KAKAO_KEY;

  const apiKey =
    typeof rawKey === "string" ? rawKey.replace(/['"]/g, "").trim() : "";

  if (!apiKey) {
    const presentKeys = candidates.filter((k) => Boolean(process.env[k]));
    return NextResponse.json(
      {
        error: "API key not configured",
        expectedAnyOf: candidates,
        presentKeys,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ apiKey });
}
