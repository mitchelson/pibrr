import { NextRequest, NextResponse } from "next/server"
import { getSession, requireAdminUniversal } from "@/lib/mobile-auth"
import {
  assignAccountRole,
  ensureAccountExists,
  fetchAccountRoles,
  removeAccountRole,
  syncLegacyPrimaryRole,
  getOrCreateMinistryContext,
} from "@/lib/account-roles"
import { sql } from "@/lib/db"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  const { id } = await params
  const session = await getSession(request)
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }
  if (session.userId !== id && session.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  const roles = await fetchAccountRoles(id)
  return NextResponse.json({ roles })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  const check = await requireAdminUniversal(request)
  if (!check.authorized) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const { id } = await params
  const body = await request.json()
  const { role_name, context_id, ministerio_id } = body as {
    role_name?: string
    context_id?: string | null
    ministerio_id?: string | null
  }

  if (!role_name) {
    return NextResponse.json({ error: "role_name obrigatório" }, { status: 400 })
  }

  await ensureAccountExists(id)

  let contextId: string | null = context_id ?? null
  if (!contextId && ministerio_id) {
    contextId = await getOrCreateMinistryContext(ministerio_id)
  }

  const globalOnly = ["admin", "supervisor", "membro", "congregado", "visitante", "visitor"]
  if (globalOnly.includes(role_name) && !ministerio_id) {
    contextId = null
  }

  await assignAccountRole(id, role_name, contextId, check.session.userId)

  if (!contextId) {
    await syncLegacyPrimaryRole(id)
  } else if (role_name === "lider" && ministerio_id) {
    await sql`
      INSERT INTO ministerio_membros (user_id, ministerio_id, is_lider, pendente)
      VALUES (${id}::uuid, ${ministerio_id}::uuid, true, false)
      ON CONFLICT (ministerio_id, user_id)
      DO UPDATE SET is_lider = true, pendente = false
    `
  }

  const roles = await fetchAccountRoles(id)
  const user = await sql`SELECT role FROM users WHERE id = ${id}::uuid`
  return NextResponse.json({ roles, role: user[0]?.role })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  const check = await requireAdminUniversal(request)
  if (!check.authorized) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const { id } = await params
  const body = await request.json()
  const { role_name, context_id, ministerio_id } = body as {
    role_name?: string
    context_id?: string | null
    ministerio_id?: string | null
  }

  if (!role_name) {
    return NextResponse.json({ error: "role_name obrigatório" }, { status: 400 })
  }

  let contextId: string | null = context_id ?? null
  let ministryId: string | null = ministerio_id ?? null
  if (!contextId && ministryId) {
    contextId = await getOrCreateMinistryContext(ministryId)
  }
  if (!ministryId && contextId) {
    const ctx = await sql`
      SELECT context_id::text as ministerio_id FROM contexts
      WHERE id = ${contextId}::uuid AND context_type = 'ministry'
    `
    ministryId = ctx[0]?.ministerio_id || null
  }

  await removeAccountRole(id, role_name, contextId)

  if (role_name === "lider" && ministryId) {
    await sql`
      UPDATE ministerio_membros SET is_lider = false
      WHERE user_id = ${id}::uuid AND ministerio_id = ${ministryId}::uuid
    `
  }

  const legacy = await syncLegacyPrimaryRole(id)
  const roles = await fetchAccountRoles(id)
  return NextResponse.json({ roles, role: legacy })
}
