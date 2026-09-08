import type { MensagemCategoria, MensagemModelo } from "@/types/supabase"

/** Postgres/BFF podem devolver boolean, "t"/"f", 0/1 ou "true"/"false". */
export function isCategoriaAtiva(cat: { ativa?: unknown } | null | undefined): boolean {
  const v = cat?.ativa
  return v === true || v === 1 || v === "1" || v === "t" || v === "true" || v === "TRUE"
}

/** Extrai array de categorias de respostas locais ou BFF (array | wrapper). */
export function normalizeCategoriasPayload(data: unknown): MensagemCategoria[] {
  if (!data) return []
  if (Array.isArray(data)) return data.map(normalizeCategoria)
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>
    for (const key of ["categorias", "data", "items", "results"]) {
      if (Array.isArray(obj[key])) {
        return (obj[key] as unknown[]).map(normalizeCategoria)
      }
    }
  }
  return []
}

function normalizeModelo(m: Record<string, unknown>): MensagemModelo {
  return {
    id: String(m.id ?? ""),
    categoria_id: String(m.categoria_id ?? ""),
    titulo: String(m.titulo ?? ""),
    // legado: conteudo → corpo
    corpo: String(m.corpo ?? m.conteudo ?? ""),
    ordem: Number(m.ordem ?? 0),
    created_at: String(m.created_at ?? m.criado_em ?? ""),
    updated_at: String(m.updated_at ?? ""),
  }
}

function normalizeCategoria(raw: unknown): MensagemCategoria {
  const c = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const modelosRaw = Array.isArray(c.modelos) ? c.modelos : []
  return {
    id: String(c.id ?? ""),
    nome: String(c.nome ?? ""),
    dia: c.dia != null ? String(c.dia) : undefined,
    descricao: c.descricao == null ? null : String(c.descricao),
    ordem: Number(c.ordem ?? 0),
    ativa: isCategoriaAtiva(c as { ativa?: unknown }),
    modelos: modelosRaw.map((m) =>
      normalizeModelo((m && typeof m === "object" ? m : {}) as Record<string, unknown>)
    ),
  }
}

export function categoriasAtivasDoPayload(data: unknown): MensagemCategoria[] {
  return normalizeCategoriasPayload(data).filter((c) => c.ativa && c.id)
}
