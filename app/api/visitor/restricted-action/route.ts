import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/mobile-auth"

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  if (session.role !== "visitor") {
    return NextResponse.json({ error: "Apenas visitantes" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const action = typeof body.action === "string" ? body.action.trim() : "ação desconhecida"
  if (!action) {
    return NextResponse.json({ error: "action obrigatório" }, { status: 400 })
  }

  const rows = await sql`
    SELECT nome, email FROM users WHERE id = ${session.userId} LIMIT 1
  `
  const nome = rows[0]?.nome ?? "Visitante"
  const email = rows[0]?.email ?? ""
  const titulo = "Visitante tentou ação restrita"
  const mensagem = `${nome}${email ? ` (${email})` : ""} tentou: ${action}`
  const link = "/admin/membros"

  await sql`
    INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
    SELECT id, 'visitor_restrito', ${titulo}, ${mensagem}, ${link}
    FROM users
    WHERE role = 'admin' AND ativo = true
  `

  return NextResponse.json({ ok: true })
}
