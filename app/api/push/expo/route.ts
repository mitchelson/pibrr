import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/mobile-auth"
import { sql } from "@/lib/db"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export async function POST(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { token } = await request.json()
  if (!token || !token.startsWith("ExponentPushToken[")) {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 })
  }

  await sql`
    INSERT INTO expo_push_tokens (user_id, token, criado_em)
    VALUES (${session.userId}, ${token}, now())
    ON CONFLICT (user_id, token) DO UPDATE SET criado_em = now()
  `

  return NextResponse.json({ ok: true })
}
