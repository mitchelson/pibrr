import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/mobile-auth"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export async function PUT(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  await sql`UPDATE notifications SET lida = true WHERE user_id = ${session.userId} AND lida = false`
  return NextResponse.json({ ok: true })
}
