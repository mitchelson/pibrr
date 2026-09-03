import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/mobile-auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const rows = await sql`
    SELECT id, nome, email, foto_url, bio, nascimento, data_batismo, telefone, permite_escala_multipla
    FROM users WHERE id = ${session.userId}
  `
  return NextResponse.json(rows[0])
}

export async function PUT(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { nome, bio, nascimento, data_batismo, foto_url, permite_escala_multipla } = await request.json()

  const rows = await sql`
    UPDATE users SET
      nome = COALESCE(${nome?.trim() || null}, nome),
      bio = COALESCE(${bio ?? null}, bio),
      nascimento = COALESCE(${nascimento || null}, nascimento),
      data_batismo = COALESCE(${data_batismo || null}, data_batismo),
      foto_url = COALESCE(${foto_url || null}, foto_url),
      permite_escala_multipla = COALESCE(${permite_escala_multipla ?? null}, permite_escala_multipla)
    WHERE id = ${session.userId}
    RETURNING id, nome, email, foto_url, bio, nascimento, data_batismo, permite_escala_multipla
  `
  return NextResponse.json(rows[0])
}

/** Self-service account deletion (mobile + web). */
export async function DELETE(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const id = session.userId
  await sql`DELETE FROM users WHERE id = ${id}`
  await sql`DELETE FROM accounts WHERE id = ${id}::uuid`.catch(() => {})
  return NextResponse.json({ ok: true })
}
