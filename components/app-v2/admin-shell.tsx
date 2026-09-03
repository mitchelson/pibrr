"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebarV2 } from "@/components/app-v2/admin-sidebar"
import { UiCookieSync } from "@/components/app-v2/ui-cookie-sync"
import { NotificationsButton } from "@/components/notifications-button"
import { DsRoot } from "@/components/app-v2/ds"

/** Gestão: rail + topbar frosted — sem dock de membro (padrão TNP adaptado) */
export function AdminShellV2({ children }: { children: React.ReactNode }) {
  return (
    <DsRoot>
      <UiCookieSync version="v2" />
      <SidebarProvider>
        <AdminSidebarV2 />
        <SidebarInset className="bg-[var(--pib-paper)]">
          <header className="pib-topbar pib-topbar--bar">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-1" />
              <div className="hidden sm:block">
                <p className="pib-kicker">PIB Roraima</p>
                <p className="text-sm font-semibold leading-none tracking-tight">Gestão</p>
              </div>
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
          <div className="min-w-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </DsRoot>
  )
}
