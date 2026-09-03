import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { maybeProxyGestao } from "@/lib/gestao-bff"


const ASSUNTOS: Record<string, string> = {
  visitante: "Primeira Visita",
  ministerio: "Participar de Ministério",
  oracao: "Pedido de Oração",
  evento: "Informações sobre Eventos",
  outro: "Outro",
}

export async function POST(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
    }

    const nome = typeof body.nome === "string" ? body.nome.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim() : ""
    const telefone = typeof body.telefone === "string" ? body.telefone.trim() : ""
    const assunto = typeof body.assunto === "string" ? body.assunto.trim() : ""
    const mensagem = typeof body.mensagem === "string" ? body.mensagem.trim() : ""

    if (!nome || nome.length < 2) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }
    if (!assunto) {
      return NextResponse.json({ error: "Assunto é obrigatório" }, { status: 400 })
    }
    if (!mensagem || mensagem.length < 5) {
      return NextResponse.json({ error: "Mensagem é obrigatória" }, { status: 400 })
    }

    const assuntoLabel = ASSUNTOS[assunto] || assunto
    const titulo = `Contato: ${assuntoLabel}`
    const notifMensagem = `${nome}${telefone ? ` · ${telefone}` : ""} · ${email}\n\n${mensagem}`.slice(0, 500)
    const link = "/admin/mensagens"

    try {
      await sql`
        INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
        SELECT id, 'contato', ${titulo}, ${notifMensagem}, ${link}
        FROM users
        WHERE role = 'admin' AND ativo = true
      `
    } catch (err) {
      console.error("Erro ao notificar admins (contato):", err)
      // Ainda retorna sucesso — a mensagem foi validada; notificação é best-effort
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Erro no contato:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao enviar mensagem" },
      { status: 500 }
    )
  }
}
