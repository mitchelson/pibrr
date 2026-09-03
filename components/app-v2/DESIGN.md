# Design system — App v2 (PIB Roraima)

Escopo: `/minha-area-v2`, `/admin-v2`, shells em `components/app-v2`.
Mapa de fluxos: [`FLOWS.md`](./FLOWS.md).

## Tema

Monocromático da marca (mesmo da feijoada / site): **preto `#0a0a0a`**, **branco**, **cinzas**. Sem ouro, azul ou roxo. Cor só em estado (pendente / ok / recusado).

## Tipografia

| Uso | Fonte |
|-----|--------|
| Tudo (UI + títulos) | **Sora** (`--pib-font`) — sans-serif |
| Kickers | Sora semibold + tracking largo |

Sem serifa no app. Fraunces fica só na landing institucional.

## Tokens fechados

Arquivo: `styles/app-v2-ds.css` · escopo `.pib-ds`

| Grupo | Tokens |
|-------|--------|
| Cor | `--pib-ink`, `--pib-paper`, `--pib-paper-raised`, `--pib-mute`, `--pib-chrome` |
| Borda | `--pib-border-width: 1px`, `--pib-line` `#e5e5e5`, `--pib-line-strong` |
| Radius | `xs 6` · `sm 8` · `md 12` · `lg 16` · `pill` |
| Espaço | `--pib-space-1` … `--pib-space-7` |
| Sombra | **nenhuma** — hierarquia por borda/fundo |

## Primitivos

`DsRoot` · `DsPage` · `DsHero` · `DsSection` · `DsPanel` · `DsList` · `DsRow` · `DsBtn` · `DsStatus` · `DsEmpty` · `DsCount` · `DsStatStrip` · `DsWell` · `DsAlertStrip` · `AdminScreen`

## Receita de página (admin)

Inspirada no painel Tá na Promo, adaptada ao mono:

1. **Eyebrow** (`pib-kicker`) → título pesado → subtítulo curto → **uma** CTA
2. **Stats** opcionais (`DsStatStrip`)
3. **Atenção** (`priority` / `DsAlertStrip`) antes do trabalho
4. **Trabalho** (`primary`) — lista ou formulário
5. **Contexto** quieto; config em accordion/details

Chrome: rail rebaixado (`--pib-paper-recessed`) + topbar frosted + conteúdo em `pib-page--admin`.

**Não copiar do TNP:** azul/gradiente, sombra ambient, Figtree, CTA glow, metáforas de loja/promo.

## Princípios

1. Trabalho primeiro — nav por job, não por pasta CRUD.
2. Uma tela = um job.
3. Lista resume; detalhe decide.
4. Mobile membro: dock; admin: drawer (sem dock).
