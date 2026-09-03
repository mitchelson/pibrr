/** Pure helpers — safe to import from client components. */

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
