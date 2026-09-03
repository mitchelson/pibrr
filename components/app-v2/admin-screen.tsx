"use client"

import { DsBtn, DsHero, DsPage } from "@/components/app-v2/ds"

/**
 * Envelope padrão das telas de gestão v2.
 * Objetivo: mesmo kicker/título/ação em todas as rotas admin.
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
    <DsPage wide className="!px-4 md:!px-6">
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
  return (
    <DsBtn onClick={onClick}>{children}</DsBtn>
  )
}
