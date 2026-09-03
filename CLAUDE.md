# PIB - Sistema de Gestão da Primeira Igreja Batista

## Stack
- Next.js 15 (App Router) + React 19 + TypeScript
- PostgreSQL na VPS (`pibrr_gestao`) via `postgres` (`lib/db.ts`)
- NextAuth v5 (Google OAuth, JWT strategy)
- Tailwind CSS + Radix UI + shadcn/ui
- PWA com next-pwa + web-push notifications
- Deploy: Vercel

## Comandos
```bash
npm run dev      # servidor local
npm run build    # build de produção
npm run lint     # eslint
```

## Arquitetura
- `app/` — App Router (pages, layouts, API routes)
- `app/api/` — REST API routes (CRUD para cada entidade)
- `app/admin/` — Painel administrativo (admin, supervisor, lider)
- `app/minha-area/` — Área do membro logado
- `components/` — Componentes reutilizáveis + `components/ui/` (shadcn)
- `lib/` — Utilitários (auth, db, push, pdf, constants)
- `scripts/` — Migrações SQL numeradas (001-014)

## Banco de Dados
- Conexão: `import { sql } from "@/lib/db"` (tagged template)
- Queries: `` sql`SELECT * FROM users WHERE id = ${id}` ``
- Migrações em `scripts/` — executar no Postgres da VPS

## Autenticação
- NextAuth v5 em `lib/auth.ts`, middleware em `middleware.ts`
- Roles: `admin`, `supervisor`, `lider`, `membro`
- Session JWT com `userId`, `role`, `ministerioIds`

## Regras e Convenções
Regras detalhadas estão modularizadas em `.claude/rules/`:
- `rules/code-style.md` — Estilo de código e convenções gerais
- `rules/api-routes.md` — Padrões para API routes (carrega só em `app/api/`)
- `rules/ui-components.md` — Padrões de UI (carrega só em `app/` e `components/`)

## Skills Disponíveis
Skills em `.claude/skills/` são invocados automaticamente ou via comando:
- `/new-feature <desc>` — Workflow completo para implementar funcionalidade
- `/fix-bug <desc>` — Investigar e corrigir bugs
- `create-migration` — Guia para criar migrações SQL (auto-invocado)
- `create-api-route` — Padrões para novas API routes (auto-invocado)
- `create-admin-page` — Padrões para páginas admin (auto-invocado)

## Comandos Customizados
Comandos em `.claude/commands/` para workflows manuais:
- `/project:review` — Code review do diff atual vs main
- `/project:db-status` — Estado das migrações do banco
- `/project:deploy-check` — Verificar build + lint antes de deploy

## Agentes Especializados
Agentes em `.claude/agents/` para delegar tarefas complexas:
- `db-architect` — Modelagem de banco, migrações, performance SQL
- `ui-designer` — UI/UX, acessibilidade, responsividade
- `code-reviewer` — Segurança, performance, boas práticas

Use: "use o agente db-architect para..." ou "delegue ao code-reviewer..."

## Hooks de Segurança
Hook em `.claude/hooks/validate-bash.sh` bloqueia automaticamente:
- Comandos destrutivos (rm -rf, DROP TABLE, force push)
- Exposição de secrets (.env, passwords)

## Documentação Completa
Para detalhes de cada módulo, banco de dados e deploy: ver `DOCS.md`
