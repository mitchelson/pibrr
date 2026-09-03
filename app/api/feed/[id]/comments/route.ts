import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/mobile-auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await sql`
    SELECT c.*, u.nome as user_nome, u.foto_url as user_foto
    FROM feed_comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ${id}
    ORDER BY c.criado_em ASC
  `
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { id } = await params
  const { conteudo } = await req.json()
  if (!conteudo?.trim()) return NextResponse.json({ error: "Conteúdo obrigatório" }, { status: 400 })

  const rows = await sql`
    INSERT INTO feed_comments (post_id, user_id, conteudo)
    VALUES (${id}, ${session.userId}, ${conteudo.trim()})
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { comment_id } = await req.json()
  if (!comment_id) return NextResponse.json({ error: "comment_id obrigatório" }, { status: 400 })

  if (session.role !== "admin") {
    const comment = await sql`SELECT user_id FROM feed_comments WHERE id = ${comment_id}`
    if (comment[0]?.user_id !== session.userId) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }
  }

  await sql`DELETE FROM feed_comments WHERE id = ${comment_id}`
  return NextResponse.json({ ok: true })
}
