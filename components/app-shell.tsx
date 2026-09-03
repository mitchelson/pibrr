"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { LogOut, Newspaper, ClipboardList, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { BottomTabBar } from "@/components/bottom-tab-bar"
import { isAdminRole } from "@/lib/nav-config"
import { APP_PATHS, envUiVersion } from "@/lib/app-ui"
import { CHURCH_INFO } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { PwaInstallPrompt } from "@/components/pwa-install-prompt"

type AppShellProps = {
  children: React.ReactNode
  /** Show bottom tabs (default true) */
  showTabs?: boolean
}

function tabActive(pathname: string, href: string, perfilHref: string, escalasHref: string) {
  if (href === perfilHref) return pathname.startsWith(perfilHref)
  if (href === escalasHref) {
    return pathname === escalasHref || pathname === "/minha-area" || pathname === "/minha-area"
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppShell({ children, showTabs = true }: AppShellProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const showAdmin = isAdminRole(session?.user?.role)
  const paths = APP_PATHS[envUiVersion()]

  const desktopTabs = [
    { href: paths.feed, label: "Feed", icon: Newspaper },
    { href: paths.escalas, label: "Escalas", icon: ClipboardList },
    ...(showAdmin
      ? [{ href: paths.admin, label: "Admin", icon: Shield }]
      : []),
    { href: paths.perfil, label: "Perfil", icon: null as unknown as typeof Newspaper },
  ]

  return (
    <div className={cn("min-h-screen bg-muted/30", showTabs && "pb-16 md:pb-0")}>
      {/* Desktop top nav — parity with BottomTabBar */}
      <header className="sticky top-0 z-40 hidden border-b bg-background/95 backdrop-blur md:block">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <Link href={paths.escalas} className="shrink-0">
            <Image
              src="/pib-logo-black.png"
              alt={CHURCH_INFO.SHORT_NAME}
              width={100}
              height={32}
              className="h-7 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-1">
            {desktopTabs.map((tab) => {
              const active = tabActive(pathname, tab.href, paths.perfil, paths.escalas)
              if (tab.href === paths.perfil) {
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-primary/15 text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Avatar className={cn("h-6 w-6", active && "ring-2 ring-primary")}>
                      <AvatarImage src={session?.user?.image ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {session?.user?.name?.[0] ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    Perfil
                  </Link>
                )
              }
              const Icon = tab.icon
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-primary/15 text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              )
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Site</Link>
            </Button>
            {session && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {children}

      {showTabs && <BottomTabBar />}
      <PwaInstallPrompt />
    </div>
  )
}
