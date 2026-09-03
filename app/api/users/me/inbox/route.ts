import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/mobile-auth"
import { sql } from "@/lib/db"
import { canAccessAcolhimento } from "@/lib/acolhimento"
import { getAcolhimentoMinisterioId } from "@/lib/acolhimento-server"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  const session = await getSession(request)
  if (!session?.userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const userId = session.userId
  const acolhimentoId = await getAcolhimentoMinisterioId()
  const showWhatsapp = canAccessAcolhimento(session.role, session.ministerioIds, acolhimentoId)

  const escalasPendentes = await sql`
    SELECT es.id, es.evento_id, e.titulo as evento_titulo, e.data, e.horario, es.funcao,
           m.nome as ministerio, m.icone
    FROM escalas es
    JOIN eventos e ON e.id = es.evento_id
    JOIN ministerios m ON m.id = es.ministerio_id
    WHERE es.user_id = ${userId}
      AND es.status = 'pendente'
      AND e.data >= CURRENT_DATE
    ORDER BY e.data ASC
  `

  const trocas = await sql`
    SELECT t.id, t.destinatario_id, t.solicitante_id,
      sol.nome as solicitante_nome, dest.nome as destinatario_nome,
      ev_sol.data as data_solicitante, ev_dest.data as data_destinatario,
      m.nome as ministerio, m.icone as ministerio_icone
    FROM escala_trocas t
    JOIN users sol ON sol.id = t.solicitante_id
    JOIN users dest ON dest.id = t.destinatario_id
    JOIN escalas es ON es.id = t.escala_solicitante_id
    JOIN escalas ed ON ed.id = t.escala_destinatario_id
    JOIN eventos ev_sol ON ev_sol.id = es.evento_id
    JOIN eventos ev_dest ON ev_dest.id = ed.evento_id
    JOIN ministerios m ON m.id = es.ministerio_id
    WHERE (t.solicitante_id = ${userId} OR t.destinatario_id = ${userId})
      AND t.status = 'pendente'
    ORDER BY t.criado_em DESC
  `

  let pedidosMinisterio: unknown[] = []
  try {
    pedidosMinisterio = await sql`
      SELECT mm.user_id, u.nome, u.foto_url, m.id as ministerio_id, m.nome as ministerio
      FROM ministerio_membros mm
      JOIN users u ON u.id = mm.user_id
      JOIN ministerios m ON m.id = mm.ministerio_id
      WHERE mm.pendente = true
        AND (
          ${session.role} = 'admin'
          OR EXISTS (
            SELECT 1 FROM ministerio_membros lider
            WHERE lider.user_id = ${userId}
              AND lider.ministerio_id = mm.ministerio_id
              AND lider.is_lider = true
          )
        )
      ORDER BY u.nome
    `
  } catch {
    pedidosMinisterio = []
  }

  let whatsappPendentes: unknown[] = []
  if (showWhatsapp) {
    try {
      const cats = await sql`SELECT count(*)::int as total FROM mensagem_categorias WHERE ativa = true`
      const totalCategorias = cats[0]?.total ?? 0
      if (totalCategorias > 0) {
        whatsappPendentes = await sql`
          SELECT v.id, v.nome, v.celular, v.data_cadastro,
            count(vme.id)::int as enviadas,
            ${totalCategorias}::int as total_categorias,
            (${totalCategorias}::int - count(vme.id)::int) as pendentes
          FROM visitantes v
          LEFT JOIN visitante_mensagens_enviadas vme ON vme.visitante_id = v.id
          WHERE v.sem_whatsapp = false
          GROUP BY v.id
          HAVING count(vme.id) < ${totalCategorias}
          ORDER BY v.data_cadastro DESC
          LIMIT 20
        `
      }
    } catch {
      whatsappPendentes = []
    }
  }

  return NextResponse.json({
    escalasPendentes,
    trocas,
    pedidosMinisterio,
    whatsappPendentes,
  })
}
