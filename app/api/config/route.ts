import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export async function GET(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff
  const rows = await sql`SELECT chave, valor FROM app_config`
  const config = Object.fromEntries(rows.map((r: any) => [r.chave, r.valor]))
  return NextResponse.json(config)
}

export async function PUT(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  const session = await auth()
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { chave, valor } = await request.json()
  await sql`
    INSERT INTO app_config (chave, valor, atualizado_em)
    VALUES (${chave}, ${valor}, now())
    ON CONFLICT (chave) DO UPDATE SET valor = ${valor}, atualizado_em = now()
  `
  return NextResponse.json({ ok: true })
}
