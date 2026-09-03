import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"
import { APP_PATHS } from "@/lib/app-ui"

const ministerioDetailRegex = /^\/admin\/ministerios\/([0-9a-f-]{36})$/
const ministerioDetailV2Regex = /^\/admin-v2\/ministerios\/([0-9a-f-]{36})$/

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (
    pathname === "/" ||
    pathname.startsWith("/cadastro") ||
    pathname.startsWith("/eventos") ||
    pathname.startsWith("/ministerios") ||
    pathname.startsWith("/sobre") ||
    pathname.startsWith("/contato") ||
    pathname.startsWith("/sermoes") ||
    pathname.startsWith("/feed") ||
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/api/feed") ||
    pathname.startsWith("/api/visitantes") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const role = session.user?.role
  const ministerioIds: string[] = (session.user as { ministerioIds?: string[] }).ministerioIds || []

  if (pathname.startsWith("/admin-v2")) {
    if (role !== "admin" && role !== "supervisor" && role !== "lider") {
      return NextResponse.redirect(new URL(APP_PATHS.v2.escalas, req.url))
    }

    if (role === "admin") return NextResponse.next()

    const match = ministerioDetailV2Regex.exec(pathname)
    if (match) {
      const ministerioId = match[1]
      if (!ministerioIds.includes(ministerioId)) {
        return NextResponse.redirect(new URL("/admin-v2", req.url))
      }
      return NextResponse.next()
    }

    if (
      pathname === "/admin-v2" ||
      pathname.startsWith("/admin-v2/visitantes") ||
      pathname.startsWith("/admin-v2/mensagens")
    ) {
      return NextResponse.next()
    }

    return NextResponse.redirect(new URL("/admin-v2", req.url))
  }

  if (pathname.startsWith("/admin")) {
    if (role !== "admin" && role !== "supervisor" && role !== "lider") {
      return NextResponse.redirect(new URL("/minha-area", req.url))
    }

    if (role === "admin") return NextResponse.next()

    const match = ministerioDetailRegex.exec(pathname)
    if (match) {
      const ministerioId = match[1]
      if (!ministerioIds.includes(ministerioId)) {
        return NextResponse.redirect(new URL("/admin", req.url))
      }
      return NextResponse.next()
    }

    if (
      pathname === "/admin" ||
      pathname.startsWith("/admin/visitantes") ||
      pathname.startsWith("/admin/mensagens")
    ) {
      return NextResponse.next()
    }

    return NextResponse.redirect(new URL("/admin", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/admin/:path*", "/admin-v2/:path*", "/minha-area/:path*", "/minha-area-v2/:path*"],
}
