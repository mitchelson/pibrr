import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireMinisterioAccess } from "@/lib/authorization"
import { removeAccountRole, syncMinistryLeaderRole, getOrCreateMinistryContext } from "@/lib/account-roles"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { user_id, ministerio_id } = body

  const check = await requireMinisterioAccess(ministerio_id, request)
  if (!check.authorized) return check.response

  const hasLider = "is_lider" in body
  const hasPendente = "pendente" in body

  const rows = hasLider
    ? await sql`
        INSERT INTO ministerio_membros (user_id, ministerio_id, is_lider)
        VALUES (${user_id}, ${ministerio_id}, ${body.is_lider})
        ON CONFLICT (ministerio_id, user_id) DO UPDATE SET is_lider = ${body.is_lider}
        RETURNING *
      `
    : hasPendente
    ? await sql`
        UPDATE ministerio_membros SET pendente = ${body.pendente}
        WHERE user_id = ${user_id} AND ministerio_id = ${ministerio_id}
        RETURNING *
      `
    : await sql`
        INSERT INTO ministerio_membros (user_id, ministerio_id)
        VALUES (${user_id}, ${ministerio_id})
        ON CONFLICT (ministerio_id, user_id) DO NOTHING
        RETURNING *
      `

  // Sync contextual lider role
  if (hasLider) {
    try {
      await syncMinistryLeaderRole(user_id, ministerio_id, !!body.is_lider, check.session?.userId)
    } catch (e) {
      console.error("syncMinistryLeaderRole:", e)
    }
  }

  // Notifica quando aceito no ministério
  if (hasPendente && body.pendente === false) {
    const min = await sql`SELECT nome FROM ministerios WHERE id = ${ministerio_id}`
    await sql`
      INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
      VALUES (${user_id}, 'ministerio', 'Solicitação aceita!', ${`Você foi aceito no ministério ${min[0]?.nome}`}, '/minha-area/perfil')
    `
  }

  return NextResponse.json(rows[0] ?? { user_id, ministerio_id }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const { user_id, ministerio_id } = await request.json()

  const check = await requireMinisterioAccess(ministerio_id, request)
  if (!check.authorized) return check.response

  try {
    const contextId = await getOrCreateMinistryContext(ministerio_id)
    if (contextId) {
      await removeAccountRole(user_id, "lider", contextId)
      await removeAccountRole(user_id, "membro", contextId)
    }
  } catch (e) {
    console.error("remove contextual roles:", e)
  }

  await sql`DELETE FROM ministerio_membros WHERE user_id = ${user_id} AND ministerio_id = ${ministerio_id}`
  return NextResponse.json({ ok: true })
}
