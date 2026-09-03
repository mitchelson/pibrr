import { auth } from "@/lib/auth"
import {
  gestaoFetchJson,
  isGestaoBffEnabled,
  type GestaoSession,
} from "@/lib/gestao-api"

export { isGestaoBffEnabled }

function sessionFromUser(user: {
  id?: string
  role?: string
  ministerioIds?: string[]
} | null | undefined): GestaoSession | null {
  if (!user?.id) return null
  return {
    userId: user.id,
    role: user.role || "membro",
    ministerioIds: user.ministerioIds || [],
  }
}

export async function gestaoSessionFromAuth(): Promise<GestaoSession | null> {
  const session = await auth()
  return sessionFromUser(session?.user)
}

/** Typed helper for RSC pages when BFF flag is on. */
export async function ssrGestaoJson<T>(
  path: string,
  opts?: { session?: GestaoSession | null; public?: boolean }
): Promise<T | null> {
  if (!isGestaoBffEnabled()) return null
  const { ok, data } = await gestaoFetchJson<T>(path, {
    session: opts?.session,
    public: opts?.public,
  })
  if (!ok) {
    console.error("[gestao-ssr]", path, "status not ok")
    return null
  }
  return data
}
