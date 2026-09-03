import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/mobile-auth"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export async function GET(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  // Suporte a ?count=true para o badge do app mobile
  const countOnly = request.nextUrl.searchParams.get("count") === "true"
  if (countOnly) {
    const unread = await sql`
      SELECT count(*)::int as total FROM notifications
      WHERE user_id = ${session.userId} AND lida = false
    `
    return NextResponse.json({ count: unread[0].total })
  }

  const rows = await sql`
    SELECT * FROM notifications
    WHERE user_id = ${session.userId}
    ORDER BY criado_em DESC
    LIMIT 50
  `
  const unread = await sql`
    SELECT count(*)::int as total FROM notifications
    WHERE user_id = ${session.userId} AND lida = false
  `
  return NextResponse.json({ notifications: rows, unread: unread[0].total })
}

export async function PUT(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const body = await request.json()
  const { id, all } = body

  if (all) {
    await sql`UPDATE notifications SET lida = true WHERE user_id = ${session.userId} AND lida = false`
  } else if (id) {
    await sql`UPDATE notifications SET lida = true WHERE id = ${id} AND user_id = ${session.userId}`
  }

  return NextResponse.json({ ok: true })
}
