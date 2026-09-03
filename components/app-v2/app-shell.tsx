"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { LogOut, Newspaper, ClipboardList, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { isAdminRole } from "@/lib/nav-config"
import { CHURCH_INFO } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { PwaInstallPrompt } from "@/components/pwa-install-prompt"
import { NotificationsButton } from "@/components/notifications-button"
import { BottomTabBarV2 } from "@/components/app-v2/bottom-tab-bar"
import { VersionBanner } from "@/components/app-v2/version-banner"
import { UiCookieSync } from "@/components/app-v2/ui-cookie-sync"
import { useAppUi } from "@/hooks/use-app-ui"

type AppShellV2Props = {
  children: React.ReactNode
  showTabs?: boolean
}

function tabActive(pathname: string, href: string, perfilHref: string, escalasHref: string) {
  if (href === perfilHref) return pathname.startsWith(perfilHref)
  if (href === escalasHref) {
    return pathname === escalasHref
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppShellV2({ children, showTabs = true }: AppShellV2Props) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { paths } = useAppUi()
  const showAdmin = isAdminRole(session?.user?.role)

  const desktopTabs = [
    { href: paths.feed, label: "Feed", icon: Newspaper },
    { href: paths.escalas, label: "Escalas", icon: ClipboardList },
    ...(showAdmin ? [{ href: paths.admin, label: "Admin", icon: Shield }] : []),
    { href: paths.perfil, label: "Perfil", icon: null as unknown as typeof Newspaper },
  ]

  return (
    <div className={cn("min-h-screen bg-muted/30", showTabs && "pb-16 md:pb-0")}>
      <UiCookieSync version="v2" />
      <VersionBanner />
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
            {session && <NotificationsButton />}
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

      <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b bg-background px-4 md:hidden">
        <Link href={paths.escalas}>
          <Image
            src="/pib-logo-black.png"
            alt={CHURCH_INFO.SHORT_NAME}
            width={80}
            height={28}
            className="h-6 w-auto"
          />
        </Link>
        {session ? <NotificationsButton /> : null}
      </header>

      {children}

      {showTabs && <BottomTabBarV2 />}
      <PwaInstallPrompt />
    </div>
  )
}
