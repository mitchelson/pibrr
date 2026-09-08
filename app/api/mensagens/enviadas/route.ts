import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { maybeProxyGestao } from "@/lib/gestao-bff"


// GET /api/mensagens/enviadas?visitante_id=xxx
export async function GET(request: Request) {
  const __gestaoBff = await maybeProxyGestao(request as NextRequest)
  if (__gestaoBff?.ok) return __gestaoBff

  try {
    const { searchParams } = new URL(request.url)
    const visitanteId = searchParams.get("visitante_id")

    if (!visitanteId) {
      return NextResponse.json(
        { error: "visitante_id obrigatorio" },
        { status: 400 },
      )
    }

    const enviadas = await sql`
      SELECT * FROM visitante_mensagens_enviadas
      WHERE visitante_id = ${visitanteId}
      ORDER BY enviado_em DESC
    `
    return NextResponse.json(enviadas)
  } catch (error) {
    console.error("Erro ao buscar mensagens enviadas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar mensagens enviadas" },
      { status: 500 },
    )
  }
}

// POST /api/mensagens/enviadas  { visitante_id, categoria_id }
export async function POST(request: Request) {
  const req = request as NextRequest
  // Body can only be read once — if BFF fails we need a fresh parse.
  // Clone request for BFF by reading text first.
  const rawBody = await request.text()
  let proxied: NextResponse | null = null
  try {
    const fakeReq = new NextRequest(req.url, {
      method: "POST",
      headers: req.headers,
      body: rawBody,
    })
    proxied = await maybeProxyGestao(fakeReq)
  } catch {
    proxied = null
  }
  if (proxied?.ok) return proxied

  try {
    const { visitante_id, categoria_id } = JSON.parse(rawBody || "{}")
    if (!visitante_id || !categoria_id) {
      return NextResponse.json(
        { error: "visitante_id e categoria_id obrigatorios" },
        { status: 400 },
      )
    }

    const result = await sql`
      INSERT INTO visitante_mensagens_enviadas (visitante_id, categoria_id, enviado_em)
      VALUES (${visitante_id}, ${categoria_id}, NOW())
      ON CONFLICT (visitante_id, categoria_id)
      DO UPDATE SET enviado_em = NOW()
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao registrar mensagem enviada:", error)
    return NextResponse.json(
      { error: "Erro ao registrar mensagem enviada", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

// DELETE /api/mensagens/enviadas?visitante_id=xxx&categoria_id=yyy
export async function DELETE(request: Request) {
  const __gestaoBff = await maybeProxyGestao(request as NextRequest)
  if (__gestaoBff?.ok) return __gestaoBff

  try {
    const { searchParams } = new URL(request.url)
    const visitanteId = searchParams.get("visitante_id")
    const categoriaId = searchParams.get("categoria_id")

    if (!visitanteId || !categoriaId) {
      return NextResponse.json(
        { error: "visitante_id e categoria_id obrigatorios" },
        { status: 400 },
      )
    }

    await sql`
      DELETE FROM visitante_mensagens_enviadas
      WHERE visitante_id = ${visitanteId} AND categoria_id = ${categoriaId}
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao remover mensagem enviada:", error)
    return NextResponse.json(
      { error: "Erro ao remover mensagem enviada" },
      { status: 500 },
    )
  }
}
