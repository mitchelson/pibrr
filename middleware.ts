import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"
import { APP_PATHS } from "@/lib/app-ui"

const ministerioDetailRegex = /^\/admin\/ministerios\/([0-9a-f-]{36})$/

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  const role = session.user?.role
  const ministerioIds: string[] = (session.user as { ministerioIds?: string[] }).ministerioIds || []

  if (role !== "admin" && role !== "supervisor" && role !== "lider") {
    return NextResponse.redirect(new URL(APP_PATHS.v2.escalas, req.url))
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
})

export const config = {
  matcher: ["/admin", "/admin/:path*", "/minha-area", "/minha-area/:path*"],
}
