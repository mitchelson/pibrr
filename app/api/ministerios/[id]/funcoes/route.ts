import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireMinisterioAccess } from "@/lib/authorization"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await sql`SELECT * FROM ministerio_funcoes WHERE ministerio_id = ${id} ORDER BY nome ASC`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const check = await requireMinisterioAccess(id, req)
  if (!check.authorized) return check.response

  const { nome } = await req.json()
  if (!nome) return NextResponse.json({ error: "nome obrigatório" }, { status: 400 })

  const rows = await sql`
    INSERT INTO ministerio_funcoes (ministerio_id, nome)
    VALUES (${id}, ${nome})
    ON CONFLICT (ministerio_id, nome) DO NOTHING
    RETURNING *
  `
  if (rows.length === 0) return NextResponse.json({ error: "função já existe" }, { status: 409 })
  return NextResponse.json(rows[0], { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const check = await requireMinisterioAccess(id, req)
  if (!check.authorized) return check.response

  const { funcao_id } = await req.json()
  if (!funcao_id) return NextResponse.json({ error: "funcao_id obrigatório" }, { status: 400 })

  await sql`DELETE FROM ministerio_funcoes WHERE id = ${funcao_id} AND ministerio_id = ${id}`
  return NextResponse.json({ ok: true })
}
