export const UI_COOKIE = "pibrr_ui"
export type AppUiVersion = "v1" | "v2"

export type AppPaths = {
  feed: string
  escalas: string
  admin: string
  perfil: string
}

export const APP_PATHS: Record<AppUiVersion, AppPaths> = {
  v1: {
    feed: "/feed",
    escalas: "/minha-area",
    admin: "/admin",
    perfil: "/minha-area/perfil",
  },
  v2: {
    feed: "/feed",
    escalas: "/minha-area",
    admin: "/admin",
    perfil: "/minha-area/perfil",
  },
}

export function envUiVersion(): AppUiVersion {
  return "v2"
}

export function parseUiCookie(value?: string | null): AppUiVersion | null {
  if (value === "v2" || value === "v1") return value
  return null
}

export function resolveUiVersion(cookie?: string | null): AppUiVersion {
  if (envUiVersion() === "v2") return "v2"
  return parseUiCookie(cookie) ?? "v1"
}

export function readUiCookieFromDocument(): AppUiVersion | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${UI_COOKIE}=([^;]*)`))
  return parseUiCookie(match?.[1] ? decodeURIComponent(match[1]) : null)
}

export function setUiCookie(version: AppUiVersion) {
  if (typeof document === "undefined") return
  document.cookie = `${UI_COOKIE}=${version}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}

export function getAppPaths(version?: AppUiVersion): AppPaths {
  const resolved =
    version ??
    (typeof window !== "undefined"
      ? resolveUiVersion(readUiCookieFromDocument())
      : envUiVersion())
  return APP_PATHS[resolved]
}
