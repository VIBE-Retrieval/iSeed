import { NextResponse } from "next/server";

export const runtime = "nodejs";

type FetchResult =
  | { url: string; ok: true; status: number; json: unknown }
  | { url: string; ok: false; status?: number; error: string; title?: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clampNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function clampInt(value: unknown, fallback: number, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const n = Math.trunc(value);
  return Math.min(max, Math.max(min, n));
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/\s*[:：]\s*네이버\s*블로그\s*$/i, "")
    .replace(/\s*-\s*네이버\s*블로그\s*$/i, "")
    .replace(/\s*[:：]\s*NAVER\s*Blog\s*$/i, "")
    .replace(/\s*-\s*NAVER\s*Blog\s*$/i, "")
    .replace(/\s*\|\s*.*$/, "")
    .trim();
}

function extractHtmlTitle(html: string): string | undefined {
  const og =
    html.match(
      /<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    ) ||
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:title["'][^>]*>/i,
    );
  if (og?.[1]) {
    const t = cleanTitle(og[1]);
    if (t) return t;
  }

  const m = html.match(/<title[^>]*>([\s\S]{1,200}?)<\/title>/i);
  if (m?.[1]) {
    const t = cleanTitle(m[1].replace(/<[^>]*>/g, ""));
    if (t) return t;
  }

  return undefined;
}

async function fetchJson(
  url: string,
  timeoutMs: number,
  externalSignal?: AbortSignal,
): Promise<FetchResult> {
  const u = url.trim();
  if (!u) return { url, ok: false, error: "Empty url" };

  let parsed: URL;
  try {
    parsed = new URL(u);
  } catch {
    return { url, ok: false, error: "Invalid url" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { url, ok: false, error: "Only http/https are supported" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", onAbort, { once: true });
  }

  try {
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // Many OpenAPI endpoints require JSON accept header
        Accept: "application/json, text/json, */*",
        "User-Agent": "AiMind-FrontEnd/1.0 (+nextjs route handler)",
      },
    });

    const status = res.status;
    const text = await res.text();

    if (!res.ok) {
      return {
        url,
        ok: false,
        status,
        error: `HTTP ${status}`,
        title: extractHtmlTitle(text),
      };
    }

    try {
      const cleaned = text.replace(/^\uFEFF/, "").trim();
      const json = JSON.parse(cleaned) as unknown;
      return { url, ok: true, status, json };
    } catch {
      return {
        url,
        ok: false,
        status,
        error: "Response is not valid JSON",
        title: extractHtmlTitle(text),
      };
    }
  } catch (e) {
    const message =
      e instanceof Error
        ? e.name === "AbortError"
          ? "Timeout"
          : e.message
        : String(e);
    return { url, ok: false, error: message };
  } finally {
    clearTimeout(timeout);
    if (externalSignal) {
      try {
        externalSignal.removeEventListener("abort", onAbort);
      } catch {
        // ignore
      }
    }
  }
}

async function fetchAllWithConcurrency(options: {
  urls: string[];
  timeoutMs: number;
  concurrency: number;
  signal?: AbortSignal;
  onResult?: (result: FetchResult, index: number) => void;
}): Promise<FetchResult[]> {
  const { urls, timeoutMs, concurrency, signal, onResult } = options;
  const results: FetchResult[] = new Array(urls.length);

  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(concurrency, urls.length));

  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const i = nextIndex;
      nextIndex += 1;
      if (i >= urls.length) break;
      if (signal?.aborted) break;

      const r = await fetchJson(urls[i], timeoutMs, signal);
      results[i] = r;
      onResult?.(r, i);
    }
  });

  await Promise.all(workers);
  return results;
}

export async function POST(request: Request) {
  const reqUrl = new URL(request.url);
  const wantsStream =
    reqUrl.searchParams.get("stream") === "1" ||
    (request.headers.get("accept") || "").includes("text/event-stream");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Expected: { urls: string[] }" },
      { status: 400 },
    );
  }

  const urlsRaw = isPlainObject(body) ? body.urls : undefined;
  const urls = Array.isArray(urlsRaw)
    ? urlsRaw.filter((u): u is string => typeof u === "string")
    : [];

  if (urls.length === 0) {
    return NextResponse.json(
      { error: "Missing urls. Expected: { urls: string[] }" },
      { status: 400 },
    );
  }

  const timeoutMs = clampNumber(
    isPlainObject(body) ? body.timeoutMs : undefined,
    8000,
    1000,
    30000,
  );

  const concurrency = clampInt(
    isPlainObject(body)
      ? (body as Record<string, unknown>).concurrency
      : undefined,
    40,
    1,
    200,
  );

  if (!wantsStream) {
    const results = await fetchAllWithConcurrency({
      urls,
      timeoutMs,
      concurrency,
    });

    return NextResponse.json({
      results,
      count: results.length,
      timeoutMs,
      concurrency,
    });
  }

  const encoder = new TextEncoder();
  let aborter: AbortController | null = null;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      aborter = new AbortController();

      // Keep-alive comment (some proxies buffer without early bytes)
      controller.enqueue(encoder.encode(`: openapi-fetch stream\n\n`));
      controller.enqueue(
        encoder.encode(
          `event: meta\ndata: ${JSON.stringify({
            total: urls.length,
            timeoutMs,
            concurrency,
          })}\n\n`,
        ),
      );

      fetchAllWithConcurrency({
        urls,
        timeoutMs,
        concurrency,
        signal: aborter.signal,
        onResult: (result) => {
          try {
            controller.enqueue(
              encoder.encode(
                `event: result\ndata: ${JSON.stringify(result)}\n\n`,
              ),
            );
          } catch {
            // ignore enqueue errors when client disconnects
          }
        },
      })
        .then(() => {
          try {
            controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
          } catch {
            // ignore
          }
          controller.close();
        })
        .catch((e) => {
          const message = e instanceof Error ? e.message : String(e);
          try {
            controller.enqueue(
              encoder.encode(
                `event: error\ndata: ${JSON.stringify({ error: message })}\n\n`,
              ),
            );
          } catch {
            // ignore
          }
          controller.close();
        });
    },
    cancel() {
      try {
        aborter?.abort();
      } catch {
        // ignore
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
