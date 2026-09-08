import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { maybeProxyGestao } from "@/lib/gestao-bff"
import { categoriasAtivasDoPayload, normalizeCategoriasPayload } from "@/lib/mensagem-categorias"


async function loadCategoriasLocal() {
  return sql`
    SELECT c.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', m.id,
            'categoria_id', m.categoria_id,
            'titulo', m.titulo,
            'corpo', m.corpo,
            'ordem', m.ordem
          )
          ORDER BY m.ordem
        ) FILTER (WHERE m.id IS NOT NULL),
        '[]'
      ) as modelos
    FROM mensagem_categorias c
    LEFT JOIN mensagem_modelos m ON m.categoria_id = c.id
    GROUP BY c.id
    ORDER BY c.ordem
  `
}

export async function GET(request: NextRequest) {
  // BFF pode exigir auth / devolver shape diferente — se falhar, usa SQL local.
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) {
    if (__gestaoBff.ok) {
      try {
        const raw = await __gestaoBff.clone().json()
        const normalized = normalizeCategoriasPayload(raw)
        if (normalized.length > 0 || Array.isArray(raw)) {
          return NextResponse.json(normalized)
        }
      } catch {
        // fall through to local
      }
    }
  }

  try {
    const categorias = await loadCategoriasLocal()
    return NextResponse.json(normalizeCategoriasPayload(categorias))
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("Erro ao buscar categorias:", msg)
    return NextResponse.json(
      { error: "Erro ao buscar categorias", detail: msg },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const __gestaoBff = await maybeProxyGestao(request as NextRequest)
  if (__gestaoBff) {
    if (__gestaoBff.ok) return __gestaoBff
    // fall through on failure
  }

  try {
    const { nome, descricao, ordem, dia, ativa } = await request.json()
    if (!nome || !dia) {
      return NextResponse.json({ error: "Nome e dia obrigatorios" }, { status: 400 })
    }

    const maxOrdem = ordem ?? (await sql`SELECT COALESCE(MAX(ordem), 0) + 1 as next FROM mensagem_categorias`)[0].next
    const ativaInicial = ativa === false ? false : true

    const result = await sql`
      INSERT INTO mensagem_categorias (nome, dia, descricao, ordem, ativa)
      VALUES (${nome}, ${dia}, ${descricao || null}, ${maxOrdem}, ${ativaInicial})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("Erro ao criar categoria:", msg)
    return NextResponse.json(
      { error: "Erro ao criar categoria", detail: msg },
      { status: 500 },
    )
  }
}

/** Exportado para testes / reuso — categorias ativas do fluxo. */
export function onlyAtivas(data: unknown) {
  return categoriasAtivasDoPayload(data)
}
