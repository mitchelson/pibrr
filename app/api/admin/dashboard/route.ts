import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/mobile-auth"
import { canAccessAcolhimento } from "@/lib/acolhimento"
import { getAcolhimentoMinisterioId } from "@/lib/acolhimento-server"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export const dynamic = "force-dynamic"

/** Paridade com gestao-api GET /v1/admin/dashboard — usado pelo pib-app painel. */
export async function GET(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  const session = await getSession(request)
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  try {
    const rows = await sql`
      SELECT count(*)::int AS total
      FROM users
      WHERE coalesce(ativo, true) = true
    `

    const escalasPendentes = await sql`
      SELECT count(*)::int as total FROM escalas es
      INNER JOIN eventos e ON e.id = es.evento_id
      WHERE es.status = 'pendente' AND e.data >= CURRENT_DATE
    `

    const escalasSemana = await sql`
      SELECT count(*)::int as total FROM escalas es
      INNER JOIN eventos e ON e.id = es.evento_id
      WHERE e.data >= CURRENT_DATE AND e.data < CURRENT_DATE + interval '7 days'
    `

    let pedidosMinisterio = 0
    try {
      const ped = await sql`
        SELECT count(*)::int as total FROM ministerio_membros
        WHERE pendente = true
      `
      pedidosMinisterio = ped[0]?.total ?? 0
    } catch {
      pedidosMinisterio = 0
    }

    const acolhimentoId = await getAcolhimentoMinisterioId()
    const showWhatsapp = canAccessAcolhimento(session.role, session.ministerioIds, acolhimentoId)

    let whatsappPendentes = 0
    if (showWhatsapp) {
      try {
        const pend = await sql`
          SELECT count(*)::int as total FROM visitantes v
          WHERE v.sem_whatsapp IS NOT TRUE
            AND EXISTS (
              SELECT 1 FROM mensagem_categorias c WHERE c.ativa = true
              AND NOT EXISTS (
                SELECT 1 FROM visitante_mensagens_enviadas me
                WHERE me.visitante_id = v.id AND me.categoria_id = c.id
              )
            )
        `
        whatsappPendentes = pend[0]?.total ?? 0
      } catch {
        whatsappPendentes = 0
      }
    }

    return NextResponse.json({
      totalMembros: rows[0]?.total ?? 0,
      pendenciasEscalas: escalasPendentes[0]?.total ?? 0,
      escalasSemana: escalasSemana[0]?.total ?? 0,
      pedidosMinisterio,
      whatsappPendentes,
    })
  } catch (error) {
    console.error("Erro ao buscar dashboard admin:", error)
    return NextResponse.json({ error: "Erro ao buscar dashboard" }, { status: 500 })
  }
}
