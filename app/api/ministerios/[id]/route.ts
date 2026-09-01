import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { requireMinisterioAccess, requireAdmin } from "@/lib/authorization"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await sql`
    SELECT m.*,
      COALESCE(json_agg(json_build_object('user_id', u.id, 'nome', u.nome, 'email', u.email, 'foto_url', u.foto_url, 'is_lider', mm.is_lider, 'role', u.role, 'pendente', mm.pendente))
        FILTER (WHERE u.id IS NOT NULL), '[]') as membros
    FROM ministerios m
    LEFT JOIN ministerio_membros mm ON mm.ministerio_id = m.id
    LEFT JOIN users u ON u.id = mm.user_id
    WHERE m.id = ${id}
    GROUP BY m.id
  `
  if (rows.length === 0) return NextResponse.json({ error: "não encontrado" }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const check = await requireMinisterioAccess(id, req)
  if (!check.authorized) return check.response

  const { nome, descricao, cor, icone, ativo, ordem, form_obrigatorio } = await req.json()

  await sql`ALTER TABLE ministerios ADD COLUMN IF NOT EXISTS form_obrigatorio BOOLEAN DEFAULT false`

  const rows = await sql`
    UPDATE ministerios SET
      nome = COALESCE(${nome ?? null}, nome),
      descricao = COALESCE(${descricao ?? null}, descricao),
      cor = COALESCE(${cor ?? null}, cor),
      icone = COALESCE(${icone ?? null}, icone),
      ativo = COALESCE(${ativo ?? null}, ativo),
      ordem = COALESCE(${ordem ?? null}, ordem),
      form_obrigatorio = COALESCE(${form_obrigatorio ?? null}, form_obrigatorio)
    WHERE id = ${id}
    RETURNING *
  `
  return NextResponse.json(rows[0])
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const check = await requireAdmin(req)
  if (!check.authorized) return check.response

  await sql`DELETE FROM ministerios WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
