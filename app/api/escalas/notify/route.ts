import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/mobile-auth"
import { sql } from "@/lib/db"
import { sendPushToUser } from "@/lib/push"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export async function POST(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  if (session.role !== "admin" && session.role !== "lider" && session.role !== "supervisor") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  const { evento_id, ministerio_id } = await request.json()
  if (!evento_id || !ministerio_id) {
    return NextResponse.json({ error: "evento_id e ministerio_id obrigatórios" }, { status: 400 })
  }

  const evento = await sql`SELECT titulo, data FROM eventos WHERE id = ${evento_id}`
  if (!evento.length) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 })

  const dataFormatada = new Date(evento[0].data).toLocaleDateString("pt-BR", { timeZone: "UTC" })

  const escalados = await sql`
    SELECT DISTINCT e.user_id FROM escalas e
    WHERE e.evento_id = ${evento_id} AND e.ministerio_id = ${ministerio_id}
  `

  let sent = 0
  await Promise.allSettled(
    escalados.map(async (e: any) => {
      const count = await sendPushToUser(e.user_id, {
        title: "Lembrete de Escala",
        body: `Lembre-se que você está escalado para ${evento[0].titulo} dia ${dataFormatada}`,
        url: "/minha-area",
      })
      sent += count
    })
  )

  return NextResponse.json({ sent, total: escalados.length })
}
