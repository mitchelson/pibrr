import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/mobile-auth"

async function canEdit(userId: string, eventoId: string): Promise<boolean> {
  const user = await sql`SELECT role FROM users WHERE id = ${userId}`
  if (user[0]?.role === "admin") return true

  try {
    const adminRole = await sql`
      SELECT 1
      FROM account_roles ar
      JOIN roles r ON r.id = ar.role_id
      WHERE ar.account_id = ${userId}
        AND r.name = 'admin'
        AND (ar.is_active IS NULL OR ar.is_active = true)
      LIMIT 1
    `
    if (adminRole.length > 0) return true
  } catch {
    // ignore if permissions tables unavailable
  }

  const evento = await sql`SELECT repertorio_ministerio_id, repertorio_funcao FROM eventos WHERE id = ${eventoId}`
  const { repertorio_ministerio_id, repertorio_funcao } = evento[0] || {}
  if (!repertorio_ministerio_id) return false

  const membership = await sql`
    SELECT 1 FROM ministerio_membros WHERE user_id = ${userId} AND ministerio_id = ${repertorio_ministerio_id}
  `
  if (membership.length === 0) return false

  if (repertorio_funcao) {
    const escala = await sql`
      SELECT 1 FROM escalas WHERE user_id = ${userId} AND evento_id = ${eventoId} AND funcao = ${repertorio_funcao}
    `
    if (escala.length === 0) return false
  }

  return true
}

export async function GET(request: NextRequest) {
  const eventoId = request.nextUrl.searchParams.get("evento_id")
  if (!eventoId) return NextResponse.json({ error: "evento_id required" }, { status: 400 })

  const items = await sql`
    SELECT * FROM repertorio_items WHERE evento_id = ${eventoId} ORDER BY ordem, criado_em
  `

  const session = await getSession(request)
  let canEditRepertoire = false
  if (session?.userId) {
    canEditRepertoire = await canEdit(session.userId, eventoId)
  }

  return NextResponse.json({ items, canEdit: canEditRepertoire })
}

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { evento_id, items } = await request.json()
  if (!evento_id || !Array.isArray(items)) {
    return NextResponse.json({ error: "evento_id and items required" }, { status: 400 })
  }

  if (!(await canEdit(session.userId, evento_id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await sql`DELETE FROM repertorio_items WHERE evento_id = ${evento_id}`
  for (let i = 0; i < items.length; i++) {
    const { nome, tonalidade, link, observacoes } = items[i]
    if (!nome?.trim()) continue
    await sql`
      INSERT INTO repertorio_items (evento_id, nome, tonalidade, link, observacoes, ordem)
      VALUES (${evento_id}, ${nome.trim()}, ${tonalidade || null}, ${link || null}, ${observacoes || null}, ${i})
    `
  }

  const result = await sql`SELECT * FROM repertorio_items WHERE evento_id = ${evento_id} ORDER BY ordem`
  return NextResponse.json(result, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const session = await getSession(request)
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { evento_id } = await request.json()
  if (!evento_id) return NextResponse.json({ error: "evento_id required" }, { status: 400 })

  if (!(await canEdit(session.userId, evento_id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await sql`DELETE FROM repertorio_items WHERE evento_id = ${evento_id}`
  return NextResponse.json({ ok: true })
}
