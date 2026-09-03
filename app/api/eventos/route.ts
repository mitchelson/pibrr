import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAdmin } from "@/lib/authorization"

export async function GET() {
  const rows = await sql`SELECT * FROM eventos ORDER BY data DESC`
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin(request)
  if (!check.authorized) return check.response

  try {
    const { titulo, data, horario, descricao, tipo, modelo_id, observacoes, repertorio_ministerio_id, repertorio_funcao } = await request.json()
    if (!titulo || !data) return NextResponse.json({ error: "titulo e data obrigatórios" }, { status: 400 })

    const safeModeloId = modelo_id || null

    const rows = await sql`
      INSERT INTO eventos (titulo, data, horario, descricao, tipo, modelo_id, observacoes, repertorio_ministerio_id, repertorio_funcao)
      VALUES (${titulo}, ${data}, ${horario ?? null}, ${descricao ?? null}, ${tipo ?? "Culto"}, ${safeModeloId}, ${observacoes ?? null}, ${repertorio_ministerio_id ?? null}, ${repertorio_funcao ?? null})
      RETURNING *
    `
    const evento = rows[0]

    // Copiar posições do modelo para o evento
    if (safeModeloId) {
      await sql`
        INSERT INTO evento_posicoes (evento_id, ministerio_id, funcao, quantidade)
        SELECT ${evento.id}, ministerio_id, funcao, quantidade
        FROM evento_posicoes WHERE modelo_id = ${safeModeloId}
      `
    }

    return NextResponse.json(evento, { status: 201 })
  } catch (error: any) {
    console.error("Erro ao criar evento:", error)

    // Se a coluna modelo_id não existe, tentar inserir sem ela
    if (error.message?.includes("modelo_id")) {
      try {
        const { titulo, data, horario, descricao, tipo } = await request.clone().json()
        const rows = await sql`
          INSERT INTO eventos (titulo, data, horario, descricao, tipo)
          VALUES (${titulo}, ${data}, ${horario ?? null}, ${descricao ?? null}, ${tipo ?? "Culto"})
          RETURNING *
        `
        return NextResponse.json(rows[0], { status: 201 })
      } catch (fallbackError: any) {
        console.error("Erro no fallback:", fallbackError)
        return NextResponse.json({ error: fallbackError.message || "Erro ao criar evento" }, { status: 500 })
      }
    }

    return NextResponse.json({ error: error.message || "Erro ao criar evento" }, { status: 500 })
  }
}
