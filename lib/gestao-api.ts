import { NextRequest, NextResponse } from "next/server"
import { mintGestaoJwt, type GestaoJwtClaims } from "@/lib/gestao-token"

const DEFAULT_GESTAO_API_URL = "https://gestao-api.pibrr.com"

export function getGestaoApiUrl(): string {
  return (process.env.GESTAO_API_URL || DEFAULT_GESTAO_API_URL).replace(/\/$/, "")
}

export function isGestaoBffEnabled(): boolean {
  const raw = process.env.FEATURE_FLAG_GESTAO_BFF?.trim().toLowerCase()
  return raw === "1" || raw === "true" || raw === "on" || raw === "yes"
}

export type GestaoSession = GestaoJwtClaims

type GestaoFetchOptions = {
  method?: string
  body?: BodyInit | null
  headers?: HeadersInit
  searchParams?: URLSearchParams | string
  session?: GestaoSession | null
  /** Skip Authorization header (public endpoints). */
  public?: boolean
  timeoutMs?: number
}

/** Server-only fetch to gestao-api `/v1/...`. Always use `/v1` paths (never `/api`). */
export async function gestaoFetch(
  path: string,
  options: GestaoFetchOptions = {}
): Promise<Response> {
  const base = getGestaoApiUrl()
  const normalized = path.startsWith("/") ? path : `/${path}`
  const v1Path = normalized.startsWith("/v1/")
    ? normalized
    : normalized.startsWith("/v1")
      ? normalized
      : `/v1${normalized.startsWith("/") ? "" : "/"}${normalized.replace(/^\/api/, "")}`

  const url = new URL(v1Path, `${base}/`)
  if (options.searchParams) {
    const sp =
      typeof options.searchParams === "string"
        ? new URLSearchParams(options.searchParams)
        : options.searchParams
    sp.forEach((value, key) => url.searchParams.set(key, value))
  }

  const headers = new Headers(options.headers)
  if (!options.public && options.session?.userId) {
    const token = await mintGestaoJwt(options.session)
    headers.set("Authorization", `Bearer ${token}`)
  }
  if (options.body && !headers.has("Content-Type") && typeof options.body === "string") {
    headers.set("Content-Type", "application/json")
  }

  const timeoutMs = options.timeoutMs ?? 25_000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url.toString(), {
      method: options.method || "GET",
      headers,
      body: options.body,
      signal: controller.signal,
      cache: "no-store",
    })
  } finally {
    clearTimeout(timer)
  }
}

export async function gestaoFetchJson<T = unknown>(
  path: string,
  options: GestaoFetchOptions = {}
): Promise<{ ok: boolean; status: number; data: T | null; text: string }> {
  const res = await gestaoFetch(path, options)
  const text = await res.text()
  let data: T | null = null
  if (text) {
    try {
      data = JSON.parse(text) as T
    } catch {
      data = null
    }
  }
  return { ok: res.ok, status: res.status, data, text }
}

/** Map Next `/api/...` request onto gestao-api `/v1/...` and return the upstream response. */
export async function proxyRequestToGestao(
  request: NextRequest,
  session?: GestaoSession | null,
  opts?: { public?: boolean }
): Promise<NextResponse> {
  const incoming = new URL(request.url)
  const apiPath = incoming.pathname
  const v1Path = apiPath.replace(/^\/api/, "/v1")

  const method = request.method.toUpperCase()
  const headers = new Headers()
  const contentType = request.headers.get("content-type")
  if (contentType) headers.set("Content-Type", contentType)

  let body: BodyInit | null = null
  if (method !== "GET" && method !== "HEAD") {
    if (contentType?.includes("multipart/form-data")) {
      body = await request.arrayBuffer()
    } else {
      const text = await request.text()
      body = text || null
    }
  }

  try {
    const upstream = await gestaoFetch(v1Path, {
      method,
      body,
      headers,
      searchParams: incoming.searchParams,
      session: opts?.public ? null : session,
      public: opts?.public || !session?.userId,
    })

    const responseHeaders = new Headers()
    const upstreamType = upstream.headers.get("content-type")
    if (upstreamType) responseHeaders.set("content-type", upstreamType)

    const buf = await upstream.arrayBuffer()
    return new NextResponse(buf, {
      status: upstream.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error("[gestao-bff] proxy failed", v1Path, error)
    return NextResponse.json(
      { error: "Falha ao contatar gestao-api" },
      { status: 502 }
    )
  }
}
