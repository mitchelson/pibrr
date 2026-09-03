import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getSession, requireAdminUniversal } from "@/lib/mobile-auth"
import {
  assignAccountRole,
  ensureAccountExists,
  fetchAccountRolesBatch,
  fromLegacyRole,
  syncLegacyPrimaryRole,
} from "@/lib/account-roles"
import { isStaffRole } from "@/lib/authorization"

export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  if (!isStaffRole(session.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  if (session.role !== "admin") {
    const lite = await sql`
      SELECT id, nome, foto_url FROM users
      WHERE coalesce(ativo, true) = true
      ORDER BY nome ASC
    `
    return NextResponse.json(lite)
  }

  const rows = await sql`
    SELECT u.*, 
      COALESCE(json_agg(json_build_object('ministerio_id', mm.ministerio_id, 'nome', m.nome, 'is_lider', mm.is_lider)) 
        FILTER (WHERE mm.id IS NOT NULL), '[]') as ministerios
    FROM users u
    LEFT JOIN ministerio_membros mm ON mm.user_id = u.id
    LEFT JOIN ministerios m ON m.id = mm.ministerio_id
    GROUP BY u.id
    ORDER BY u.nome ASC
  `

  const ids = rows.map((u: any) => u.id as string)
  const rolesMap = await fetchAccountRolesBatch(ids)

  const enriched = rows.map((u: any) => ({
    ...u,
    roles: rolesMap[u.id] || [],
  }))

  return NextResponse.json(enriched)
}

export async function PUT(request: NextRequest) {
  const check = await requireAdminUniversal(request)
  if (!check.authorized) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const body = await request.json()
  const { id, role, ativo, permite_escala_multipla, telefone, nome } = body
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  const rows = await sql`
    UPDATE users SET
      nome = COALESCE(${nome ?? null}, nome),
      role = COALESCE(${role ?? null}, role),
      ativo = COALESCE(${ativo ?? null}, ativo),
      permite_escala_multipla = COALESCE(${permite_escala_multipla ?? null}, permite_escala_multipla),
      telefone = COALESCE(${telefone ?? null}, telefone)
    WHERE id = ${id}
    RETURNING *
  `

  // Dual-write global role into account_roles when role changes
  if (role) {
    try {
      await ensureAccountExists(id)
      await assignAccountRole(id, fromLegacyRole(role), null, check.session.userId)
      await syncLegacyPrimaryRole(id)
    } catch (e) {
      console.error("dual-write role failed:", e)
    }
  }

  return NextResponse.json(rows[0])
}

export async function DELETE(request: NextRequest) {
  const check = await requireAdminUniversal(request)
  if (!check.authorized) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  if (id === check.session.userId) {
    return NextResponse.json({ error: "Você não pode deletar a si mesmo" }, { status: 400 })
  }

  await sql`DELETE FROM users WHERE id = ${id}`
  await sql`DELETE FROM accounts WHERE id = ${id}::uuid`.catch(() => {})
  return NextResponse.json({ ok: true })
}
