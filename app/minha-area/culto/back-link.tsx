"use client"

import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { isNavTargetPending, useNavPending } from "@/components/app-v2/nav-pending"

export function CultoBackLink() {
  const { pendingHref } = useNavPending()
  const href = "/minha-area"
  const pending = isNavTargetPending(pendingHref, href)

  return (
    <Link
      href={href}
      aria-busy={pending}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--pib-mute)] transition-colors hover:text-[var(--pib-ink)]"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <ArrowLeft className="h-4 w-4" />
      )}
      {pending ? "Abrindo…" : "Hoje"}
    </Link>
  )
}
