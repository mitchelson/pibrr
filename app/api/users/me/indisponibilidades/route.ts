import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/mobile-auth"

export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const rows = await sql`
    SELECT * FROM user_indisponibilidades
    WHERE user_id = ${session.userId} AND data_fim >= CURRENT_DATE
    ORDER BY data_inicio ASC
  `
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { data_inicio, data_fim, motivo } = await request.json()
  if (!data_inicio || !data_fim) return NextResponse.json({ error: "Datas obrigatórias" }, { status: 400 })

  const rows = await sql`
    INSERT INTO user_indisponibilidades (user_id, data_inicio, data_fim, motivo)
    VALUES (${session.userId}, ${data_inicio}, ${data_fim}, ${motivo || null})
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { id } = await request.json()
  await sql`DELETE FROM user_indisponibilidades WHERE id = ${id} AND user_id = ${session.userId}`
  return NextResponse.json({ ok: true })
}
