import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/mobile-auth"
import { sql } from "@/lib/db"
import { maybeProxyGestao } from "@/lib/gestao-bff"
import {
  filtrarPendenciasSemanaCulto,
  formatarDomingoCulto,
  janelaSemanaCultoAtual,
} from "@/lib/domingo-culto"


export async function GET(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff?.ok) {
    try {
      const raw = await __gestaoBff.clone().json()
      const lista = Array.isArray(raw) ? raw : []
      const { items, domingoYmd, domingoLabel } = filtrarPendenciasSemanaCulto(lista)
      return NextResponse.json(
        items.map((p: Record<string, unknown>) => ({
          ...p,
          domingo_culto: domingoYmd,
          domingo_culto_label: domingoLabel,
        }))
      )
    } catch {
      // fall through
    }
  }

  const session = await getSession(request)
  if (!session?.userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const userId = session.userId
  const { domingoYmd, inicio, fim } = janelaSemanaCultoAtual()

  const cats = await sql`SELECT count(*)::int as total FROM mensagem_categorias WHERE ativa = true`
  const totalCategorias = cats[0].total
  if (totalCategorias === 0) return NextResponse.json([])

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
      AND v.data_cadastro >= ${inicio.toISOString()}
      AND v.data_cadastro < ${fim.toISOString()}
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
    domingo_culto: domingoYmd,
    domingo_culto_label: formatarDomingoCulto(domingoYmd),
  })))
}
