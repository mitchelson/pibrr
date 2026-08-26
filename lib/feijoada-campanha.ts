const DEFAULT_API = "https://caixa-api.zenvixlabs.app"
const DEFAULT_SITE = "https://feijoada.pibrr.com"
const TENANT = "pibrr"

export type FeijoadaCampanhaAtiva = {
  ativa: boolean
  url: string
  nome?: string
}

/**
 * Campanha ligada pelo evento no banco (status `venda`), não por env on/off.
 * Consulta a API pública de vendas.
 */
export async function getFeijoadaCampanhaAtiva(): Promise<FeijoadaCampanhaAtiva> {
  const apiBase = (process.env.FEIJOADA_API_URL || DEFAULT_API).replace(/\/$/, "")
  const siteUrl = process.env.NEXT_PUBLIC_FEIJOADA_URL || DEFAULT_SITE

  try {
    const res = await fetch(`${apiBase}/eventos/campanha`, {
      headers: { "X-Tenant-Slug": TENANT },
      next: { revalidate: 60 },
    })
    if (!res.ok) return { ativa: false, url: siteUrl }

    const data = (await res.json()) as {
      atual?: { status?: string; nome?: string } | null
    }
    const atual = data.atual
    const ativa = Boolean(atual && atual.status === "venda")
    return {
      ativa,
      url: siteUrl,
      nome: atual?.nome,
    }
  } catch {
    return { ativa: false, url: siteUrl }
  }
}
