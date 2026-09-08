import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/mobile-auth"
import { canEditRepertorio } from "@/lib/repertorio-auth"

/**
 * Repertório fica no SQL local (mesmo Postgres da gestao-api).
 * A authz do ministrante precisa bater com a escala do evento; proxy BFF
 * com canEdit desatualizado escondia o botão e bloqueava o POST.
 */

export async function GET(request: NextRequest) {
  const eventoId = request.nextUrl.searchParams.get("evento_id")
  if (!eventoId) return NextResponse.json({ error: "evento_id required" }, { status: 400 })

  const items = await sql`
    SELECT * FROM repertorio_items WHERE evento_id = ${eventoId} ORDER BY ordem, criado_em
  `

  const session = await getSession(request)
  let canEditRepertoire = false
  if (session?.userId) {
    canEditRepertoire = await canEditRepertorio(session.userId, eventoId, session.role)
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

  if (!(await canEditRepertorio(session.userId, evento_id, session.role))) {
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

  if (!(await canEditRepertorio(session.userId, evento_id, session.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await sql`DELETE FROM repertorio_items WHERE evento_id = ${evento_id}`
  return NextResponse.json({ ok: true })
}
