import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { requireAdmin } from "@/lib/authorization"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin(req)
  if (!check.authorized) return check.response

  const { id } = await params
  const body = await req.json()
  // postgres.js rejeita `undefined` em parâmetros (UNDEFINED_VALUE) — coerção obrigatória
  const titulo = body.titulo ?? null
  const data = body.data ?? null
  const horario = body.horario ?? null
  const descricao = body.descricao ?? null
  const tipo = body.tipo ?? null
  const observacoes = body.observacoes ?? null
  const repertorio_ministerio_id = body.repertorio_ministerio_id || null
  const repertorio_funcao = body.repertorio_funcao || null

  try {
    const rows = await sql`
      UPDATE eventos SET
        titulo = COALESCE(${titulo}, titulo),
        data = COALESCE(${data}, data),
        horario = COALESCE(${horario}, horario),
        descricao = COALESCE(${descricao}, descricao),
        tipo = COALESCE(${tipo}, tipo),
        observacoes = COALESCE(${observacoes}, observacoes),
        repertorio_ministerio_id = ${repertorio_ministerio_id},
        repertorio_funcao = ${repertorio_funcao}
      WHERE id = ${id}
      RETURNING *
    `
    return NextResponse.json(rows[0])
  } catch (error: any) {
    console.error("Erro ao atualizar evento:", error)
    return NextResponse.json({ error: error.message || "Erro ao atualizar evento" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin(req)
  if (!check.authorized) return check.response

  const { id } = await params
  await sql`DELETE FROM eventos WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
