import { SignJWT } from "jose"
import { getMobileJwtSecret } from "@/lib/jwt-secret"

export type GestaoJwtClaims = {
  userId: string
  role: string
  ministerioIds?: string[]
}

/** Short-lived JWT accepted by gestao-api JwtAuthGuard (same shape as mobile). */
export async function mintGestaoJwt(claims: GestaoJwtClaims): Promise<string> {
  const secret = getMobileJwtSecret()
  return new SignJWT({
    userId: String(claims.userId),
    role: String(claims.role || "membro"),
    ministerioIds: claims.ministerioIds ?? [],
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .setSubject(String(claims.userId))
    .sign(secret)
}
