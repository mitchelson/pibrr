import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const rows = await sql`
      SELECT u.id, u.nome, u.foto_url
      FROM users u
      JOIN ministerio_membros mm ON mm.user_id = u.id
      JOIN ministerios m ON m.id = mm.ministerio_id
      WHERE m.nome ILIKE '%integra%' AND u.ativo = true
      ORDER BY u.nome ASC
    `
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Erro ao buscar responsáveis:", error)
    return NextResponse.json({ error: "Erro ao buscar responsáveis" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome } = body

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      )
    }

    const rows = await sql`
      INSERT INTO responsaveis (nome) VALUES (${nome})
      RETURNING *
    `

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao criar responsável:", error)
    return NextResponse.json(
      { error: "Erro ao criar responsável" },
      { status: 500 }
    )
  }
}
