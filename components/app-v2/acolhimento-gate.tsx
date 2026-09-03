"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { canAccessAcolhimento } from "@/lib/acolhimento"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AcolhimentoGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { data: config } = useSWR("/api/config", fetcher)
  const router = useRouter()
  const ok = canAccessAcolhimento(
    session?.user?.role,
    session?.user?.ministerioIds,
    config?.acolhimento_ministerio_id || null
  )

  useEffect(() => {
    if (status === "loading" || !config) return
    if (!ok) router.replace("/admin")
  }, [status, config, ok, router])

  if (status === "loading" || !config || !ok) {
    return <p className="p-8 text-center text-sm text-muted-foreground">Carregando…</p>
  }
  return <>{children}</>
}
