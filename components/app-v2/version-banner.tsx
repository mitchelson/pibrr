"use client"

import Link from "next/link"
import { APP_PATHS } from "@/lib/app-ui"
import { useAppUi } from "@/hooks/use-app-ui"

export function VersionBanner() {
  const { isPreview, switchTo } = useAppUi()

  if (!isPreview) return null

  return (
    <div className="border-b bg-foreground text-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2 text-xs sm:text-sm">
        <p>Você está na versão nova</p>
        <Link
          href={APP_PATHS.v1.escalas}
          className="underline underline-offset-2 hover:no-underline"
          onClick={() => switchTo("v1")}
        >
          Voltar à atual
        </Link>
      </div>
    </div>
  )
}
