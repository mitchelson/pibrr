import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession, type MobileSession } from "@/lib/mobile-auth"

async function canModify(session: MobileSession, postId: string) {
  if (session.role === "admin") return true
  const rows = await sql`SELECT autor_id FROM feed_posts WHERE id = ${postId}`
  return rows[0]?.autor_id === session.userId
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { id } = await params
  if (!(await canModify(session, id))) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  const { conteudo, imagem_url, fixado } = await req.json()
  const rows = await sql`
    UPDATE feed_posts SET
      conteudo = COALESCE(${conteudo ?? null}, conteudo),
      imagem_url = COALESCE(${imagem_url ?? null}, imagem_url),
      fixado = COALESCE(${fixado ?? null}, fixado),
      atualizado_em = now()
    WHERE id = ${id}
    RETURNING *
  `
  return NextResponse.json(rows[0])
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { id } = await params
  if (!(await canModify(session, id))) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  await sql`DELETE FROM feed_posts WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
