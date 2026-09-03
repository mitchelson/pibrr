# Mapa de fluxos — App v2

Cada tela: **objetivo** · **como** · **porquê** · **nota (1–5)** · estado.

Nota atualizada após redesign definitivo (2026-09-03).

---

## Membro

| Tela | Objetivo | Como | Porquê | Nota |
|------|----------|------|--------|------|
| **Hoje** | Pendências + próximo culto | Inbox + rows → culto | Escaneável | **5** |
| **Culto** | Preparar-se para servir | Decisão → equipe → repertório | Página, não sheet | **5** |
| **Comunidade** | Vida além da escala | Feed DS mono (`feed-v2`) | Separado de servir | **5** |
| **Eu** | Identidade + servir | Seções Dados/Ministérios/Dons/Indispo/Conta | Sem stats IG | **5** |

## Gestão

| Tela | Objetivo | Nota |
|------|----------|------|
| **Fila** | Só ação | **5** |
| **Ministério [id]** | Pedidos → Escala → Time → Funções (scroll) | **5** |
| **Cultos** | Escalar por culto (chips + lista) | **5** |
| **Calendário** | Cultos + modelos mono | **4** |
| **Pessoas** | Lista + ficha roles mono | **4** |
| **Pessoas novas** | Sem FAB; CTA no hero | **5** |
| **Mensagens** | Templates planos | **4** |
| **Dons / Quem quer servir** | Ranking/lista mono | **4** |
| **Config** | Feed + acolhimento | **5** |

## Chrome

- Membro: desktop topbar ink; mobile dock (sem segundo sticky de logo)
- Gestão: drawer único — **sem** bottom tabs de membro; “← Voltar para Hoje”

## Regra

Uma tela = um job. Lista resume; detalhe decide. Mono + Sora. Sem `confirm()`, shadow, badge arco-íris, FAB.
