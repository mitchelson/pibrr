import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/mobile-auth"
import { sendPushToUser } from "@/lib/push"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { id } = await params
  const { status } = await req.json()
  if (!["aceita", "recusada"].includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 })
  }

  // Busca a troca
  const troca = await sql`SELECT * FROM escala_trocas WHERE id = ${id} AND status = 'pendente'`
  if (troca.length === 0) return NextResponse.json({ error: "Troca não encontrada ou já processada" }, { status: 404 })

  const t = troca[0]

  // Só o destinatário pode aceitar/recusar
  if (t.destinatario_id !== session.userId) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  if (status === "recusada") {
    await sql`UPDATE escala_trocas SET status = 'recusada' WHERE id = ${id}`
    // Notifica solicitante (in-app + push)
    await sql`
      INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
      VALUES (${t.solicitante_id}, 'troca_escala', ${"Troca recusada"}, ${"Sua solicitação de troca foi recusada"}, '/minha-area')
    `
    sendPushToUser(t.solicitante_id, {
      title: "Troca recusada",
      body: "Sua solicitação de troca foi recusada",
      url: "/minha-area",
    }).catch(() => {})
    return NextResponse.json({ ok: true, status: "recusada" })
  }

  // Aceitar: verificar indisponibilidades
  const escSol = await sql`SELECT * FROM escalas WHERE id = ${t.escala_solicitante_id}`
  const escDest = await sql`SELECT * FROM escalas WHERE id = ${t.escala_destinatario_id}`
  const evSol = await sql`SELECT data FROM eventos WHERE id = ${escSol[0].evento_id}`
  const evDest = await sql`SELECT data FROM eventos WHERE id = ${escDest[0].evento_id}`

  // Verifica se destinatário está disponível na data do solicitante
  const indispDest = await sql`
    SELECT 1 FROM user_indisponibilidades
    WHERE user_id = ${t.destinatario_id} AND data_inicio <= ${evSol[0].data} AND data_fim >= ${evSol[0].data}
  `
  if (indispDest.length > 0) {
    return NextResponse.json({ error: "Você está indisponível na data da escala que receberia" }, { status: 409 })
  }

  // Verifica se solicitante está disponível na data do destinatário
  const indispSol = await sql`
    SELECT 1 FROM user_indisponibilidades
    WHERE user_id = ${t.solicitante_id} AND data_inicio <= ${evDest[0].data} AND data_fim >= ${evDest[0].data}
  `
  if (indispSol.length > 0) {
    return NextResponse.json({ error: "O solicitante está indisponível na data que receberia" }, { status: 409 })
  }

  // Efetuar a troca: swap user_id nas escalas
  await sql`UPDATE escalas SET user_id = ${t.destinatario_id} WHERE id = ${t.escala_solicitante_id}`
  await sql`UPDATE escalas SET user_id = ${t.solicitante_id} WHERE id = ${t.escala_destinatario_id}`
  await sql`UPDATE escala_trocas SET status = 'aceita' WHERE id = ${id}`

  // Notifica solicitante (in-app + push)
  await sql`
    INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
    VALUES (${t.solicitante_id}, 'troca_escala', ${"Troca aceita!"}, ${"Sua troca de escala foi aceita"}, '/minha-area')
  `
  sendPushToUser(t.solicitante_id, {
    title: "Troca aceita!",
    body: "Sua troca de escala foi aceita",
    url: "/minha-area",
  }).catch(() => {})

  return NextResponse.json({ ok: true, status: "aceita" })
}
