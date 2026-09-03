import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/mobile-auth"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export async function GET(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  if (session.role !== "admin" && session.role !== "supervisor") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  const rows = await sql`
    SELECT ugr.user_id, ugr.results, ugr.created_at, u.nome, u.foto_url
    FROM user_gift_results ugr
    JOIN users u ON u.id = ugr.user_id
    ORDER BY ugr.created_at DESC
  `

  return NextResponse.json(rows)
}
