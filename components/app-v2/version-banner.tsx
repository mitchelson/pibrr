"use client"

import Link from "next/link"
import { APP_PATHS } from "@/lib/app-ui"
import { useAppUi } from "@/hooks/use-app-ui"

export function VersionBanner() {
  const { isPreview, switchTo } = useAppUi()

  if (!isPreview) return null

  return (
    <div className="pib-banner">
      <p>Versão nova em teste</p>
      <Link
        href={APP_PATHS.v1.escalas}
        className="underline underline-offset-2 hover:no-underline"
        onClick={() => switchTo("v1")}
      >
        Voltar à atual
      </Link>
    </div>
  )
}
