import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

// GET /api/mensagens/enviadas?visitante_id=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const visitanteId = searchParams.get("visitante_id")

    if (!visitanteId) {
      return NextResponse.json(
        { error: "visitante_id obrigatorio" },
        { status: 400 },
      )
    }

    const enviadas = await sql`
      SELECT * FROM visitante_mensagens_enviadas
      WHERE visitante_id = ${visitanteId}
      ORDER BY enviado_em DESC
    `
    return NextResponse.json(enviadas)
  } catch (error) {
    console.error("Erro ao buscar mensagens enviadas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar mensagens enviadas" },
      { status: 500 },
    )
  }
}

// POST /api/mensagens/enviadas  { visitante_id, categoria_id }
export async function POST(request: Request) {
  try {
    const { visitante_id, categoria_id } = await request.json()
    if (!visitante_id || !categoria_id) {
      return NextResponse.json(
        { error: "visitante_id e categoria_id obrigatorios" },
        { status: 400 },
      )
    }

    // Upsert - if already exists, update the timestamp
    const result = await sql`
      INSERT INTO visitante_mensagens_enviadas (visitante_id, categoria_id, enviado_em)
      VALUES (${visitante_id}, ${categoria_id}, NOW())
      ON CONFLICT (visitante_id, categoria_id)
      DO UPDATE SET enviado_em = NOW()
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao registrar mensagem enviada:", error)
    return NextResponse.json(
      { error: "Erro ao registrar mensagem enviada", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

// DELETE /api/mensagens/enviadas?visitante_id=xxx&categoria_id=yyy
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const visitanteId = searchParams.get("visitante_id")
    const categoriaId = searchParams.get("categoria_id")

    if (!visitanteId || !categoriaId) {
      return NextResponse.json(
        { error: "visitante_id e categoria_id obrigatorios" },
        { status: 400 },
      )
    }

    await sql`
      DELETE FROM visitante_mensagens_enviadas
      WHERE visitante_id = ${visitanteId}
      AND categoria_id = ${categoriaId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao remover mensagem enviada:", error)
    return NextResponse.json(
      { error: "Erro ao remover mensagem enviada", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
