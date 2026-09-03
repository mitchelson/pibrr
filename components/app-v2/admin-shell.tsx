"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebarV2 } from "@/components/app-v2/admin-sidebar"
import { VersionBanner } from "@/components/app-v2/version-banner"
import { UiCookieSync } from "@/components/app-v2/ui-cookie-sync"
import { NotificationsButton } from "@/components/notifications-button"
import { DsRoot } from "@/components/app-v2/ds"

/** Gestão: drawer único — sem dock de membro */
export function AdminShellV2({ children }: { children: React.ReactNode }) {
  return (
    <DsRoot>
      <UiCookieSync version="v2" />
      <VersionBanner />
      <SidebarProvider>
        <AdminSidebarV2 />
        <SidebarInset className="bg-[var(--pib-paper)]">
          <header className="pib-topbar">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <p className="pib-kicker hidden sm:block">Gestão</p>
            </div>
            <div className="flex items-center gap-1">
              <NotificationsButton />
              <button
                type="button"
                className="pib-btn pib-btn--ghost pib-btn--sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Sair</span>
              </button>
            </div>
          </header>
          <div>{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </DsRoot>
  )
}
