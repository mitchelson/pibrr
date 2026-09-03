import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/mobile-auth"
import { sendPushToUser } from "@/lib/push"

// GET — listar trocas pendentes do usuário (como solicitante ou destinatário)
export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const userId = session.userId
  const rows = await sql`
    SELECT t.*,
      sol.nome as solicitante_nome, sol.foto_url as solicitante_foto,
      dest.nome as destinatario_nome, dest.foto_url as destinatario_foto,
      ev_sol.titulo as evento_solicitante, ev_sol.data as data_solicitante, ev_sol.horario as horario_solicitante,
      ev_dest.titulo as evento_destinatario, ev_dest.data as data_destinatario, ev_dest.horario as horario_destinatario,
      m.nome as ministerio, m.icone as ministerio_icone,
      es.funcao as funcao_solicitante, ed.funcao as funcao_destinatario
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
  return NextResponse.json(rows)
}

// POST — solicitar troca
export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { escala_solicitante_id, escala_destinatario_id } = await request.json()
  if (!escala_solicitante_id || !escala_destinatario_id) {
    return NextResponse.json({ error: "IDs das escalas obrigatórios" }, { status: 400 })
  }

  const userId = session.userId

  // Verifica que a escala do solicitante pertence a ele
  const minha = await sql`SELECT * FROM escalas WHERE id = ${escala_solicitante_id} AND user_id = ${userId}`
  if (minha.length === 0) return NextResponse.json({ error: "Escala não pertence a você" }, { status: 403 })

  // Verifica que a escala do destinatário existe e é do mesmo ministério
  const outra = await sql`SELECT * FROM escalas WHERE id = ${escala_destinatario_id}`
  if (outra.length === 0) return NextResponse.json({ error: "Escala destino não encontrada" }, { status: 404 })
  if (outra[0].ministerio_id !== minha[0].ministerio_id) {
    return NextResponse.json({ error: "Escalas devem ser do mesmo ministério" }, { status: 400 })
  }

  // Verifica que ambos eventos são futuros
  const eventos = await sql`
    SELECT id, data FROM eventos WHERE id IN (${minha[0].evento_id}, ${outra[0].evento_id}) AND data >= CURRENT_DATE
  `
  if (eventos.length < 2) return NextResponse.json({ error: "Ambos eventos devem ser futuros" }, { status: 400 })

  // Cria a solicitação
  const rows = await sql`
    INSERT INTO escala_trocas (solicitante_id, escala_solicitante_id, destinatario_id, escala_destinatario_id)
    VALUES (${userId}, ${escala_solicitante_id}, ${outra[0].user_id}, ${escala_destinatario_id})
    RETURNING *
  `

  // Busca nome do solicitante
  const solUser = await sql`SELECT nome FROM users WHERE id = ${userId} LIMIT 1`
  const solNome = solUser[0]?.nome || "Alguém"

  // Notifica o destinatário (in-app + push)
  await sql`
    INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
    VALUES (${outra[0].user_id}, 'troca_escala', ${"Solicitação de troca"}, ${`${solNome} quer trocar de escala com você`}, '/minha-area')
  `
  sendPushToUser(outra[0].user_id, {
    title: "Solicitação de troca",
    body: `${solNome} quer trocar de escala com você`,
    url: "/minha-area",
  }).catch(() => {})

  return NextResponse.json(rows[0], { status: 201 })
}
