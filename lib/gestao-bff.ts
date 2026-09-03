import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getSession } from "@/lib/mobile-auth"
import {
  isGestaoBffEnabled,
  proxyRequestToGestao,
  type GestaoSession,
} from "@/lib/gestao-api"

export { isGestaoBffEnabled }

function sessionFromAuth(user: {
  id?: string
  role?: string
  ministerioIds?: string[]
} | null | undefined): GestaoSession | null {
  if (!user?.id) return null
  return {
    userId: user.id,
    role: user.role || "membro",
    ministerioIds: user.ministerioIds || [],
  }
}

/** Resolve web cookie or mobile Bearer into gestao JWT claims. */
export async function resolveGestaoSession(
  request?: NextRequest
): Promise<GestaoSession | null> {
  if (request) {
    const mobile = await getSession(request)
    if (mobile?.userId) {
      return {
        userId: mobile.userId,
        role: mobile.role || "membro",
        ministerioIds: mobile.ministerioIds || [],
      }
    }
  }
  const session = await auth()
  return sessionFromAuth(session?.user)
}

/**
 * If FEATURE_FLAG_GESTAO_BFF is on, proxy this request to gestao-api `/v1/...`.
 * Returns null when the flag is off (caller runs legacy SQL).
 */
export async function maybeProxyGestao(
  request: NextRequest,
  opts?: { public?: boolean; requireSession?: boolean }
): Promise<NextResponse | null> {
  if (!isGestaoBffEnabled()) return null

  const session = await resolveGestaoSession(request)
  if (opts?.requireSession && !session?.userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  return proxyRequestToGestao(request, session, {
    public: opts?.public && !session?.userId,
  })
}
