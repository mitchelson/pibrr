# Design system — App v2 (PIB Roraima)

Escopo: apenas `/minha-area-v2`, `/admin-v2` e shells em `components/app-v2`. O v1 permanece intacto.

## Princípios

1. **Trabalho primeiro** — navegação por o que a pessoa precisa fazer, não por pastas CRUD do sistema antigo.
2. **Marca forte** — logo/chrome em preto e branco (Sora + Fraunces). Cor só para estado (pendente / ok / recusado).
3. **Uma hierarquia** — kicker → título display → texto curto → lista de ações.
4. **Sem dashboard de vaidade** — Fila mostra só o que exige ação.
5. **Mobile com dock + drawer** — gestão nunca esconde o menu no celular.

## Tokens

Arquivo: `styles/app-v2-ds.css`, escopo `.pib-ds`.

| Token | Uso |
|---|---|
| `--pib-ink` / `--pib-paper` | Texto e fundo |
| `--pib-mute` | Secundário |
| `--pib-pending` / `--pib-ok` / `--pib-no` | Estados |
| `--pib-display` | Fraunces |
| `--pib-font` | Sora |

## Primitivos

`components/app-v2/ds/` — `DsRoot`, `DsPage`, `DsHero`, `DsSection`, `DsPanel`, `DsList`, `DsRow`, `DsBtn`, `DsStatus`, `DsEmpty`, `DsCount`.

Sempre envolver rotas v2 com `DsRoot` (via shells).

## IA do membro

| Aba | Job |
|---|---|
| **Hoje** | Inbox + próxima escala |
| **Comunidade** | Feed |
| **Gestão** | Staff → painel |
| **Eu** | Perfil e servir |

## IA da gestão

| Grupo | Job |
|---|---|
| **Ministério** (topo) | Escala/membros do líder |
| **Trabalho → Fila** | Pendências |
| **Cuidar** | Pessoas novas + mensagens |
| **Igreja** | Pessoas, cultos, calendário, ministérios |
| **Descobrir** | Dons + quem quer servir |
| **Ajustes** | Feed + acolhimento |

Não portar responsáveis legados nem menus legados.
