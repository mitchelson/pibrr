import {
  BookOpen,
  Calendar,
  ClipboardList,
  Home,
  MessageSquare,
  Music,
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
  {
    id: "escalas",
    href: process.env.NEXT_PUBLIC_APP_UI_VERSION === "v2" ? "/minha-area-v2" : "/minha-area",
    label: process.env.NEXT_PUBLIC_APP_UI_VERSION === "v2" ? "Hoje" : "Escalas",
  },
  { id: "feed", href: "/feed", label: process.env.NEXT_PUBLIC_APP_UI_VERSION === "v2" ? "Comunidade" : "Feed" },
  {
    id: "admin",
    href: process.env.NEXT_PUBLIC_APP_UI_VERSION === "v2" ? "/admin-v2" : "/admin",
    label: process.env.NEXT_PUBLIC_APP_UI_VERSION === "v2" ? "Gestão" : "Admin",
    adminOnly: true,
  },
  {
    id: "perfil",
    href: process.env.NEXT_PUBLIC_APP_UI_VERSION === "v2" ? "/minha-area-v2/perfil" : "/minha-area/perfil",
    label: process.env.NEXT_PUBLIC_APP_UI_VERSION === "v2" ? "Eu" : "Perfil",
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

/**
 * Admin v2 — organized by job, not by legacy CRUD folders.
 * Fila = work queue · Ministério = leader workspace · Cultos = pastor gathering tool
 * Cuidar = visitors · Pessoas · Descobrir (dons/interesses) · Ajustes
 */
export const ADMIN_NAV_GROUPS_V2: AdminNavGroupV2[] = [
  {
    id: "trabalho",
    label: "Trabalho",
    items: [{ href: "/admin-v2", title: "Fila", icon: Home }],
  },
  {
    id: "cuidar",
    label: "Cuidar",
    items: [
      { href: "/admin-v2/visitantes", title: "Pessoas novas", icon: Users, acolhimento: true },
      { href: "/admin-v2/mensagens", title: "Mensagens", icon: MessageSquare, acolhimento: true },
    ],
  },
  {
    id: "igreja",
    label: "Igreja",
    items: [
      { href: "/admin-v2/membros", title: "Pessoas", icon: UserCog, roles: ["admin"] },
      { href: "/admin-v2/escalas", title: "Cultos", icon: ClipboardList, roles: ["admin"] },
      { href: "/admin-v2/eventos", title: "Calendário", icon: Calendar, roles: ["admin"] },
      { href: "/admin-v2/ministerios", title: "Ministérios", icon: Music, roles: ["admin"] },
    ],
  },
  {
    id: "descobrir",
    label: "Descobrir",
    items: [
      { href: "/admin-v2/dons-espirituais", title: "Dons", icon: Sparkles, roles: ["admin"] },
      { href: "/admin-v2/interesses", title: "Quem quer servir", icon: BookOpen, roles: ["admin"] },
    ],
  },
  {
    id: "ajustes",
    label: "Ajustes",
    items: [
      { href: "/admin-v2/configuracoes", title: "Configuração", icon: Settings, roles: ["admin"] },
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
