"use client"

import { DsBtn, DsHero, DsPage } from "@/components/app-v2/ds"

/**
 * Envelope padrão das telas de gestão v2.
 * Receita (TNP → mono): eyebrow → título → CTA → corpo (stats / well / lista).
 */
export function AdminScreen({
  kicker,
  title,
  subtitle,
  action,
  children,
}: {
  kicker: string
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <DsPage className="pib-page--admin">
      <DsHero kicker={kicker} title={title} subtitle={subtitle} action={action} />
      {children}
    </DsPage>
  )
}

export function AdminPrimaryAction({
  children,
  onClick,
  href,
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
}) {
  if (href) {
    return <DsBtn href={href}>{children}</DsBtn>
  }
  return <DsBtn onClick={onClick}>{children}</DsBtn>
}
