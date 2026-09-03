import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export async function GET(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff
  const rows = await sql`
    SELECT em.*, COALESCE(json_agg(json_build_object(
      'id', ep.id, 'ministerio_id', ep.ministerio_id, 'funcao', ep.funcao, 'quantidade', ep.quantidade,
      'ministerio_nome', m.nome, 'ministerio_icone', m.icone
    )) FILTER (WHERE ep.id IS NOT NULL), '[]') as posicoes
    FROM evento_modelos em
    LEFT JOIN evento_posicoes ep ON ep.modelo_id = em.id
    LEFT JOIN ministerios m ON m.id = ep.ministerio_id
    GROUP BY em.id ORDER BY em.nome
  `
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(req)
  if (__gestaoBff) return __gestaoBff

  const { nome, tipo, horario, descricao, posicoes } = await req.json()
  if (!nome) return NextResponse.json({ error: "nome obrigatório" }, { status: 400 })

  const rows = await sql`
    INSERT INTO evento_modelos (nome, tipo, horario, descricao)
    VALUES (${nome}, ${tipo ?? "Culto"}, ${horario ?? null}, ${descricao ?? null})
    RETURNING *
  `
  const modelo = rows[0]

  if (posicoes?.length) {
    for (const p of posicoes) {
      await sql`INSERT INTO evento_posicoes (modelo_id, ministerio_id, funcao, quantidade)
        VALUES (${modelo.id}, ${p.ministerio_id}, ${p.funcao}, ${p.quantidade ?? 1})`
    }
  }

  return NextResponse.json(modelo, { status: 201 })
}
