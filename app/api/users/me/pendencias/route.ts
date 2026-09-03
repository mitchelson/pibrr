import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/mobile-auth"
import { sql } from "@/lib/db"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export async function GET(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  const session = await getSession(request)
  if (!session?.userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const userId = session.userId

  const cats = await sql`SELECT count(*)::int as total FROM mensagem_categorias WHERE ativa = true`
  const totalCategorias = cats[0].total
  if (totalCategorias === 0) return NextResponse.json([])

  const pendencias = await sql`
    SELECT v.id, v.nome, v.celular, v.data_cadastro, v.sexo,
      count(vme.id)::int as enviadas
    FROM visitantes v
    LEFT JOIN visitante_mensagens_enviadas vme ON vme.visitante_id = v.id
    WHERE v.user_id = ${userId}
      AND v.sem_whatsapp = false
    GROUP BY v.id
    HAVING count(vme.id) < ${totalCategorias}
    ORDER BY v.data_cadastro DESC
  `

  return NextResponse.json(pendencias.map((p: any) => ({
    ...p,
    total_categorias: totalCategorias,
    pendentes: totalCategorias - p.enviadas,
  })))
}
