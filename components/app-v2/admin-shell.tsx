"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { AdminSidebarV2 } from "@/components/app-v2/admin-sidebar"
import { BottomTabBarV2 } from "@/components/app-v2/bottom-tab-bar"
import { VersionBanner } from "@/components/app-v2/version-banner"
import { UiCookieSync } from "@/components/app-v2/ui-cookie-sync"
import { NotificationsButton } from "@/components/notifications-button"

export function AdminShellV2({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UiCookieSync version="v2" />
      <VersionBanner />
      <SidebarProvider>
        <AdminSidebarV2 />
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1" />
            <NotificationsButton />
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">Sair</span>
            </Button>
          </header>
          <div className="p-4 pb-20 md:p-6 md:pb-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
      <BottomTabBarV2 />
    </>
  )
}
