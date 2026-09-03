"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import useSWR from "swr"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus } from "lucide-react"
import { MinistryIcon } from "@/components/ministry-icon"
import { RoleBadges } from "@/components/role-badges"
import { ADMIN_NAV_GROUPS_V2, filterAdminItemsV2 } from "@/lib/nav-config"
import { canAccessAcolhimento } from "@/lib/acolhimento"
import { CHURCH_INFO } from "@/lib/constants"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AdminSidebarV2() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { data: ministerios } = useSWR("/api/ministerios", fetcher, { refreshInterval: 30000 })
  const { data: config } = useSWR("/api/config", fetcher)
  const userId = session?.user?.id
  const { data: rolesData } = useSWR(userId ? `/api/accounts/${userId}/roles` : null, fetcher)
  const { setOpenMobile } = useSidebar()
  const role = session?.user?.role
  const ministerioIds: string[] = session?.user?.ministerioIds || []
  const closeMobile = () => setOpenMobile(false)

  const canAcolhimento = canAccessAcolhimento(
    role,
    ministerioIds,
    config?.acolhimento_ministerio_id || null
  )

  const visibleMinisterios =
    ministerios?.filter((m: { ativo?: boolean; id: string }) => {
      if (!m.ativo) return false
      if (role === "admin") return true
      return ministerioIds.includes(m.id)
    }) || []

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/">
          <Image
            src="/pib-logo-black.png"
            alt={CHURCH_INFO.SHORT_NAME}
            width={120}
            height={40}
            className="h-8 w-auto"
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {ADMIN_NAV_GROUPS_V2.map((group) => {
          const items = filterAdminItemsV2(group.items, { role, canAcolhimento })
          if (items.length === 0) return null
          return (
            <SidebarGroup key={group.id}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={pathname === item.href}>
                        <Link href={item.href} onClick={closeMobile}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}

        <SidebarGroup>
          <SidebarGroupLabel>Ministérios</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMinisterios.map((m: { id: string; nome: string; icone?: string; cor?: string }) => (
                <SidebarMenuItem key={m.id}>
                  <SidebarMenuButton asChild isActive={pathname === `/admin-v2/ministerios/${m.id}`}>
                    <Link href={`/admin-v2/ministerios/${m.id}`} onClick={closeMobile}>
                      <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={16} />
                      <span>{m.nome}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin-v2/ministerios"}>
                    <Link href="/admin-v2/ministerios" onClick={closeMobile}>
                      <Plus className="h-4 w-4" />
                      <span>Gerenciar</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {session?.user && (
        <SidebarFooter className="p-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.user.image ?? undefined} />
              <AvatarFallback>{session.user.name?.[0] ?? "U"}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col text-sm leading-tight">
              <span className="truncate font-medium">{session.user.name}</span>
              <RoleBadges roles={rolesData?.roles} legacyRole={session.user.role} size="xs" className="mt-0.5" />
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
