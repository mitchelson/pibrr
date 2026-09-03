import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export async function GET(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const rows = await sql`
    SELECT ministerio_id FROM ministerio_membros WHERE user_id = ${session.user.id}
  `
  return NextResponse.json(rows.map((r: any) => r.ministerio_id))
}

export async function POST(req: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(req)
  if (__gestaoBff) return __gestaoBff

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { ministerio_id } = await req.json()
  if (!ministerio_id) return NextResponse.json({ error: "ministerio_id obrigatório" }, { status: 400 })
  const rows = await sql`
    INSERT INTO ministerio_membros (user_id, ministerio_id, pendente)
    VALUES (${session.user.id}, ${ministerio_id}, true)
    ON CONFLICT (ministerio_id, user_id) DO NOTHING
    RETURNING *
  `
  return NextResponse.json(rows[0] ?? {}, { status: 201 })
}
