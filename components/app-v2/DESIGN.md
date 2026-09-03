# Design system — App v2 (PIB Roraima)

Escopo: `/minha-area`, `/admin`, shells em `components/app-v2`.
Mapa de fluxos: [`FLOWS.md`](./FLOWS.md).

## Tema

Base monocromática da marca: **preto `#0a0a0a`**, **branco**, **cinzas**.

**Tertiary (acento):** vermelho `#c62828` — forte, legível em branco (~WCAG AA). Uso **escasso**: atenção, CTA de confirmação de escala, contagens da fila, faixa do banner de preview.

Estados semânticos continuam separados: pendente (âmbar) / ok (verde) / recusado (vermelho de status `#991b1b` ≠ tertiary de marca).

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
| Tertiary | `--pib-tertiary` `#c62828`, `--pib-tertiary-soft`, `--pib-tertiary-fg` |
| Borda | `--pib-border-width: 1px`, `--pib-line` `#e5e5e5`, `--pib-line-strong` |
| Radius | `xs 6` · `sm 8` · `md 12` · `lg 16` · `pill` |
| Espaço | `--pib-space-1` … `--pib-space-7` |
| Sombra | **nenhuma** — hierarquia por borda/fundo |

### Onde usar tertiary

1. Seção `priority` (borda esquerda)
2. `DsAlertStrip` / faixa de atenção
3. Botão `variant="tertiary"` — só decisões críticas (ex.: confirmar escala)
4. `DsCount` na fila de gestão
5. Detalhe no banner “versão nova”

**Não** usar em nav, dock, botões primários genéricos, nem substituir estados ok/pendente.

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
