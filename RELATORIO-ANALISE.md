# Relatório Completo de Análise — Sistema PIB (Primeira Igreja Batista)

**Data:** 11 de maio de 2026  
**Versão:** 1.0  
**Stack:** Next.js 15 + React 19 + Neon PostgreSQL + NextAuth + Vercel  

---

## 1. Resumo Executivo

O sistema PIB é uma aplicação web/PWA para gestão eclesiástica da Primeira Igreja Batista de Roraima, cobrindo funcionalidades como gestão de visitantes, escalas de ministérios, eventos, mensagens, dons espirituais e área do membro.

### Números da Análise

| Métrica | Valor |
|---------|-------|
| API Routes analisadas | 35 |
| Rotas sem autenticação | **22 (63%)** |
| SQL Injection encontrados | 0 |
| Tabelas no banco | 18 |
| Tabelas sem migração | 3 |
| Componentes UI (shadcn) | 50 |
| Dependências problemáticas | 5 críticas |
| Lockfiles conflitantes | 3 |

### Avaliação Geral

| Área | Nota | Status |
|------|------|--------|
| Segurança | 3/10 | 🔴 Crítico |
| Arquitetura | 6/10 | 🟡 Adequado |
| Frontend/UX | 6/10 | 🟡 Adequado |
| Banco de Dados | 5/10 | 🟡 Precisa atenção |
| Performance | 7/10 | 🟢 Bom |
| Manutenibilidade | 5/10 | 🟡 Precisa atenção |

**Veredito:** O sistema é funcional e atende às necessidades básicas, mas possui **vulnerabilidades críticas de segurança** que devem ser corrigidas imediatamente antes de qualquer outra melhoria. A exposição de dados pessoais (visitantes, usuários) sem autenticação representa risco legal (LGPD) e operacional.

---

## 2. Pontos Positivos

### Segurança
- **Zero SQL Injection** — uso correto de tagged template literals (`sql\`...\``) que parametrizam automaticamente
- RBAC implementado no middleware com hierarquia clara: admin > supervisor > lider > membro
- Rotas sensíveis de usuário (`/me`, PUT/DELETE users) protegidas corretamente

### Arquitetura
- Estrutura de pastas segue convenções do Next.js App Router
- Separação clara entre componentes UI (shadcn) e componentes de domínio
- Middleware de autorização bem organizado com matcher otimizado
- PWA com service worker customizado e estratégias de cache diferenciadas
- Provider pattern bem aplicado (AuthSession, Theme)

### Frontend
- Server Components para data fetching + Client Components para interatividade
- `Promise.all()` para paralelizar queries nas páginas principais
- Design system consistente com shadcn/ui (50 componentes)
- Responsividade mobile-first adequada para PWA
- Elementos semânticos HTML (`nav`, `header`, `footer`, `main`, `section`)

### Banco de Dados
- UUIDs como PKs com `gen_random_uuid()`
- Constraints UNIQUE compostas bem aplicadas (evitam duplicatas)
- FKs com ON DELETE CASCADE/SET NULL conforme semântica correta
- Índices bem cobertos nas tabelas principais (14+ índices)
- JOINs adequados na maioria das queries (evitam N+1)
- Uso de `json_agg` para agregar dados relacionados em uma query

---

## 3. Pontos Negativos / Problemas Críticos

### 🔴 Severidade Crítica

**1. 63% das APIs sem autenticação**
- 22 de 35 rotas aceitam requests de qualquer pessoa na internet
- `GET /api/users` expõe TODOS os dados de usuários sem auth
- `GET /api/visitantes` expõe dados pessoais (nome, celular, cidade) — violação LGPD

**2. `typescript: { ignoreBuildErrors: true }` em produção**
- Arquivo: `next.config.js`
- Permite deploy com erros de tipo, mascarando bugs que só aparecem em runtime

**3. Dependências com `"latest"` em produção**
- `react-hook-form`, `@hookform/resolvers`, `zod` — podem quebrar a qualquer deploy

**4. Tabelas criadas em runtime (DDL inline)**
- `app/api/form-ministerios/route.ts` executa `CREATE TABLE IF NOT EXISTS` em cada request

### 🟡 Severidade Alta

**5. Rate limiting inexistente** — todas as 35 rotas vulneráveis a DoS/spam

**6. Error handling ausente no frontend** — queries sem try/catch crasham páginas inteiras

**7. 3 tabelas sem migração SQL** — `mensagem_categorias`, `mensagem_modelos`, `visitante_mensagens_enviadas`

**8. next-pwa abandonado** — último commit em 2022, incompatível oficialmente com Next.js 15

**9. 3 lockfiles simultâneos** — `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`

### 🟢 Severidade Moderada

**10. Validação de input ausente** — 12+ rotas aceitam dados sem validar formato/tipo

**11. Componentes monolíticos** — `home-landing.tsx` (18KB), `visitante-dialog.tsx` (22KB)

**12. Sem controle de versão de migrações** — impossível saber quais foram aplicadas

---

## 4. Segurança

### 4.1 Autenticação — Estado Atual

Das 35 API routes, apenas 13 verificam autenticação. O middleware protege rotas de **página** (`/admin/*`, `/minha-area/*`), mas **não protege rotas de API** — cada route handler é responsável por verificar auth individualmente, e a maioria não o faz.

**Rotas mais perigosas (exposição de dados pessoais sem auth):**

```
GET /api/users          → Retorna u.* (todos os campos de todos os usuários)
GET /api/visitantes     → Nome, celular, cidade de visitantes
GET /api/config         → Configuração completa da aplicação
GET /api/ministerios/[id] → Email dos membros
```

**Impacto LGPD:** A exposição de dados pessoais (nome, celular, email) sem autenticação configura violação da Lei Geral de Proteção de Dados. Qualquer pessoa com acesso à URL da API pode extrair todos os dados.

### 4.2 Validação de Input

Nenhuma rota usa Zod (apesar de ser dependência do projeto). Exemplos:

```typescript
// app/api/escalas/[id]/route.ts — aceita qualquer string como status
const { status } = await request.json()
await sql`UPDATE escalas SET status = ${status} WHERE id = ${id}`
// Deveria validar: z.enum(['pendente', 'confirmado', 'recusado'])

// app/api/users/route.ts — role sem validação (escalação de privilégios)
const { role } = await request.json()
await sql`UPDATE users SET role = ${role} WHERE id = ${id}`
// Deveria validar: z.enum(['admin', 'supervisor', 'lider', 'membro'])
```

### 4.3 Rate Limiting

**Ausente em 100% das rotas.** Rotas críticas sem proteção:

| Rota | Risco sem rate limit |
|------|---------------------|
| `POST /api/visitantes` | Spam de cadastros (sem auth) |
| `POST /api/escalas/notify` | Flood de push notifications |
| `POST /api/dons-espirituais` | DoS via processamento pesado |
| `POST /api/repertorio` | DoS via array sem limite de tamanho |

### 4.4 Headers de Segurança

Ausentes no `next.config.js`:
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options
- Permissions-Policy

### 4.5 Recomendação de Correção Imediata

```typescript
// middleware.ts — adicionar proteção global para APIs
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas de API que requerem auth (todas exceto auth/*)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  // ... resto do middleware existente
}
```

---

## 5. Arquitetura

### 5.1 Visão Geral

```
┌─────────────────────────────────────────────────┐
│                   Vercel Edge                     │
├─────────────────────────────────────────────────┤
│  Next.js 15 App Router                           │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Pages     │  │ API      │  │ Middleware   │ │
│  │ (SSR)     │  │ Routes   │  │ (Auth/RBAC)  │ │
│  └─────┬─────┘  └────┬─────┘  └──────────────┘ │
│        │              │                          │
│  ┌─────┴──────────────┴─────┐                   │
│  │     lib/neon.ts (HTTP)    │                   │
│  └───────────┬───────────────┘                   │
├──────────────┼──────────────────────────────────┤
│              ▼                                    │
│     Neon PostgreSQL (Serverless)                 │
└─────────────────────────────────────────────────┘
```

### 5.2 Pontos Fortes

- **App Router** bem utilizado com separação Server/Client Components
- **Middleware** com RBAC granular e matcher otimizado
- **PWA** com service worker, push notifications, e offline fallback
- **NextAuth v5** (beta) com Google provider e sessão JWT

### 5.3 Problemas Arquiteturais

**Ausência de camada de serviço/repositório:**
```
Atual:    Page/API Route → SQL direto (lib/neon)
Ideal:    Page/API Route → Service → Repository → SQL
```

Consequências:
- Queries SQL espalhadas por 35+ arquivos
- Impossível testar lógica de negócio isoladamente
- Duplicação de queries entre páginas e APIs

**`lib/auth.ts` com responsabilidades excessivas:**
- Configuração do NextAuth
- Criação de usuário no banco
- Migração de contas (merge de providers)
- Verificação de primeiro admin
- Queries SQL inline nos callbacks

**Dependências problemáticas:**

| Dependência | Problema | Alternativa |
|-------------|----------|-------------|
| `next-auth@5.0.0-beta.31` | Beta instável em produção | Aguardar GA ou usar v4 estável |
| `next-pwa@5.6.0` | Abandonado (2022) | `serwist` ou `@ducanh2912/next-pwa` |
| `react-hook-form@latest` | Pode quebrar sem aviso | Fixar versão (ex: `^7.54.0`) |
| `zod@latest` | Pode quebrar sem aviso | Fixar versão (ex: `^3.23.0`) |
| `@vercel/postgres@0.10.0` | Não usado (projeto usa Neon) | Remover |

### 5.4 Configuração Next.js — Flags Perigosas

```javascript
// next.config.js — REMOVER URGENTEMENTE:
module.exports = {
  eslint: { ignoreDuringBuilds: true },      // Esconde erros de lint
  typescript: { ignoreBuildErrors: true },    // Permite deploy com erros TS
  images: { unoptimized: true },             // Desabilita otimização
}
```

### 5.5 Inconsistências

- **3 lockfiles** (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`) — escolher um package manager
- **2 globals.css** (`app/globals.css` e `styles/globals.css`) — consolidar
- **2 drivers de DB** (`@neondatabase/serverless` e `@vercel/postgres`) — padronizar
- **Sem Server Actions** — usa API routes tradicionais (padrão antigo para Next.js 15)

---

## 6. Frontend / UX

### 6.1 Design System

O projeto usa **shadcn/ui** com 50 componentes Radix UI como base. Isso garante consistência visual e acessibilidade básica nos componentes primitivos. O tema suporta dark mode via `next-themes`.

### 6.2 Componentes — Problemas de Manutenibilidade

**Componentes monolíticos que precisam ser decompostos:**

| Arquivo | Tamanho | Problema |
|---------|---------|----------|
| `components/visitante-dialog.tsx` | 22KB | Dialog com formulário, validação, e lógica de estado — tudo junto |
| `app/home-landing.tsx` | 18KB (~500 linhas) | Landing page inteira em um componente com dados hardcoded |
| `components/novo-visitante-dialog.tsx` | 16KB | Similar ao visitante-dialog |

**Tipagem fraca — uso extensivo de `any`:**
```typescript
// app/minha-area/page.tsx — padrão recorrente
{eventos.map((ev: any) => (
  <EscalaCard key={ev.id} escala={ev} />
))}

// Deveria ser:
interface Evento { id: string; titulo: string; data: string; ... }
{eventos.map((ev: Evento) => (
  <EscalaCard key={ev.id} escala={ev} />
))}
```

### 6.3 Error Handling — Praticamente Inexistente

```typescript
// app/admin/page.tsx — ATUAL (crash se qualquer query falhar)
const [visitantes, escalas, ministerios, eventos] = await Promise.all([
  sql`SELECT count(*) as total FROM visitantes`,
  sql`SELECT ...`,
  sql`SELECT ...`,
  sql`SELECT ...`,
])

// RECOMENDADO
try {
  const [visitantes, escalas, ministerios, eventos] = await Promise.all([...])
} catch (error) {
  console.error('Erro ao carregar dashboard:', error)
  return <ErrorFallback message="Erro ao carregar dados" />
}
```

**Arquivos `error.tsx` ausentes** em `app/admin/` e `app/minha-area/` — sem error boundaries por segmento.

**Acesso inseguro a dados:**
```typescript
// app/admin/page.tsx — assume que query retorna resultado
const total = visitantesCount[0].total  // CRASH se array vazio
// Deveria ser: visitantesCount[0]?.total ?? 0
```

### 6.4 Loading States

- `app/admin/loading.tsx` existe mas exporta `() => null` (não mostra nada)
- `app/minha-area/` não tem `loading.tsx`
- Nenhuma página usa `<Suspense>` para streaming parcial
- Resultado: tela em branco durante carregamento de dados

### 6.5 Acessibilidade

**Problemas identificados:**

| Local | Problema | WCAG |
|-------|----------|------|
| `home-landing.tsx` | `text-gray-400` sobre `bg-[#0a0a0a]` — contraste insuficiente | 1.4.3 (AA) |
| `home-landing.tsx` | Bottom nav usa emojis sem `aria-label` | 1.1.1 |
| `home-landing.tsx` | Falta skip-to-content link | 2.4.1 |
| `admin/page.tsx` | Cards clicáveis sem `aria-label` descritivo | 4.1.2 |
| `admin/page.tsx` | Status badges diferenciam apenas por cor | 1.4.1 |

### 6.6 Responsividade

Bem implementada no geral (mobile-first para PWA), com um gap:
- **Landing page mobile**: navbar desktop esconde links que o bottom nav não replica (ex: "Quem Somos", "Pregações")
- **Solução**: adicionar menu hamburger mobile ou garantir que bottom nav tenha todos os links

### 6.7 Código Duplicado

```typescript
// Duplicado em admin-sidebar.tsx E header.tsx:
const fetcher = (url: string) => fetch(url).then(r => r.json())

// Duplicado em 4+ arquivos:
new Date(ev.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })

// Solução: lib/utils.ts
export const fetcher = (url: string) => fetch(url).then(r => r.json())
export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" })
```

---

## 7. Banco de Dados

### 7.1 Schema — 18 Tabelas

```
users ─────────────┐
                   ├── ministerio_membros
ministerios ───────┘
     │
     ├── ministerio_funcoes
     ├── ministerio_form_respostas (criada inline!)
     │
eventos ───────────┬── escalas (users + ministerios + eventos)
     │             └── evento_posicoes
     └── evento_modelos
          └── evento_posicoes

visitantes ────────── responsaveis (REDUNDANTE com users)
     └── visitante_mensagens_enviadas (SEM MIGRAÇÃO)

mensagem_categorias (SEM MIGRAÇÃO)
     └── mensagem_modelos (SEM MIGRAÇÃO)

push_subscriptions ── users
user_gift_results ─── users
repertorio_items ──── eventos
app_config
```

### 7.2 Problemas Críticos de Schema

**Tabela `responsaveis` redundante:**
```sql
-- visitantes tem DOIS campos para o mesmo conceito:
responsavel_id UUID REFERENCES responsaveis(id)  -- legado
user_id UUID REFERENCES users(id)                -- novo

-- Migração 008 já migrou responsáveis → users
-- Migração 011 copiou responsaveis.user_id → visitantes.user_id
-- MAS responsavel_id ainda existe e é usado em código
```

**3 tabelas sem DDL registrado:**
- `mensagem_categorias` — usada em `app/api/mensagens/categorias/`
- `mensagem_modelos` — usada em `app/api/mensagens/modelos/`
- `visitante_mensagens_enviadas` — usada em `app/api/mensagens/enviadas/`

Provavelmente criadas manualmente no console do Neon. Risco: impossível recriar o banco do zero.

### 7.3 Migrações — Qualidade 4/10

**Problemas:**
- Numeração com gaps (001, 008-014) e colisões (três arquivos `010-*`)
- Sem tabela `schema_migrations` — impossível saber estado atual
- Sem scripts DOWN (rollback)
- Sem ferramenta de migração (Drizzle, Prisma, node-pg-migrate)
- `008-migracao-completa.sql` mistura DDL + DML (INSERT + loops PL/pgSQL)

**DDL executado em runtime (anti-pattern grave):**
```typescript
// app/api/form-ministerios/route.ts — EXECUTADO EM CADA REQUEST
export async function POST(request: Request) {
  await sql`CREATE TABLE IF NOT EXISTS ministerio_form_respostas (...)`
  await sql`DO $$ BEGIN IF NOT EXISTS (...) THEN ALTER TABLE ... END IF; END $$`
  // ... lógica real da rota
}
```

### 7.4 Constraints Ausentes

```sql
-- Deveria existir:
ALTER TABLE users ADD CONSTRAINT chk_role
  CHECK (role IN ('admin', 'supervisor', 'lider', 'membro'));

ALTER TABLE escalas ADD CONSTRAINT chk_status
  CHECK (status IN ('pendente', 'confirmado', 'recusado'));

ALTER TABLE visitantes ADD CONSTRAINT chk_sexo
  CHECK (sexo IN ('M', 'F') OR sexo IS NULL);
```

### 7.5 Índices Recomendados

```sql
-- Queries de notificação filtram por evento + ministério
CREATE INDEX idx_escalas_evento_ministerio ON escalas(evento_id, ministerio_id);

-- Queries de conflito filtram por user + ministério
CREATE INDEX idx_escalas_user_ministerio ON escalas(user_id, ministerio_id);

-- Pendências de mensagens fazem JOIN por visitante_id
CREATE INDEX idx_visit_msg_enviadas_visitante ON visitante_mensagens_enviadas(visitante_id);
```

### 7.6 Conexão com Banco

```typescript
// lib/neon.ts — implementação atual
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL || 'postgresql://noop:noop@localhost/noop')
export { sql }
```

**Adequado para o caso de uso** (Neon HTTP driver é recomendado para serverless), mas falta:
- `fetchConnectionCache: true` para reutilizar conexões
- Validação fail-fast se `DATABASE_URL` ausente
- Timeout explícito

**Inconsistência:** `app/api/visitantes/mensagens-status/route.ts` usa `@vercel/postgres` enquanto todo o resto usa `@/lib/db`.

---

## 8. Performance

### 8.1 Pontos Fortes

- **Queries paralelas** com `Promise.all()` nas páginas principais (admin, minha-area)
- **JOINs bem construídos** — maioria das queries evita N+1 com `json_agg` e LEFT JOINs
- **Service Worker** com estratégias adequadas:
  - `NetworkFirst` para APIs (dados frescos)
  - `StaleWhileRevalidate` para assets estáticos (velocidade)
- **Imagem hero** com `priority` (LCP otimizado)
- **iframe do mapa** com `loading="lazy"`
- **SWR** com `refreshInterval: 30000` para dados dinâmicos na sidebar

### 8.2 Problemas Identificados

**N+1 no POST /api/escalas (5-6 queries por request):**
```typescript
// Atual: 6 queries sequenciais
const evento = await sql`SELECT data FROM eventos WHERE id = ${evento_id}`
const conflitos = await sql`SELECT ... JOIN ... WHERE ...`
const user = await sql`SELECT permite_escala_multipla FROM users WHERE id = ${user_id}`
await sql`INSERT INTO escalas ...`
const ministerio = await sql`SELECT nome FROM ministerios WHERE id = ${ministerio_id}`
const eventoInfo = await sql`SELECT titulo, data FROM eventos WHERE id = ${evento_id}`

// Otimizado: 3 queries
const [contexto] = await sql`
  SELECT e.data, e.titulo, m.nome as ministerio_nome, u.permite_escala_multipla
  FROM eventos e, ministerios m, users u
  WHERE e.id = ${evento_id} AND m.id = ${ministerio_id} AND u.id = ${user_id}`
const conflitos = await sql`SELECT ... JOIN ... WHERE ...`
await sql`INSERT INTO escalas ...`
```

**DDL em cada request (form-ministerios):**
- 2 queries DDL (`CREATE TABLE IF NOT EXISTS` + `ALTER TABLE`) executadas antes da lógica real
- Overhead: ~50-100ms por request desnecessariamente

**SWR sem otimização no header:**
```typescript
// header.tsx — fetch em TODA navegação
const { data: config } = useSWR('/api/config', fetcher)

// Otimizado:
const { data: config } = useSWR('/api/config', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60000,
})
```

**Imagens externas sem placeholder:**
```tsx
// home-landing.tsx — causa layout shift (CLS)
<Image src="https://images.unsplash.com/..." alt="Culto" fill />

// Com placeholder (reduz CLS):
<Image src="..." alt="Culto" fill placeholder="blur" blurDataURL="data:image/..." />
```

**Otimização de imagens desabilitada:**
- `images: { unoptimized: true }` no `next.config.js` desabilita WebP/AVIF automático
- Todas as imagens servidas no formato original (maior tamanho)

### 8.3 Métricas Estimadas de Impacto

| Problema | Impacto estimado | Páginas afetadas |
|----------|-----------------|------------------|
| DDL em cada request | +50-100ms/req | form-ministerios |
| N+1 no POST escalas | +150-300ms/req | Criação de escala |
| SWR sem dedup | Requests duplicados | Todas (header) |
| Imagens não otimizadas | +200-500KB/página | Landing page |
| Sem Suspense/streaming | TTFB alto em páginas com muitas queries | admin, minha-area |

---

## 9. Recomendações Prioritárias (por urgência)

### 🔴 URGENTE (fazer esta semana)

**1. Proteger APIs com autenticação global**
- Impacto: Exposição de dados pessoais (LGPD), manipulação de dados por terceiros
- Ação: Adicionar verificação de auth no middleware para `/api/*` ou em cada route handler
- Esforço: 2-4 horas

**2. Proteger `GET /api/users` imediatamente**
- Impacto: Lista completa de usuários com email/telefone acessível publicamente
- Ação: Adicionar `const session = await auth(); if (!session) return 401`
- Esforço: 15 minutos

**3. Remover `typescript: { ignoreBuildErrors: true }`**
- Impacto: Bugs de tipo em produção, comportamento imprevisível
- Ação: Remover flag, corrigir erros TS (pode levar tempo dependendo da quantidade)
- Esforço: 4-16 horas (depende dos erros)

### 🟠 ALTA (fazer em 1-2 semanas)

**4. Fixar versões de dependências (`latest` → versão específica)**
```json
{
  "react-hook-form": "^7.54.0",
  "@hookform/resolvers": "^3.9.0",
  "zod": "^3.23.8"
}
```
- Esforço: 30 minutos

**5. Implementar rate limiting**
- Usar `@upstash/ratelimit` com Redis ou Vercel KV
- Priorizar: POST /api/visitantes, POST /api/escalas/notify, POST /api/dons-espirituais
- Esforço: 2-3 horas

**6. Adicionar error handling nas Server Components**
- Criar `error.tsx` em `app/admin/` e `app/minha-area/`
- Envolver queries em try/catch
- Esforço: 2-3 horas

**7. Adicionar validação com Zod em todas as APIs**
```typescript
// Exemplo para POST /api/escalas
import { z } from 'zod'
const schema = z.object({
  user_id: z.string().uuid(),
  evento_id: z.string().uuid(),
  ministerio_id: z.string().uuid(),
})
const body = schema.parse(await request.json())
```
- Esforço: 8-12 horas (35 rotas)

### 🟡 MÉDIA (fazer em 1 mês)

**8. Criar migrações para tabelas fantasma**
- Documentar DDL de `mensagem_categorias`, `mensagem_modelos`, `visitante_mensagens_enviadas`
- Mover `ministerio_form_respostas` de inline para script SQL
- Esforço: 2-3 horas

**9. Substituir `next-pwa` por alternativa mantida**
- Migrar para `serwist` ou `@ducanh2912/next-pwa`
- Esforço: 4-6 horas

**10. Escolher um package manager e limpar lockfiles**
- Manter apenas `pnpm-lock.yaml` (ou o escolhido)
- Deletar os outros dois
- Esforço: 30 minutos

**11. Adicionar CHECK constraints no banco**
```sql
ALTER TABLE users ADD CONSTRAINT chk_role CHECK (role IN ('admin','supervisor','lider','membro'));
ALTER TABLE escalas ADD CONSTRAINT chk_status CHECK (status IN ('pendente','confirmado','recusado'));
```
- Esforço: 1 hora

**12. Adicionar headers de segurança no next.config.js**
- Esforço: 1 hora

### 🟢 BAIXA (fazer em 2-3 meses)

**13. Adotar ferramenta de migração (Drizzle ORM recomendado)**

**14. Criar camada de serviço/repositório**

**15. Decompor componentes monolíticos**

**16. Implementar loading states (loading.tsx + Suspense)**

**17. Remover tabela `responsaveis` redundante**

**18. Migrar para Server Actions (Next.js 15 pattern)**

---

## 10. Roadmap de Melhorias

### Fase 1 — Segurança (Semanas 1-2)

```
┌─────────────────────────────────────────────┐
│ Sprint de Segurança                          │
├─────────────────────────────────────────────┤
│ ☐ Auth global em APIs (middleware)           │
│ ☐ Remover ignoreBuildErrors                  │
│ ☐ Fixar versões (latest → pinned)           │
│ ☐ Rate limiting (rotas críticas)            │
│ ☐ Headers de segurança (CSP, HSTS)          │
│ ☐ Validação Zod (rotas com dados sensíveis) │
└─────────────────────────────────────────────┘
```

**Entregável:** Todas as APIs protegidas, dados pessoais inacessíveis sem login.

### Fase 2 — Estabilidade (Semanas 3-4)

```
┌─────────────────────────────────────────────┐
│ Sprint de Estabilidade                       │
├─────────────────────────────────────────────┤
│ ☐ Error boundaries (error.tsx por segmento)  │
│ ☐ Loading states (loading.tsx + Suspense)    │
│ ☐ Corrigir erros TypeScript                  │
│ ☐ Remover @vercel/postgres (não usado)       │
│ ☐ Unificar package manager (1 lockfile)      │
│ ☐ Substituir next-pwa por serwist            │
└─────────────────────────────────────────────┘
```

**Entregável:** App não crasha em erros de DB, build limpo sem flags de escape.

### Fase 3 — Banco de Dados (Semanas 5-6)

```
┌─────────────────────────────────────────────┐
│ Sprint de Banco de Dados                     │
├─────────────────────────────────────────────┤
│ ☐ Documentar schema completo (todas tabelas) │
│ ☐ Criar migrações para tabelas fantasma      │
│ ☐ Adotar Drizzle ORM para migrações         │
│ ☐ Adicionar CHECK constraints                │
│ ☐ Remover DDL inline do código               │
│ ☐ Adicionar índices compostos                │
│ ☐ Planejar remoção de tabela responsaveis    │
└─────────────────────────────────────────────┘
```

**Entregável:** Schema documentado, migrações versionadas, constraints de integridade.

### Fase 4 — Arquitetura (Semanas 7-10)

```
┌─────────────────────────────────────────────┐
│ Sprint de Refatoração                        │
├─────────────────────────────────────────────┤
│ ☐ Criar camada services/ (user-service, etc) │
│ ☐ Criar camada repositories/ (queries SQL)   │
│ ☐ Extrair auth callbacks para user-service   │
│ ☐ Validação Zod em TODAS as rotas           │
│ ☐ Decompor componentes monolíticos           │
│ ☐ Extrair utils (fetcher, formatDate, etc)   │
│ ☐ Remover tipagem any → interfaces           │
└─────────────────────────────────────────────┘
```

**Entregável:** Código testável, manutenível, com separação clara de responsabilidades.

### Fase 5 — UX e Performance (Semanas 11-14)

```
┌─────────────────────────────────────────────┐
│ Sprint de UX/Performance                     │
├─────────────────────────────────────────────┤
│ ☐ Acessibilidade (contraste, aria, skip-link)│
│ ☐ Otimização de imagens (remover unoptimized)│
│ ☐ Suspense boundaries para streaming         │
│ ☐ Consolidar N+1 queries                     │
│ ☐ SWR com cache otimizado                    │
│ ☐ Server Actions (substituir API routes)     │
│ ☐ Testes automatizados (Jest + Testing Lib)  │
└─────────────────────────────────────────────┘
```

**Entregável:** App rápida, acessível, com testes automatizados.

---

## Conclusão

O sistema PIB é funcional e atende às necessidades operacionais da igreja, com uma base técnica razoável (Next.js 15, React 19, Neon, PWA). No entanto, a **segurança é o calcanhar de Aquiles**: 63% das APIs estão completamente expostas, incluindo dados pessoais protegidos pela LGPD.

A prioridade absoluta é a **Fase 1 (Segurança)**, que pode ser executada em 1-2 semanas e elimina os riscos mais graves. As fases subsequentes melhoram estabilidade, manutenibilidade e experiência do usuário de forma incremental.

**Investimento estimado total:** 14-20 semanas de desenvolvimento (1 desenvolvedor).
