"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"
import { APP_PATHS } from "@/lib/app-ui"

export function TryV2Link({
  href = APP_PATHS.v2.escalas,
  className,
}: {
  href?: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={
        className ??
        "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      }
    >
      <Sparkles className="h-3.5 w-3.5" />
      Experimentar versão nova
    </Link>
  )
}
