import { sql } from "@/lib/db"

/**
 * Quem pode editar o repertório do evento:
 * - admin
 * - se o evento define função (ex.: Ministrante): quem está escalado
 *   naquele ministério com essa função (match case-insensitive)
 * - se só define ministério: membro do ministério ou escalado nele neste evento
 */
export async function canEditRepertorio(
  userId: string,
  eventoId: string,
  roleHint?: string
): Promise<boolean> {
  if (roleHint === "admin") return true

  const user = await sql`SELECT role FROM users WHERE id = ${userId}`
  if (user[0]?.role === "admin") return true

  try {
    const adminRole = await sql`
      SELECT 1
      FROM account_roles ar
      JOIN roles r ON r.id = ar.role_id
      WHERE ar.account_id = ${userId}
        AND r.name = 'admin'
        AND (ar.is_active IS NULL OR ar.is_active = true)
      LIMIT 1
    `
    if (adminRole.length > 0) return true
  } catch {
    // tabelas de permissões podem não existir em todos os ambientes
  }

  const evento = await sql`
    SELECT repertorio_ministerio_id, repertorio_funcao
    FROM eventos WHERE id = ${eventoId}
  `
  const { repertorio_ministerio_id, repertorio_funcao } = evento[0] || {}
  if (!repertorio_ministerio_id) return false

  const funcaoAlvo =
    typeof repertorio_funcao === "string" ? repertorio_funcao.trim() : ""

  // Função configurada (ex.: Ministrante): basta estar escalado nessa função
  if (funcaoAlvo) {
    const escala = await sql`
      SELECT 1 FROM escalas
      WHERE user_id = ${userId}
        AND evento_id = ${eventoId}
        AND ministerio_id = ${repertorio_ministerio_id}
        AND LOWER(TRIM(funcao)) = LOWER(${funcaoAlvo})
      LIMIT 1
    `
    return escala.length > 0
  }

  // Só ministério: membro ou escalado neste evento
  const membership = await sql`
    SELECT 1 FROM ministerio_membros
    WHERE user_id = ${userId} AND ministerio_id = ${repertorio_ministerio_id}
    LIMIT 1
  `
  if (membership.length > 0) return true

  const escalado = await sql`
    SELECT 1 FROM escalas
    WHERE user_id = ${userId}
      AND evento_id = ${eventoId}
      AND ministerio_id = ${repertorio_ministerio_id}
    LIMIT 1
  `
  return escalado.length > 0
}
