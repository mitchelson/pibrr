"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"

type NavPendingContextValue = {
  /** pathname (+ search) do destino enquanto a navegação não completa */
  pendingHref: string | null
}

const NavPendingContext = createContext<NavPendingContextValue>({
  pendingHref: null,
})

export function useNavPending() {
  return useContext(NavPendingContext)
}

/** True se o destino pendente é exatamente este href (abas / rows). */
export function isNavTargetPending(pendingHref: string | null, href: string) {
  if (!pendingHref) return false
  const pendingPath = pendingHref.split("?")[0]
  const targetPath = href.split("?")[0]
  return pendingPath === targetPath
}

function resolveInternalHref(anchor: HTMLAnchorElement, pathname: string): string | null {
  if (anchor.hasAttribute("download")) return null
  if (anchor.target && anchor.target !== "_self") return null

  const raw = anchor.getAttribute("href")
  if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) {
    return null
  }

  let url: URL
  try {
    url = new URL(anchor.href, window.location.origin)
  } catch {
    return null
  }

  if (url.origin !== window.location.origin) return null

  const next = `${url.pathname}${url.search}`
  const current = `${pathname}${window.location.search}`
  if (next === current) return null

  return next
}

/**
 * Feedback imediato em cliques de Link internos (App Router).
 * Fica no root para sobreviver à troca de shells (Hoje ↔ Comunidade ↔ Gestão).
 */
export function NavPendingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest("a[href]")
      if (!(anchor instanceof HTMLAnchorElement)) return

      const href = resolveInternalHref(anchor, pathname)
      if (!href) return
      setPendingHref(href)
    }

    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [pathname])

  useEffect(() => {
    if (!pendingHref) return
    const timer = window.setTimeout(() => setPendingHref(null), 12000)
    return () => window.clearTimeout(timer)
  }, [pendingHref])

  return (
    <NavPendingContext.Provider value={{ pendingHref }}>
      {children}
      <NavPendingChrome active={Boolean(pendingHref)} />
    </NavPendingContext.Provider>
  )
}

function NavPendingChrome({ active }: { active: boolean }) {
  if (!active) return null

  return (
    <div className="pib-nav-pending" role="progressbar" aria-label="Carregando página" aria-busy="true">
      <div className="pib-nav-pending__bar" />
    </div>
  )
}
