import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getSession } from "@/lib/mobile-auth"

export const dynamic = "force-dynamic"

/** Paridade com gestao-api GET /v1/admin/dashboard — usado pelo pib-app painel. */
export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  try {
    const rows = await sql`
      SELECT count(*)::int AS total
      FROM users
      WHERE coalesce(ativo, true) = true
    `
    return NextResponse.json({ totalMembros: rows[0]?.total ?? 0 })
  } catch (error) {
    console.error("Erro ao buscar dashboard admin:", error)
    return NextResponse.json({ error: "Erro ao buscar dashboard" }, { status: 500 })
  }
}
