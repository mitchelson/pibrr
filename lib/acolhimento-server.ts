import { sql } from "@/lib/neon"

export async function getAcolhimentoMinisterioId(): Promise<string | null> {
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
