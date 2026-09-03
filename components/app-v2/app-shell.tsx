"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { LogOut, Sun, UsersRound, Briefcase } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { isAdminRole } from "@/lib/nav-config"
import { CHURCH_INFO } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { PwaInstallPrompt } from "@/components/pwa-install-prompt"
import { NotificationsButton } from "@/components/notifications-button"
import { BottomTabBarV2 } from "@/components/app-v2/bottom-tab-bar"
import { VersionBanner } from "@/components/app-v2/version-banner"
import { UiCookieSync } from "@/components/app-v2/ui-cookie-sync"
import { useAppUi } from "@/hooks/use-app-ui"
import { DsRoot } from "@/components/app-v2/ds"

type AppShellV2Props = {
  children: React.ReactNode
  showTabs?: boolean
}

/**
 * Um menu por viewport:
 * - Desktop (md+): só topbar ink com tabs
 * - Mobile: topbar mínima (logo + sino) + dock inferior com as mesmas tabs
 */
export function AppShellV2({ children, showTabs = true }: AppShellV2Props) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { paths } = useAppUi()
  const showAdmin = isAdminRole(session?.user?.role)

  const tabs = [
    { href: paths.escalas, label: "Hoje", icon: Sun },
    { href: paths.feed, label: "Comunidade", icon: UsersRound },
    ...(showAdmin ? [{ href: paths.admin, label: "Gestão", icon: Briefcase }] : []),
  ]

  const perfilActive = pathname.startsWith(paths.perfil)

  const tabIsActive = (href: string) => {
    if (href === paths.escalas) {
      return (
        pathname === paths.escalas ||
        pathname.startsWith("/minha-area-v2/culto") ||
        (pathname.startsWith("/minha-area-v2") && !pathname.startsWith(paths.perfil))
      )
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <DsRoot className={cn(showTabs && "pb-0")}>
      <UiCookieSync version="v2" />
      <VersionBanner />

      <header className="pib-topbar pib-topbar--ink pib-topbar--member-desktop">
        <Link href={paths.escalas} className="justify-self-start">
          <Image
            src="/pib-logo-black.png"
            alt={CHURCH_INFO.SHORT_NAME}
            width={110}
            height={36}
            className="h-7 w-auto invert"
          />
        </Link>
        <nav className="flex items-center gap-1 justify-self-center" aria-label="Navegação principal">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="pib-nav-pill"
                data-active={tabIsActive(tab.href)}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            )
          })}
          <Link
            href={paths.perfil}
            className="pib-nav-pill pib-nav-pill--profile"
            data-active={perfilActive}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={session?.user?.image ?? undefined} />
              <AvatarFallback className="pib-nav-pill__fallback bg-white/20 text-[10px] text-white">
                {session?.user?.name?.[0] ?? "U"}
              </AvatarFallback>
            </Avatar>
            Eu
          </Link>
        </nav>
        <div className="flex items-center gap-1 justify-self-end">
          {session && (
            <div className="[&_button]:text-white [&_button]:hover:bg-white/10">
              <NotificationsButton />
            </div>
          )}
          <button
            type="button"
            className="pib-btn pib-btn--sm border-white/20 bg-transparent text-white hover:bg-white/10"
            onClick={() => signOut({ callbackUrl: "/" })}
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <header className="pib-topbar pib-topbar--member-mobile">
        <Link href={paths.escalas} className="flex items-center gap-2">
          <Image
            src="/pib-logo-black.png"
            alt={CHURCH_INFO.SHORT_NAME}
            width={88}
            height={28}
            className="h-6 w-auto"
          />
        </Link>
        {session ? <NotificationsButton /> : null}
      </header>

      {children}

      {showTabs && <BottomTabBarV2 />}
      <PwaInstallPrompt />
    </DsRoot>
  )
}
