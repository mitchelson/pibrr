"use client"

import { useEffect, useId, useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import {
  formatRoleBadge,
  type RoleBadgeItem,
  roleLabel,
} from "@/components/role-badges"

export function DsRoot({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("pib-ds", className)}>{children}</div>
}

export function DsPage({
  children,
  wide,
  flushBottom,
  className,
}: {
  children: React.ReactNode
  wide?: boolean
  flushBottom?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "pib-page pib-stack",
        wide && "pib-page--wide",
        flushBottom && "pib-page--flush-bottom",
        className
      )}
    >
      {children}
    </div>
  )
}

/** Poço rebaixado para filtros / ferramentas */
export function DsWell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("pib-well", className)}>{children}</div>
}

/** Faixa de atenção (ex.: N pedidos pendentes) */
export function DsAlertStrip({
  children,
  action,
}: {
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="pib-alert-strip">
      <div>{children}</div>
      {action}
    </div>
  )
}

export function DsHero({
  kicker,
  title,
  subtitle,
  action,
}: {
  kicker?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <header className="pib-rise flex items-end justify-between gap-4">
      <div className="min-w-0 space-y-2">
        {kicker ? <p className="pib-kicker">{kicker}</p> : null}
        <h1 className="pib-title text-3xl tracking-[-0.02em] sm:text-[2.125rem]">{title}</h1>
        {subtitle ? <p className="pib-mute max-w-prose text-sm leading-relaxed">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

export function DsSection({
  title,
  eyebrow,
  action,
  children,
  className,
  priority,
  primary,
}: {
  title?: string
  eyebrow?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  /** Destaque de atenção (pedidos, alertas) */
  priority?: boolean
  /** Bloco de trabalho principal da tela */
  primary?: boolean
}) {
  return (
    <section
      className={cn(
        "pib-section pib-rise pib-rise-delay-1",
        priority && "pib-section--priority",
        primary && "pib-section--primary",
        className
      )}
    >
      {(title || action || eyebrow) && (
        <div className="pib-section-head">
          <div className="min-w-0 space-y-1">
            {eyebrow ? <p className="pib-step-label">{eyebrow}</p> : null}
            {title ? (
              <h2 className={cn("pib-section-title", primary && "pib-section-title--lg")}>{title}</h2>
            ) : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function DsStatStrip({
  items,
}: {
  items: Array<{ value: React.ReactNode; label: string }>
}) {
  return (
    <div className="pib-stat-strip pib-rise pib-rise-delay-1">
      {items.map((item) => (
        <div key={item.label} className="pib-stat">
          <span className="pib-stat__value">{item.value}</span>
          <span className="pib-stat__label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export function DsIconBadge({ children }: { children: React.ReactNode }) {
  return <div className="pib-icon-badge">{children}</div>
}

export function DsPanel({
  children,
  ink,
  className,
}: {
  children: React.ReactNode
  ink?: boolean
  className?: string
}) {
  return <div className={cn("pib-panel", ink && "pib-panel--ink", className)}>{children}</div>
}

export function DsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("pib-panel pib-list", className)}>{children}</div>
}

export function DsRow({
  href,
  onClick,
  title,
  meta,
  leading,
  trailing,
  as: Comp = "button",
}: {
  href?: string
  onClick?: () => void
  title: React.ReactNode
  meta?: React.ReactNode
  leading?: React.ReactNode
  trailing?: React.ReactNode
  as?: "button" | "div"
}) {
  const content = (
    <>
      {leading}
      <div className="pib-row__body">
        <div className="pib-row__title">{title}</div>
        {meta ? <div className="pib-row__meta">{meta}</div> : null}
      </div>
      <div className="pib-row__trail">{trailing ?? <ChevronRight className="h-4 w-4" />}</div>
    </>
  )

  if (href) {
    return (
      <Link href={href} className="pib-row">
        {content}
      </Link>
    )
  }

  if (Comp === "div") {
    return <div className="pib-row">{content}</div>
  }

  return (
    <button type="button" className="pib-row" onClick={onClick}>
      {content}
    </button>
  )
}

export function DsStatus({
  tone,
  children,
}: {
  tone: "pending" | "ok" | "no" | "neutral"
  children: React.ReactNode
}) {
  return <span className={cn("pib-status", `pib-status--${tone}`)}>{children}</span>
}

export function DsChip({
  children,
  active,
  onClick,
  className,
}: {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
}) {
  const Comp = onClick ? "button" : "span"
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn("pib-chip", active && "pib-chip--active", className)}
    >
      {children}
    </Comp>
  )
}

export function DsBtn({
  children,
  variant = "primary",
  size,
  className,
  href,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "soft" | "danger" | "tertiary"
  size?: "sm" | "icon"
  href?: string
}) {
  const classes = cn(
    "pib-btn",
    variant === "primary" && "pib-btn--primary",
    variant === "ghost" && "pib-btn--ghost",
    variant === "soft" && "pib-btn--soft",
    variant === "danger" && "pib-btn--danger",
    variant === "tertiary" && "pib-btn--tertiary",
    size === "sm" && "pib-btn--sm",
    size === "icon" && "pib-btn--icon",
    className
  )
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}

export function DsEmpty({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="pib-empty pib-panel">
      <p className="pib-empty__title">{title}</p>
      {description ? <p className="text-sm">{description}</p> : null}
      {action}
    </div>
  )
}

export function DsCount({ children }: { children: React.ReactNode }) {
  return <p className="pib-count">{children}</p>
}

export function DsField({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn("pib-field", className)}>
      <span className="pib-field__label">{label}</span>
      {children}
    </label>
  )
}

/** Confirmação nativa do DS — substitui window.confirm */
export function DsConfirm({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="pib-confirm" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="pib-confirm__backdrop" aria-label="Fechar" onClick={onCancel} />
      <div className="pib-confirm__panel">
        <h3 id={titleId} className="pib-title text-xl">
          {title}
        </h3>
        {description ? <p className="pib-mute mt-2 text-sm leading-relaxed">{description}</p> : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DsBtn variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </DsBtn>
          <DsBtn variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </DsBtn>
        </div>
      </div>
    </div>
  )
}

export function useDsConfirm() {
  const [state, setState] = useState<{
    title: string
    description?: string
    danger?: boolean
    confirmLabel?: string
    resolve: (ok: boolean) => void
  } | null>(null)

  const ask = (opts: {
    title: string
    description?: string
    danger?: boolean
    confirmLabel?: string
  }) =>
    new Promise<boolean>((resolve) => {
      setState({ ...opts, resolve })
    })

  const node = (
    <DsConfirm
      open={!!state}
      title={state?.title || ""}
      description={state?.description}
      danger={state?.danger}
      confirmLabel={state?.confirmLabel}
      onCancel={() => {
        state?.resolve(false)
        setState(null)
      }}
      onConfirm={() => {
        state?.resolve(true)
        setState(null)
      }}
    />
  )

  return { ask, node }
}

/** Papéis monocromáticos — só no v2 */
export function RoleBadgesV2({
  roles,
  legacyRole,
  className,
  size = "sm",
}: {
  roles?: RoleBadgeItem[] | null
  legacyRole?: string | null
  className?: string
  size?: "xs" | "sm"
}) {
  const items: RoleBadgeItem[] =
    roles && roles.length > 0
      ? roles
      : legacyRole
        ? [{ role_name: legacyRole === "visitor" ? "visitante" : legacyRole }]
        : []

  if (items.length === 0) return null

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {items.map((role, i) => (
        <span
          key={`${role.role_name}-${role.context_id || "global"}-${i}`}
          className={cn("pib-chip", size === "xs" && "pib-chip--xs")}
        >
          {formatRoleBadge(role)}
        </span>
      ))}
    </div>
  )
}

export function roleLabelV2(roleName: string, displayName?: string | null) {
  return roleLabel(roleName, displayName)
}
