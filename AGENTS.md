# AGENTS — pibrr (site institucional + gestão web + BFF)

Escopo superficial. Visão do workspace: `../AGENTS.md` e `../docs/`.

## O que é este projeto

Next.js 15: **landing institucional**, **painel de gestão** (escalas, ministérios, membros, visitantes, feed, etc.) e **BFF** em `app/api` que, com `FEATURE_FLAG_GESTAO_BFF=true`, proxya para a **gestao-api** (`https://gestao-api.pibrr.com/v1`).

- Mobile (`../pib-app`) e web (flag on) → **gestao-api** no mesmo Postgres VPS.
- NextAuth (Google) + `DATABASE_URL` no Vercel **permanecem** só para login (`lib/auth.ts`) até fase futura.
- Vendas/feijoada: **outro** projeto (`../vendas-pibrr`) — não misturar

## BFF (cutover web)

| Peça | Path / env |
|------|------------|
| Cliente | `lib/gestao-api.ts`, `lib/gestao-token.ts`, `lib/gestao-bff.ts`, `lib/gestao-ssr.ts` |
| Flag | `FEATURE_FLAG_GESTAO_BFF` (`true`/`1`/`on`) |
| Base URL | `GESTAO_API_URL` (default `https://gestao-api.pibrr.com`) |
| Keep local | `app/api/auth/[...nextauth]`, `auth/set-mode` |
| Rollback | flag `false` → handlers voltam ao SQL legado |

O BFF **emite JWT curto** (mesmo secret mobile/`AUTH_SECRET`) — o browser nunca chama a gestao-api direto.

## Foco atual do workspace

Prioridade é melhorar **vendas**. Aqui: manutenção e, quando pedido, **CTA/link na home** para o site da feijoada.

## Onde mexer (orientação)

| Área | Paths |
|------|-------|
| Landing | `app/page.tsx`, `app/home-landing.tsx`, páginas públicas |
| Gestão UI | `app/admin/**`, componentes de app |
| BFF / API | `app/api/**`, `lib/gestao-*.ts`, `lib/auth.ts` |

## Não fazer sem pedido explícito

- Remover `DATABASE_URL` / migrar OAuth para gestao-api
- Embutir checkout da feijoada neste Next
- Refactors grandes de permissões sem escopo claro

## Stack resumida

Next 15 · NextAuth · BFF → gestao-api · Postgres (VPS `pibrr_gestao`) · Firebase Admin · PWA · Tailwind/Radix
