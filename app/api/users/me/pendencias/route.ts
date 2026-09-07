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

  // Pendência = categorias ativas ainda sem registro em visitante_mensagens_enviadas.
  // Filtra pelas pessoas atribuídas ao usuário logado (user_id).
  const pendencias = await sql`
    SELECT
      v.id,
      v.nome,
      v.celular,
      v.data_cadastro,
      v.sexo,
      (
        SELECT count(*)::int
        FROM mensagem_categorias c
        WHERE c.ativa = true
          AND EXISTS (
            SELECT 1 FROM visitante_mensagens_enviadas me
            WHERE me.visitante_id = v.id AND me.categoria_id = c.id
          )
      ) AS enviadas
    FROM visitantes v
    WHERE v.user_id = ${userId}
      AND v.sem_whatsapp IS NOT TRUE
      AND EXISTS (
        SELECT 1 FROM mensagem_categorias c
        WHERE c.ativa = true
          AND NOT EXISTS (
            SELECT 1 FROM visitante_mensagens_enviadas me
            WHERE me.visitante_id = v.id AND me.categoria_id = c.id
          )
      )
    ORDER BY v.data_cadastro DESC
  `

  return NextResponse.json(pendencias.map((p: any) => ({
    ...p,
    total_categorias: totalCategorias,
    pendentes: totalCategorias - p.enviadas,
  })))
}
