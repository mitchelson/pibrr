import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/mobile-auth"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const __gestaoBff = await maybeProxyGestao(_req)
  if (__gestaoBff) return __gestaoBff

  const session = await getSession(_req)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { id } = await params
  await sql`
    INSERT INTO feed_likes (post_id, user_id) VALUES (${id}, ${session.userId})
    ON CONFLICT (post_id, user_id) DO NOTHING
  `
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const __gestaoBff = await maybeProxyGestao(_req)
  if (__gestaoBff) return __gestaoBff

  const session = await getSession(_req)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { id } = await params
  await sql`DELETE FROM feed_likes WHERE post_id = ${id} AND user_id = ${session.userId}`
  return NextResponse.json({ ok: true })
}
