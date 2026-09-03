import { NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"
import { sql } from "@/lib/db"
import { verifyAppleIdentityToken } from "@/lib/apple-auth"
import { verifyFirebaseIdToken } from "@/lib/firebase-auth"
import { verifyGoogleIdToken } from "@/lib/google-auth"
import { resolveMobileAuthUser, type MobileAuthProfile } from "@/lib/mobile-auth-user"
import { getMobileJwtSecret } from "@/lib/jwt-secret"
import { maybeProxyGestao } from "@/lib/gestao-bff"


const secret = getMobileJwtSecret()

function buildAppleName(fullName?: {
  givenName?: string | null
  familyName?: string | null
}) {
  if (!fullName) return null
  const parts = [fullName.givenName, fullName.familyName].filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : null
}

async function profileFromBody(body: Record<string, unknown>): Promise<MobileAuthProfile> {
  if (body.provider === "apple" || body.identityToken) {
    const identityToken = body.identityToken as string | undefined
    if (!identityToken) {
      throw new Error("identityToken obrigatório")
    }
    const apple = await verifyAppleIdentityToken(identityToken)
    const clientEmail =
      typeof body.email === "string" && body.email.trim() ? body.email.trim() : null
    const fullName = body.fullName as
      | { givenName?: string | null; familyName?: string | null }
      | undefined

    return {
      provider: "apple",
      providerAccountId: apple.appleId,
      email: apple.email ?? clientEmail,
      name: buildAppleName(fullName),
      picture: null,
    }
  }

  const idToken = body.idToken as string | undefined
  if (!idToken) {
    throw new Error("idToken obrigatório")
  }

  if (body.provider === "firebase") {
    const firebase = await verifyFirebaseIdToken(idToken)
    return {
      provider: "firebase",
      providerAccountId: firebase.firebaseUid,
      email: firebase.email,
      name: firebase.name,
      picture: firebase.picture,
    }
  }

  const google = await verifyGoogleIdToken(idToken)
  return {
    provider: "google",
    providerAccountId: google.googleId,
    email: google.email,
    name: google.name,
    picture: google.picture,
  }
}

export async function POST(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  try {
    const body = await request.json()
    const profile = await profileFromBody(body)
    const resolved = await resolveMobileAuthUser(profile)

    if (resolved.blocked) {
      return NextResponse.json({ error: "Conta bloqueada" }, { status: 403 })
    }

    const ministerioRows = await sql`
      SELECT ministerio_id FROM ministerio_membros WHERE user_id = ${resolved.userId}
    `
    const ministerioIds = ministerioRows.map((r: any) => r.ministerio_id)

    const userRow = await sql`
      SELECT id, nome, email, foto_url, role FROM users WHERE id = ${resolved.userId}
    `

    const row = userRow[0]
    if (!row) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const user = {
      id: row.id,
      name: row.nome,
      email: row.email,
      image: row.foto_url,
      role: row.role,
      ministerioIds,
    }

    const token = await new SignJWT({
      userId: String(resolved.userId),
      role: String(user.role),
      ministerioIds,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .setSubject(resolved.userId)
      .sign(secret)

    return NextResponse.json({ token, user })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno"
    console.error("[/api/auth/mobile]", err)
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
