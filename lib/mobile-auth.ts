import { jwtVerify } from "jose"
import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { getMobileJwtSecret } from "@/lib/jwt-secret"

const secret = getMobileJwtSecret()

export interface MobileSession {
  userId: string
  role: string
  ministerioIds: string[]
}

/**
 * Extrai sessão tanto de NextAuth (cookie) quanto de Bearer JWT (mobile)
 */
export async function getSession(request: NextRequest): Promise<MobileSession | null> {
  // 1. Tenta Bearer token (app mobile)
  const authHeader = request.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim()
    if (!token) return null

    let payload: { userId?: string; role?: string; ministerioIds?: string[]; sub?: string }
    try {
      const verified = await jwtVerify(token, secret)
      payload = verified.payload as typeof payload
    } catch {
      return null
    }

    const userId = String(payload.userId ?? payload.sub ?? "")
    const role = String(payload.role ?? "membro")
    const ministerioIds = Array.isArray(payload.ministerioIds)
      ? payload.ministerioIds.map(String)
      : []

    if (!userId) return null

    return { userId, role, ministerioIds }
  }

  // 2. Fallback: sessão NextAuth (web)
  const session = await auth()
  if (!session?.user?.id) return null

  return {
    userId: session.user.id,
    role: session.user.role,
    ministerioIds: (session.user as any).ministerioIds ?? [],
  }
}

/** Verifica se é admin via Bearer ou NextAuth */
export async function requireAdminUniversal(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return { authorized: false as const, error: "Não autenticado", status: 401 }
  if (session.role !== "admin") return { authorized: false as const, error: "Sem permissão", status: 403 }
  return { authorized: true as const, session }
}

/** Verifica acesso ao ministério via Bearer ou NextAuth */
export async function requireMinisterioAccessUniversal(ministerioId: string, request: NextRequest) {
  const session = await getSession(request)
  if (!session) return { authorized: false as const, error: "Não autenticado", status: 401 }
  if (session.role === "admin") return { authorized: true as const, session }

  if (session.role === "lider" || session.role === "supervisor") {
    const rows = await sql`
      SELECT 1 FROM ministerio_membros
      WHERE user_id = ${session.userId} AND ministerio_id = ${ministerioId}
        AND (is_lider = true OR ${session.role} = 'supervisor')
    `
    if (rows.length > 0) return { authorized: true as const, session }
  }

  return { authorized: false as const, error: "Sem permissão", status: 403 }
}
