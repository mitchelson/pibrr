# Implementation Plan: Redesign definitivo App v2 (PIB RR)

**Specification link:** feedback do produto + [`FLOWS.md`](./FLOWS.md) + [`DESIGN.md`](./DESIGN.md) + auditoria de telas (2026-09-03).  
**Escopo:** apenas `minha-area-v2`, `admin-v2`, `components/app-v2`, `styles/app-v2-ds.css`, e `/feed` quando cookie/env = v2. **v1 intacto.**

---

## Overview

A v2 ainda mistura design system novo com UI shadcn/Instagram do v1 (cards com sombra, FABs, badges coloridos, tabs densas, chrome duplo no admin). O plano fecha o visual e o fluxo **de forma definitiva**: um único idioma visual (mono + Sora), um job por tela, e remoção sistemática de leftovers.

Critério de pronto: nenhuma rota `*-v2` / feed-v2 usa `confirm()`, `shadow-*`, Badge arco-íris, `bg-primary/10` como destaque, Card shadcn sem skin DS, nem FAB. Admin mobile não mostra dock de membro + sidebar ao mesmo tempo.

---

## Technical Approach

1. **Congelar DS** — tokens únicos; primitivos novos (`DsTabs`, `DsChip`, `DsDialog`, `DsFab`→nada); `RoleBadgesV2` monocromático.
2. **Chrome** — member: um topbar OU dock (não os dois competindo); admin: drawer próprio **sem** `BottomTabBarV2`.
3. **Rescrever telas por severidade** — 5 → 4 → 3; páginas “boas” só recebem polish.
4. **Ícones de ministério** — no app v2, ícone sempre ink (ignorar `cor` ou forçar `#0a0a0a`).
5. **Sem backend breaking** — só UI/rotas novas opcionais (`/membros/[id]`); APIs atuais.

---

## Phases

### Phase 0 — Foundations (DS + chrome)
- [x] Congelar tokens em `styles/app-v2-ds.css`
- [x] `DsChip`, `DsConfirm`/`useDsConfirm`, `DsField`, `RoleBadgesV2`
- [x] Member chrome simplificado; admin sem `BottomTabBarV2`
- [x] Sidebar mono + RoleBadgesV2

### Phase 1 — Severity 5
- [x] Comunidade `feed-v2.tsx`
- [x] Cultos pastor
- [x] Ministério `[id]` vertical

### Phase 2 — Severity 4
- [x] Eu, Calendário, Pessoas, Pessoas novas, Mensagens, Interesses

### Phase 3–4
- [x] Dons, catálogo, mono icons, FLOWS atualizado
- [x] QA: sem confirm/FAB/shadow nas rotas v2

---

## Dependencies

- Cookie `pibrr_ui` / `NEXT_PUBLIC_APP_UI_VERSION` já existentes
- APIs atuais (inbox, escalas, visitantes auth) — sem migração DB
- Notion/auth opcional para tracking de tasks
- Aprovação visual rápida após Phase 0 (tokens) antes de reescrever 5s

---

## Risks

| Risk | Mitigation |
|------|------------|
| Escopo grande / regressão em líder | Entregar por fase; testar com conta líder + admin |
| Feed compartilhado v1/v2 | Branch UI só quando `version === "v2"`; v1 path intocado |
| Dialogs visitante compartilhados | Wrapper DS ou cópia `visitante-dialog-v2` |
| Remover dock no admin confunde | CTA claro “Voltar para Hoje” no rail |
| Color picker ministério | Guardar `cor` no DB mas renderizar ink no v2 |

---

## Acceptance criteria

1. Em mobile admin, **não** existe bottom tab de membro.
2. Nenhuma tela v2 usa `window.confirm` ou `shadow-*`.
3. Nenhum badge azul/roxo/teal/amber de papel; só `DsStatus` / chip mono.
4. Feed v2 não parece feed Instagram (sem card com sombra, sem coração vermelho).
5. Ministério do líder: um scroll com pedidos + escala do culto sem tabs obrigatórias.
6. v1 (`/minha-area`, `/admin`) visualmente idêntico ao pré-plano.

---

## Suggested task order (executável)

1. Phase 0 chrome + DS primitives  
2. Feed v2  
3. admin escalas + ministerios/[id]  
4. perfil + eventos + membros + visitantes + mensagens + interesses  
5. dons + polish + QA  
