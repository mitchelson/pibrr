import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const __gestaoBff = await maybeProxyGestao(req)
  if (__gestaoBff) return __gestaoBff

  const { id } = await params
  const { nome, tipo, horario, descricao, posicoes } = await req.json()
  const rows = await sql`
    UPDATE evento_modelos SET
      nome = COALESCE(${nome}, nome), tipo = COALESCE(${tipo}, tipo),
      horario = COALESCE(${horario}, horario), descricao = COALESCE(${descricao}, descricao)
    WHERE id = ${id} RETURNING *
  `
  if (posicoes !== undefined) {
    await sql`DELETE FROM evento_posicoes WHERE modelo_id = ${id}`
    for (const p of posicoes) {
      await sql`INSERT INTO evento_posicoes (modelo_id, ministerio_id, funcao, quantidade)
        VALUES (${id}, ${p.ministerio_id}, ${p.funcao}, ${p.quantidade ?? 1})`
    }
  }
  return NextResponse.json(rows[0])
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const __gestaoBff = await maybeProxyGestao(_req)
  if (__gestaoBff) return __gestaoBff

  const { id } = await params
  await sql`DELETE FROM evento_modelos WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
