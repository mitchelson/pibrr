import NextAuth from "next-auth"
import { cookies } from "next/headers"
import { authConfig } from "@/lib/auth.config"
import { sql } from "@/lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user, account }) {
      if (!account || account.provider !== "google") return false
      const { email, name, image } = user
      if (!email) return false

      const cookieStore = await cookies()
      const authMode = cookieStore.get("auth_mode")?.value || "signup"
      cookieStore.delete("auth_mode")

      const existing = await sql`
        SELECT id, role, ativo FROM users WHERE google_id = ${account.providerAccountId} LIMIT 1
      `

      if (existing.length > 0) {
        if (!existing[0].ativo) return false
        await sql`UPDATE users SET ultimo_login_em = now(), foto_url = ${image}, nome = ${name} WHERE id = ${existing[0].id}`
        return true
      }

      const byEmail = await sql`
        SELECT id, role, ativo FROM users
        WHERE lower(trim(email)) = lower(trim(${email}))
        LIMIT 1
      `

      if (byEmail.length > 0) {
        if (!byEmail[0].ativo) return false
        await sql`
          UPDATE users SET
            google_id = COALESCE(google_id, ${account.providerAccountId}),
            email = ${email},
            nome = ${name},
            foto_url = ${image},
            ultimo_login_em = now()
          WHERE id = ${byEmail[0].id}
        `
        return true
      }

      const pendente = await sql`
        SELECT id FROM users
        WHERE google_id IS NULL
          AND apple_id IS NULL
          AND (lower(trim(email)) = lower(trim(${email})) OR nome = ${name})
        LIMIT 1
      `

      if (pendente.length > 0) {
        await sql`
          UPDATE users SET google_id = ${account.providerAccountId}, email = ${email}, nome = ${name}, foto_url = ${image}, ultimo_login_em = now()
          WHERE id = ${pendente[0].id}
        `
        return true
      }

      if (authMode === "login") {
        return "/login?error=no_account"
      }

      const count = await sql`SELECT count(*)::int as total FROM users`
      const role = count[0].total === 0 ? "admin" : "visitor"

      await sql`
        INSERT INTO users (google_id, email, nome, foto_url, role)
        VALUES (${account.providerAccountId}, ${email}, ${name}, ${image}, ${role})
      `
      ;(user as any).isNewUser = true
      return true
    },

    async jwt({ token, account, user }) {
      if (account) {
        token.isNewUser = !!(user as any)?.isNewUser
        const rows = await sql`
          SELECT id, role, ativo FROM users WHERE google_id = ${account.providerAccountId} LIMIT 1
        `
        if (rows.length > 0) {
          token.userId = rows[0].id
          token.role = rows[0].role
        }
      } else if (token.userId) {
        const rows = await sql`SELECT role FROM users WHERE id = ${token.userId} LIMIT 1`
        if (rows.length > 0) token.role = rows[0].role
      }
      if (token.userId) {
        const mRows = await sql`SELECT ministerio_id FROM ministerio_membros WHERE user_id = ${token.userId}`
        token.ministerioIds = mRows.map((r: { ministerio_id: string }) => r.ministerio_id)
      }
      return token
    },
  },
})
