import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const __gestaoBff = await maybeProxyGestao(_req)
  if (__gestaoBff) return __gestaoBff

  const { id } = await params
  const rows = await sql`
    SELECT ep.*, m.nome as ministerio_nome, m.icone as ministerio_icone
    FROM evento_posicoes ep
    JOIN ministerios m ON m.id = ep.ministerio_id
    WHERE ep.evento_id = ${id}
    ORDER BY m.nome, ep.funcao
  `
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const __gestaoBff = await maybeProxyGestao(req)
  if (__gestaoBff) return __gestaoBff

  const { id } = await params
  const { ministerio_id, funcao, quantidade } = await req.json()
  if (!ministerio_id || !funcao) return NextResponse.json({ error: "ministerio_id e funcao obrigatórios" }, { status: 400 })
  const rows = await sql`
    INSERT INTO evento_posicoes (evento_id, ministerio_id, funcao, quantidade)
    VALUES (${id}, ${ministerio_id}, ${funcao}, ${quantidade ?? 1})
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const __gestaoBff = await maybeProxyGestao(req)
  if (__gestaoBff) return __gestaoBff

  const { id } = await params
  const { posicao_id } = await req.json()
  if (posicao_id) {
    await sql`DELETE FROM evento_posicoes WHERE id = ${posicao_id} AND evento_id = ${id}`
  }
  return NextResponse.json({ ok: true })
}
