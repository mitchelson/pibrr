/** JWT secret for mobile auth / gestao-api BFF — treats empty env vars as unset. */
export function getMobileJwtSecret(): Uint8Array {
  const raw =
    process.env.AUTH_JWT_SECRET?.trim() ||
    process.env.AUTH_MOBILE_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "fallback-secret"
  return new TextEncoder().encode(raw)
}
