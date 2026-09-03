import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

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
        <h1 className="pib-title text-3xl sm:text-[2.125rem]">{title}</h1>
        {subtitle ? <p className="pib-mute max-w-prose text-sm leading-relaxed">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

export function DsSection({
  title,
  action,
  children,
  className,
}: {
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("pib-section pib-rise pib-rise-delay-1", className)}>
      {(title || action) && (
        <div className="pib-section-head">
          {title ? <h2 className="pib-section-title">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  )
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

export function DsBtn({
  children,
  variant = "primary",
  size,
  className,
  href,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "soft" | "danger"
  size?: "sm" | "icon"
  href?: string
}) {
  const classes = cn(
    "pib-btn",
    variant === "primary" && "pib-btn--primary",
    variant === "ghost" && "pib-btn--ghost",
    variant === "soft" && "pib-btn--soft",
    variant === "danger" && "pib-btn--danger",
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
