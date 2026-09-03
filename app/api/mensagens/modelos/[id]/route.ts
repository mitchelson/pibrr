import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  try {
    const { id } = await params
    const { titulo, corpo } = await request.json()

    const result = await sql`
      UPDATE mensagem_modelos
      SET titulo = COALESCE(${titulo ?? null}, titulo),
          corpo = COALESCE(${corpo ?? null}, corpo)
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Modelo nao encontrado" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Erro ao atualizar modelo:", error)
    return NextResponse.json({ error: "Erro ao atualizar modelo" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const __gestaoBff = await maybeProxyGestao(_request)
  if (__gestaoBff) return __gestaoBff

  try {
    const { id } = await params
    const result = await sql`DELETE FROM mensagem_modelos WHERE id = ${id} RETURNING id`
    if (result.length === 0) {
      return NextResponse.json({ error: "Modelo nao encontrado" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar modelo:", error)
    return NextResponse.json({ error: "Erro ao deletar modelo" }, { status: 500 })
  }
}
