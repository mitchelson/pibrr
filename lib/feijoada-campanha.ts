const DEFAULT_API = "https://caixa-api.zenvixlabs.app"
const DEFAULT_SITE = "https://feijoada.pibrr.com"
const TENANT = "pibrr"

export type FeijoadaCampanha = {
  ativa: boolean
  url: string
  comprarUrl: string
  nome: string
  descricao: string | null
  dataEvento: string | null
  metaFeijoadas: number
  vendido: number
  progresso: number
  precoMin: number | null
  precoReferencia: number | null
}

type CampanhaApiResponse = {
  atual?: {
    status?: string
    nome?: string
    descricao?: string | null
    data_evento?: string | null
    meta_feijoadas?: number
    vendido?: number
    progresso?: number
    preco_min?: number | null
    preco_referencia?: number | null
  } | null
}

const INATIVA: FeijoadaCampanha = {
  ativa: false,
  url: DEFAULT_SITE,
  comprarUrl: `${DEFAULT_SITE}/comprar`,
  nome: "",
  descricao: null,
  dataEvento: null,
  metaFeijoadas: 0,
  vendido: 0,
  progresso: 0,
  precoMin: null,
  precoReferencia: null,
}

/**
 * Campanha ligada pelo evento no banco (status `venda`), não por env on/off.
 * Consulta a API pública de vendas.
 */
export async function getFeijoadaCampanha(): Promise<FeijoadaCampanha> {
  const apiBase = (process.env.FEIJOADA_API_URL || DEFAULT_API).replace(/\/$/, "")
  const siteUrl = (process.env.NEXT_PUBLIC_FEIJOADA_URL || DEFAULT_SITE).replace(/\/$/, "")

  try {
    const res = await fetch(`${apiBase}/eventos/campanha`, {
      headers: { "X-Tenant-Slug": TENANT },
      next: { revalidate: 60 },
    })
    if (!res.ok) return { ...INATIVA, url: siteUrl, comprarUrl: `${siteUrl}/comprar` }

    const data = (await res.json()) as CampanhaApiResponse
    const atual = data.atual
    const ativa = Boolean(atual && atual.status === "venda")

    if (!ativa || !atual) {
      return { ...INATIVA, url: siteUrl, comprarUrl: `${siteUrl}/comprar` }
    }

    return {
      ativa: true,
      url: siteUrl,
      comprarUrl: `${siteUrl}/comprar`,
      nome: atual.nome?.trim() || "Feijoada da construção",
      descricao: atual.descricao ?? null,
      dataEvento: atual.data_evento ?? null,
      metaFeijoadas: atual.meta_feijoadas ?? 0,
      vendido: atual.vendido ?? 0,
      progresso: atual.progresso ?? 0,
      precoMin: atual.preco_min ?? null,
      precoReferencia: atual.preco_referencia ?? null,
    }
  } catch {
    return { ...INATIVA, url: siteUrl, comprarUrl: `${siteUrl}/comprar` }
  }
}

/** @deprecated use getFeijoadaCampanha */
export async function getFeijoadaCampanhaAtiva() {
  const c = await getFeijoadaCampanha()
  return { ativa: c.ativa, url: c.url, nome: c.nome }
}

export function formatFeijoadaPreco(campanha: FeijoadaCampanha): string | null {
  const valor = campanha.precoMin ?? campanha.precoReferencia
  if (valor == null) return null
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function formatFeijoadaData(data: string | null): string | null {
  if (!data) return null
  const d = new Date(`${data}T12:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
}
