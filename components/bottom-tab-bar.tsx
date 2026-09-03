"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Newspaper, ClipboardList, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { isAdminRole } from "@/lib/nav-config"
import { APP_PATHS, envUiVersion } from "@/lib/app-ui"
import { cn } from "@/lib/utils"

export function BottomTabBar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const showAdmin = isAdminRole(session?.user?.role)
  const paths = APP_PATHS[envUiVersion()]

  const feedActive = pathname.startsWith("/feed")
  const escalasActive =
    pathname === paths.escalas || pathname === "/minha-area" || pathname === "/minha-area"
  const adminActive = pathname.startsWith("/admin")
  const perfilActive = pathname.startsWith(paths.perfil) || pathname.startsWith("/minha-area/perfil")

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex h-16 items-center justify-around">
        <Link
          href={paths.feed}
          className={cn(
            "flex flex-col items-center gap-0.5 text-[11px]",
            feedActive ? "font-semibold text-foreground" : "text-muted-foreground"
          )}
        >
          <Newspaper className={cn("h-5 w-5", feedActive ? "text-primary" : undefined)} />
          Feed
        </Link>
        <Link
          href={paths.escalas}
          className={cn(
            "flex flex-col items-center gap-0.5 text-[11px]",
            escalasActive ? "font-semibold text-foreground" : "text-muted-foreground"
          )}
        >
          <ClipboardList className={cn("h-5 w-5", escalasActive ? "text-primary" : undefined)} />
          Escalas
        </Link>
        {showAdmin && (
          <Link
            href={paths.admin}
            className={cn(
              "flex flex-col items-center gap-0.5 text-[11px]",
              adminActive ? "font-semibold text-foreground" : "text-muted-foreground"
            )}
          >
            <Shield className={cn("h-5 w-5", adminActive ? "text-primary" : undefined)} />
            Admin
          </Link>
        )}
        <Link
          href={paths.perfil}
          className={cn(
            "flex flex-col items-center gap-0.5 text-[11px]",
            perfilActive ? "font-semibold text-foreground" : "text-muted-foreground"
          )}
        >
          <Avatar className={cn("h-5 w-5", perfilActive && "ring-2 ring-primary")}>
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback className="text-[8px]">{session?.user?.name?.[0]}</AvatarFallback>
          </Avatar>
          Perfil
        </Link>
      </div>
    </nav>
  )
}
