import { NextRequest, NextResponse } from "next/server"
import { getSession, type MobileSession } from "@/lib/mobile-auth"
import { sql } from "@/lib/neon"

type AuthResult =
  | {
      authorized: true
      session: {
        user: { id: string; role: string }
        userId: string
        role: string
      }
    }
  | { authorized: false; response: NextResponse }

function toSession(session: MobileSession) {
  return {
    user: { id: session.userId, role: session.role },
    userId: session.userId,
    role: session.role,
  }
}

export function isStaffRole(role?: string | null): boolean {
  return role === "admin" || role === "lider" || role === "supervisor"
}

/** Admin, líder ou supervisor — web + mobile */
export async function requireStaff(request: NextRequest): Promise<AuthResult> {
  const session = await getSession(request)
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    }
  }
  if (!isStaffRole(session.role)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Sem permissão" }, { status: 403 }),
    }
  }
  return { authorized: true, session: toSession(session) }
}

/** Web (NextAuth cookie) + mobile (Bearer JWT) */
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const session = await getSession(request)
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    }
  }
  if (session.role !== "admin") {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Sem permissão" }, { status: 403 }),
    }
  }
  return { authorized: true, session: toSession(session) }
}

/** Admin ou líder/supervisor do ministério — web + mobile */
export async function requireMinisterioAccess(
  ministerioId: string,
  request: NextRequest
): Promise<AuthResult> {
  const session = await getSession(request)
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    }
  }
  if (session.role === "admin") {
    return { authorized: true, session: toSession(session) }
  }

  if (session.role === "lider" || session.role === "supervisor") {
    const rows = await sql`
      SELECT 1 FROM ministerio_membros
      WHERE user_id = ${session.userId} AND ministerio_id = ${ministerioId}
        AND (is_lider = true OR ${session.role} = 'supervisor')
    `
    if (rows.length > 0) {
      return { authorized: true, session: toSession(session) }
    }
  }

  return {
    authorized: false,
    response: NextResponse.json({ error: "Sem permissão" }, { status: 403 }),
  }
}
