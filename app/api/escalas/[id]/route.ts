import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/mobile-auth"
import { requireMinisterioAccess } from "@/lib/authorization"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const escala = await sql`SELECT ministerio_id, user_id FROM escalas WHERE id = ${id}`
  if (escala.length === 0) return NextResponse.json({ error: "não encontrado" }, { status: 404 })

  // Próprio usuário pode atualizar status da sua escala
  const isOwner = escala[0].user_id === session.userId
  if (!isOwner) {
    const check = await requireMinisterioAccess(escala[0].ministerio_id, req)
    if (!check.authorized) return check.response
  }

  const { status, funcao } = await req.json()

  // Membro comum só pode alterar status (não funcao)
  if (isOwner && session.role === "membro") {
    if (status == null) {
      return NextResponse.json({ error: "status obrigatório" }, { status: 400 })
    }
    const rows = await sql`UPDATE escalas SET status = ${status} WHERE id = ${id} RETURNING *`
    return NextResponse.json(rows[0])
  }

  // Neon rejeita `undefined` em parâmetros — usar null para campos omitidos
  const rows = await sql`
    UPDATE escalas SET
      status = COALESCE(${status ?? null}, status),
      funcao = COALESCE(${funcao ?? null}, funcao)
    WHERE id = ${id}
    RETURNING *
  `
  return NextResponse.json(rows[0])
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const escala = await sql`SELECT ministerio_id FROM escalas WHERE id = ${id}`
  if (escala.length === 0) return NextResponse.json({ error: "não encontrado" }, { status: 404 })

  const check = await requireMinisterioAccess(escala[0].ministerio_id, req)
  if (!check.authorized) return check.response

  await sql`DELETE FROM escalas WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
