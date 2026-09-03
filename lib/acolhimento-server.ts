import { sql } from "@/lib/db"
import { isGestaoBffEnabled, ssrGestaoJson } from "@/lib/gestao-ssr"

export async function getAcolhimentoMinisterioId(): Promise<string | null> {
  if (isGestaoBffEnabled()) {
    const config = await ssrGestaoJson<Record<string, string>>("/v1/config", {
      public: true,
    })
    const value = config?.acolhimento_ministerio_id
    return value ? value : null
  }

  try {
    const rows = await sql`
      SELECT valor FROM app_config WHERE chave = 'acolhimento_ministerio_id' LIMIT 1
    `
    const value = rows[0]?.valor as string | undefined
    return value ? value : null
  } catch {
    return null
  }
}
