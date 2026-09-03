# Mapa de fluxos — App v2

Cada tela: **objetivo** · **como** · **porquê** · **nota (1–5)** · **ideal**.

Nota = quão perto está do fluxo ideal hoje (5 = alinhado).

---

## Membro

| Tela | Objetivo | Como | Porquê | Nota | Ideal / próximo passo |
|------|----------|------|--------|------|------------------------|
| **Hoje** `/minha-area-v2` | Ver pendências e próximo culto | Inbox + lista resumo → culto | Escaneável; decisão não compete com equipe | **5** | Manter. Push continua aqui. |
| **Culto** `/culto/[id]` | Preparar-se para servir | Decisão → Com você → Outros → Repertório | Um culto = uma página | **5** | Manter. |
| **Inbox** (bloco) | Empurrar ação | Links para culto / troca / gestão | Não é tela; é fila | **4** | Trocas poderiam abrir modal inline no culto. |
| **Comunidade** `/feed` | Vida da igreja além da escala | Timeline + composer | Separado de “servir” | **3** | Aplicar DS (kicker Comunidade, lista sem card Instagram); sino só no shell. |
| **Eu** `/perfil` | Identidade + quero servir | Foto, papéis, ministérios, dons, indispo, sair | Uma porta para form-ministerios | **3** | Agrupar em seções DS; reduzir formulário inline. |

---

## Gestão — Trabalho

| Tela | Objetivo | Como | Porquê | Nota | Ideal / próximo passo |
|------|----------|------|--------|------|------------------------|
| **Fila** `/admin-v2` | Só o que exige ação | Contagens clicáveis + ministérios | Líder não precisa de KPI vanity | **5** | Manter. |
| **Ministério** `/ministerios/[id]` | Escalar e cuidar do time | Pedidos → membros → culto → escala | Tela principal do líder | **2** | Reordenar: (1) Pedidos (2) Escolher culto + vagas (3) Time. Tirar tabs densas; `confirm()` → AlertDialog. |
| **Ministérios** `/ministerios` | CRUD catálogo (admin) | Lista + criar | Admin estrutural, não dia a dia | **2** | Lista DS; criar em sheet; cor default ink. |

---

## Gestão — Cuidar

| Tela | Objetivo | Como | Porquê | Nota | Ideal / próximo passo |
|------|----------|------|--------|------|------------------------|
| **Pessoas novas** `/visitantes` | Follow-up de visitantes | Busca → por data → ficha; dots = categorias | Só acolhimento | **3** | Ficha: responsável = user da igreja; fluxo “próxima mensagem” em 1 toque. |
| **Mensagens** `/mensagens` | Templates WhatsApp | CRUD categorias | Conteúdo, não operação diária | **2** | Separar “editar templates” de “enviar”; deep-link a partir do visitante. |

---

## Gestão — Igreja

| Tela | Objetivo | Como | Porquê | Nota | Ideal / próximo passo |
|------|----------|------|--------|------|------------------------|
| **Cultos** `/escalas` | Escalar *por culto* (pastor) | Escolher evento → preencher todos os ministérios | Visão transversal ≠ tela do líder | **3** | Hero DS ok; após escolher culto, checklist de vagas vazias no topo. |
| **Calendário** `/eventos` | Criar cultos + modelos | CRUD + posições + repertório | Fonte dos cultos | **2** | Renomear UI para “Calendário”; fluxo: Novo culto → modelo → posições. AlertDialog. |
| **Pessoas** `/membros` | Papéis e ficha | Lista → drawer/dialog account_roles | Um modelo de papéis | **3** | Abrir ficha em página `/membros/[id]` (URL); seções Dados · Ministérios · Papéis. |

---

## Gestão — Descobrir / Ajustes

| Tela | Objetivo | Como | Porquê | Nota | Ideal / próximo passo |
|------|----------|------|--------|------|------------------------|
| **Dons** | Ver quem tem quais dons | Lista + ranking | Formação / convocação | **2** | Título DS; filtro por don; link “convidar ao ministério X”. |
| **Quem quer servir** | Ver interesses do form | Lista por pessoa/ministério | Pipeline de voluntários | **2** | Ação “adicionar ao ministério” na linha. |
| **Configuração** | Feed + acolhimento | Dois selects | Poucas chaves de produto | **4** | Manter enxuto. |

---

## Fluxo ideal (resumo)

```
Membro:  Hoje → Culto (decidir/preparar) → Comunidade / Eu
Líder:   Fila → Ministério (pedidos + culto) → [Cuidar se acolhimento]
Pastor:  Fila → Cultos (por evento) → Pessoas / Calendário
```

**Regra:** uma tela = um job. Lista resume; detalhe decide. Sem sheet genérico empilhando 4 jobs.
