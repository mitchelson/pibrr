import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { requireStaff } from "@/lib/authorization"

export async function GET(request: NextRequest) {
  const check = await requireStaff(request)
  if (!check.authorized) return check.response

  try {
    const result = await sql`
      SELECT visitante_id, array_agg(DISTINCT categoria_id) as categoria_ids
      FROM visitante_mensagens_enviadas
      GROUP BY visitante_id
    `

    const mapa: Record<string, string[]> = {}
    for (const row of result as { visitante_id: string; categoria_ids: string[] }[]) {
      mapa[row.visitante_id] = row.categoria_ids || []
    }

    return NextResponse.json(mapa)
  } catch (error) {
    console.error("Erro ao buscar status de mensagens:", error)
    return NextResponse.json(
      {
        error: "Erro ao buscar status de mensagens",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
