import {
  BookOpen,
  Calendar,
  ClipboardList,
  Home,
  MessageSquare,
  Settings,
  Sparkles,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"

export type NavLink = {
  href: string
  label: string
}

export type AdminNavItem = {
  href: string
  title: string
  icon: LucideIcon
  roles?: Array<"admin" | "lider" | "supervisor">
}

export type AdminNavGroup = {
  id: string
  label: string
  items: AdminNavItem[]
}

/** Public site navigation (SiteShell) */
export const PUBLIC_NAV: NavLink[] = [
  { href: "/sobre", label: "Igreja" },
  { href: "/ministerios", label: "Ministérios" },
  { href: "/celulas", label: "Células" },
  { href: "/eventos", label: "Eventos" },
  { href: "/sermoes", label: "Pregações" },
  { href: "/contato", label: "Contato" },
]

export const PUBLIC_CTA: NavLink = {
  href: "/cadastro",
  label: "Sou visitante",
}

export const PUBLIC_SECONDARY: NavLink = {
  href: "/login",
  label: "Entrar",
}

export const LEGAL_NAV: NavLink[] = [
  { href: "/privacidade", label: "Privacidade" },
  { href: "/termos", label: "Termos de Uso" },
  { href: "/suporte", label: "Suporte" },
  { href: "/excluir-conta", label: "Excluir conta" },
]

/** Member app tabs — hrefs follow NEXT_PUBLIC_APP_UI_VERSION when set */
export const APP_TABS: Array<NavLink & { id: string; adminOnly?: boolean }> = [
  { id: "feed", href: "/feed", label: "Feed" },
  {
    id: "escalas",
    href: process.env.NEXT_PUBLIC_APP_UI_VERSION === "v2" ? "/minha-area-v2" : "/minha-area",
    label: "Escalas",
  },
  {
    id: "admin",
    href: process.env.NEXT_PUBLIC_APP_UI_VERSION === "v2" ? "/admin-v2" : "/admin",
    label: "Admin",
    adminOnly: true,
  },
  {
    id: "perfil",
    href: process.env.NEXT_PUBLIC_APP_UI_VERSION === "v2" ? "/minha-area-v2/perfil" : "/minha-area/perfil",
    label: "Perfil",
  },
]

/** Admin sidebar groups by task */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "inicio",
    label: "Início",
    items: [{ href: "/admin", title: "Dashboard", icon: Home }],
  },
  {
    id: "acolhimento",
    label: "Acolhimento",
    items: [
      { href: "/admin/visitantes", title: "Visitantes", icon: Users },
      { href: "/admin/mensagens", title: "Mensagens", icon: MessageSquare },
      {
        href: "/admin/responsaveis",
        title: "Responsáveis",
        icon: Users,
        roles: ["admin"],
      },
    ],
  },
  {
    id: "pessoas",
    label: "Pessoas",
    items: [
      {
        href: "/admin/membros",
        title: "Membros",
        icon: UserCog,
        roles: ["admin"],
      },
    ],
  },
  {
    id: "programacao",
    label: "Programação",
    items: [
      {
        href: "/admin/eventos",
        title: "Eventos",
        icon: Calendar,
        roles: ["admin"],
      },
      {
        href: "/admin/escalas",
        title: "Escalas",
        icon: ClipboardList,
        roles: ["admin"],
      },
    ],
  },
  {
    id: "formacao",
    label: "Formação",
    items: [
      {
        href: "/admin/dons-espirituais",
        title: "Dons Espirituais",
        icon: Sparkles,
        roles: ["admin"],
      },
      {
        href: "/admin/form-ministerios",
        title: "Form. Ministérios",
        icon: BookOpen,
        roles: ["admin"],
      },
    ],
  },
  {
    id: "sistema",
    label: "Sistema",
    items: [
      {
        href: "/admin/configuracoes",
        title: "Configurações",
        icon: Settings,
        roles: ["admin"],
      },
    ],
  },
]

export function filterAdminItems(
  items: AdminNavItem[],
  role?: string | null
): AdminNavItem[] {
  return items.filter((item) => {
    if (!item.roles) return true
    if (!role) return false
    return item.roles.includes(role as "admin" | "lider" | "supervisor")
  })
}

export function isAdminRole(role?: string | null): boolean {
  return role === "admin" || role === "lider" || role === "supervisor"
}

export type AdminNavItemV2 = AdminNavItem & {
  acolhimento?: boolean
}

export type AdminNavGroupV2 = {
  id: string
  label: string
  items: AdminNavItemV2[]
}

/** Admin v2 sidebar — acolhimento is filtered by ministry config, not by every líder */
export const ADMIN_NAV_GROUPS_V2: AdminNavGroupV2[] = [
  {
    id: "inicio",
    label: "Início",
    items: [{ href: "/admin-v2", title: "Dashboard", icon: Home }],
  },
  {
    id: "acolhimento",
    label: "Acolhimento",
    items: [
      { href: "/admin-v2/visitantes", title: "Visitantes", icon: Users, acolhimento: true },
      { href: "/admin-v2/mensagens", title: "Mensagens", icon: MessageSquare, acolhimento: true },
    ],
  },
  {
    id: "pessoas",
    label: "Pessoas",
    items: [
      { href: "/admin-v2/membros", title: "Membros", icon: UserCog, roles: ["admin"] },
    ],
  },
  {
    id: "programacao",
    label: "Programação",
    items: [
      { href: "/admin-v2/eventos", title: "Eventos", icon: Calendar, roles: ["admin"] },
      { href: "/admin-v2/escalas", title: "Escalas", icon: ClipboardList, roles: ["admin"] },
    ],
  },
  {
    id: "formacao",
    label: "Formação",
    items: [
      { href: "/admin-v2/dons-espirituais", title: "Dons Espirituais", icon: Sparkles, roles: ["admin"] },
      { href: "/admin-v2/interesses", title: "Interesses", icon: BookOpen, roles: ["admin"] },
    ],
  },
  {
    id: "sistema",
    label: "Sistema",
    items: [
      { href: "/admin-v2/configuracoes", title: "Configurações", icon: Settings, roles: ["admin"] },
    ],
  },
]

export function filterAdminItemsV2(
  items: AdminNavItemV2[],
  opts: { role?: string | null; canAcolhimento?: boolean }
): AdminNavItemV2[] {
  return items.filter((item) => {
    if (item.acolhimento && !opts.canAcolhimento) return false
    if (!item.roles) return true
    if (!opts.role) return false
    return item.roles.includes(opts.role as "admin" | "lider" | "supervisor")
  })
}
