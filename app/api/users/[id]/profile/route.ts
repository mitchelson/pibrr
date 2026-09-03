import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { fetchAccountRoles } from "@/lib/account-roles"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const __gestaoBff = await maybeProxyGestao(_req)
  if (__gestaoBff) return __gestaoBff

  const { id } = await params

  const user = await sql`
    SELECT id, nome, foto_url, bio, nascimento, data_batismo, criado_em, role
    FROM users WHERE id = ${id} AND ativo = true
  `
  if (user.length === 0) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  const ministerios = await sql`
    SELECT m.nome, m.icone, m.cor, mm.is_lider
    FROM ministerio_membros mm
    JOIN ministerios m ON m.id = mm.ministerio_id
    WHERE mm.user_id = ${id} AND m.ativo = true AND mm.pendente = false
    ORDER BY m.nome
  `

  const gifts = await sql`SELECT results FROM user_gift_results WHERE user_id = ${id}`

  const escalas = await sql`
    SELECT e.funcao, ev.titulo, ev.data, ev.horario, m.nome as ministerio, m.icone
    FROM escalas e
    JOIN eventos ev ON ev.id = e.evento_id
    JOIN ministerios m ON m.id = e.ministerio_id
    WHERE e.user_id = ${id} AND ev.data >= CURRENT_DATE
    ORDER BY ev.data ASC
    LIMIT 3
  `

  const roles = await fetchAccountRoles(id)

  return NextResponse.json({
    ...user[0],
    roles,
    ministerios,
    dons: gifts[0]?.results || null,
    proximas_escalas: escalas,
  })
}
