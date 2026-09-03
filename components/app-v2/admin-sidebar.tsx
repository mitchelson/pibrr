"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import useSWR from "swr"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MinistryIcon } from "@/components/ministry-icon"
import { RoleBadgesV2 } from "@/components/app-v2/ds"
import { ADMIN_NAV_GROUPS_V2, filterAdminItemsV2 } from "@/lib/nav-config"
import { canAccessAcolhimento } from "@/lib/acolhimento"
import { CHURCH_INFO } from "@/lib/constants"
import { useAppUi } from "@/hooks/use-app-ui"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AdminSidebarV2() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { paths } = useAppUi()
  const { data: ministerios } = useSWR("/api/ministerios", fetcher, { refreshInterval: 30000 })
  const { data: config } = useSWR("/api/config", fetcher)
  const { setOpenMobile } = useSidebar()
  const role = session?.user?.role
  const ministerioIds: string[] = session?.user?.ministerioIds || []
  const closeMobile = () => setOpenMobile(false)

  const canAcolhimento = canAccessAcolhimento(
    role,
    ministerioIds,
    config?.acolhimento_ministerio_id || null
  )

  const myMinisterios =
    ministerios?.filter((m: { ativo?: boolean; id: string }) => {
      if (!m.ativo) return false
      if (role === "admin") return true
      return ministerioIds.includes(m.id)
    }) || []

  return (
    <Sidebar className="pib-rail border-r border-[var(--pib-line)]">
      <SidebarHeader className="pib-rail__brand">
        <Link href={paths.admin} onClick={closeMobile}>
          <Image
            src="/pib-logo-black.png"
            alt={CHURCH_INFO.SHORT_NAME}
            width={120}
            height={40}
            className="h-8 w-auto"
          />
        </Link>
        <p className="mt-3 pib-kicker">Espaço de gestão</p>
      </SidebarHeader>

      <SidebarContent>
        {myMinisterios.length > 0 && (
          <div className="pib-rail__group">
            <p className="pib-rail__label">Ministério</p>
            {myMinisterios.slice(0, 6).map((m: any) => (
              <Link
                key={m.id}
                href={`/admin/ministerios/${m.id}`}
                onClick={closeMobile}
                className="pib-rail__link"
                data-active={pathname === `/admin/ministerios/${m.id}`}
              >
                <MinistryIcon name={m.icone} ministryName={m.nome} mono size={18} />
                <span className="truncate">{m.nome}</span>
              </Link>
            ))}
          </div>
        )}

        {ADMIN_NAV_GROUPS_V2.map((group) => {
          const items = filterAdminItemsV2(group.items, { role, canAcolhimento })
          if (items.length === 0) return null
          return (
            <div key={group.id} className="pib-rail__group">
              <p className="pib-rail__label">{group.label}</p>
              {items.map((item) => {
                const Icon = item.icon
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className="pib-rail__link"
                    data-active={active}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </div>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-[var(--pib-line)] p-3">
        <Link href={paths.perfil} onClick={closeMobile} className="pib-rail__link">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback>{session?.user?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{session?.user?.name}</p>
            <RoleBadgesV2 legacyRole={role} size="xs" className="mt-0.5" />
          </div>
        </Link>
        <Link href={paths.escalas} onClick={closeMobile} className="pib-rail__cta">
          ← Voltar para Hoje
        </Link>
      </SidebarFooter>
    </Sidebar>
  )
}
