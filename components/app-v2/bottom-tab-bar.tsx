"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Sun, UsersRound, Briefcase } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { isAdminRole } from "@/lib/nav-config"
import { useAppUi } from "@/hooks/use-app-ui"
import { cn } from "@/lib/utils"

export function BottomTabBarV2() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { paths } = useAppUi()
  const showAdmin = isAdminRole(session?.user?.role)

  const hojeActive =
    pathname === paths.escalas ||
    pathname.startsWith("/minha-area-v2/culto") ||
    (pathname.startsWith("/minha-area-v2") && !pathname.startsWith("/minha-area-v2/perfil"))
  const feedActive = pathname.startsWith("/feed")
  const adminActive = pathname.startsWith("/admin-v2") || pathname.startsWith("/admin")
  const perfilActive = pathname.startsWith(paths.perfil)

  const items = [
    { href: paths.escalas, label: "Hoje", icon: Sun, active: hojeActive },
    { href: paths.feed, label: "Comunidade", icon: UsersRound, active: feedActive },
    ...(showAdmin
      ? [{ href: paths.admin, label: "Gestão", icon: Briefcase, active: adminActive }]
      : []),
    { href: paths.perfil, label: "Eu", icon: null as null, active: perfilActive },
  ]

  return (
    <nav className="pib-dock" aria-label="Navegação principal">
      <div className="pib-dock__inner" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((item) => {
          if (!item.icon) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="pib-dock__item"
                data-active={item.active}
              >
                <Avatar className={cn("pib-dock__avatar h-5 w-5")}>
                  <AvatarImage src={session?.user?.image ?? undefined} />
                  <AvatarFallback className="pib-dock__avatar-fallback text-[8px]">
                    {session?.user?.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                {item.label}
              </Link>
            )
          }
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="pib-dock__item"
              data-active={item.active}
            >
              <Icon className="h-5 w-5" strokeWidth={item.active ? 2.25 : 1.75} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
