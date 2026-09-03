# AGENTS — pibrr (site institucional + gestão web + API)

Escopo superficial. Visão do workspace: `../AGENTS.md` e `../docs/`.

## O que é este projeto

Next.js 15: **landing institucional**, **painel de gestão** (escalas, ministérios, membros, visitantes, feed, etc.) e **API Route Handlers** em `app/api` (backend acoplado).

- Mobile (`../pib-app`) consome a **gestao-api** (`https://gestao-api.pibrr.com`); o web ainda usa `app/api` + SQL direto.
- Vendas/feijoada: **outro** projeto (`../vendas-pibrr`) — não misturar

## Foco atual do workspace

Prioridade é melhorar **vendas**. Aqui: manutenção e, quando pedido, **CTA/link na home** para o site da feijoada.

Backend dedicado da igreja = **standby** (`../docs/03-arquitetura-alvo.md`).

## Onde mexer (orientação)

| Área | Paths |
|------|-------|
| Landing | `app/page.tsx`, `app/home-landing.tsx`, páginas públicas |
| Gestão UI | `app/admin/**`, componentes de app |
| API | `app/api/**`, `lib/**` (auth, permissions, db) |

## Não fazer sem pedido explícito

- Extrair `gestao-api`
- Embutir checkout da feijoada neste Next
- Refactors grandes de permissões sem escopo claro

## Stack resumida

Next 15 · NextAuth · Postgres (VPS `pibrr_gestao`) · Firebase Admin · PWA · Tailwind/Radix
