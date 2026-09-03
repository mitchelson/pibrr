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

export function canAccessAcolhimento(
  role?: string | null,
  ministerioIds?: string[] | null,
  acolhimentoMinisterioId?: string | null
): boolean {
  if (role === "admin") return true
  if (!acolhimentoMinisterioId) return false
  return (ministerioIds || []).includes(acolhimentoMinisterioId)
}

export function canAccessAdminUi(role?: string | null): boolean {
  return role === "admin" || role === "lider" || role === "supervisor"
}
