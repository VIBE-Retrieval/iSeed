import { NextResponse } from "next/server"
import path from "path"
import { readFile } from "fs/promises"

/**
 * 개발용 로컬 결과 이미지 서빙 라우트.
 * 과거에는 원본 프로젝트의 절대경로가 하드코딩되어 있었으나,
 * iSeed에서는 환경변수(ANALYSIS_RESULT_DIR / ANALYSIS_TEST_DIR)로 분리했습니다.
 * 미설정 시 404로 비활성 처리되며, 운영 플로우는 AiModels가 돌려주는 base64 이미지를
 * 사용하므로 이 라우트가 없어도 그림 분석 → 리포트 흐름에는 영향이 없습니다.
 */
const RESULT_DIR = process.env.ANALYSIS_RESULT_DIR || ""
const TEST_DIR = process.env.ANALYSIS_TEST_DIR || ""
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"])
const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
}

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  const rawName = params.filename || ""
  let decodedName = rawName
  try {
    decodedName = decodeURIComponent(rawName)
  } catch {
    return new NextResponse("Invalid filename", { status: 400 })
  }
  const safeName = path.basename(decodedName)
  if (safeName !== decodedName) {
    return new NextResponse("Invalid filename", { status: 400 })
  }

  const ext = path.extname(safeName).toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return new NextResponse("Unsupported file type", { status: 400 })
  }

  const url = new URL(request.url)
  const dirParam = (url.searchParams.get("dir") || "").toLowerCase()
  const baseDir = dirParam === "test" ? TEST_DIR : RESULT_DIR
  if (!baseDir) {
    return new NextResponse("Local result directory is not configured", {
      status: 404,
    })
  }
  const filePath = path.join(baseDir, safeName)

  try {
    const file = await readFile(filePath)
    return new NextResponse(file, {
      headers: {
        "Content-Type": CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return new NextResponse("File not found", { status: 404 })
  }
}
