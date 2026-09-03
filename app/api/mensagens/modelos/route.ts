import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { categoria_id, titulo, corpo } = await request.json()
    if (!categoria_id || !titulo || !corpo) {
      return NextResponse.json(
        { error: "categoria_id, titulo e corpo sao obrigatorios" },
        { status: 400 },
      )
    }

    const maxOrdem = (
      await sql`SELECT COALESCE(MAX(ordem), 0) + 1 as next FROM mensagem_modelos WHERE categoria_id = ${categoria_id}`
    )[0].next

    const result = await sql`
      INSERT INTO mensagem_modelos (categoria_id, titulo, corpo, ordem)
      VALUES (${categoria_id}, ${titulo}, ${corpo}, ${maxOrdem})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao criar modelo:", error)
    return NextResponse.json(
      { error: "Erro ao criar modelo" },
      { status: 500 },
    )
  }
}
