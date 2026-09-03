---
name: create-migration
description: Criar nova migração SQL para o Postgres da VPS (pibrr_gestao)
---
# Criar Migração SQL

Ao criar uma nova migração em `scripts/`:

1. Numerar sequencialmente: `015-descricao.sql` (próximo número disponível)
2. Usar SQL padrão PostgreSQL
3. Incluir `IF NOT EXISTS` em CREATE TABLE/INDEX
4. Para alterações, usar `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
5. Incluir comentário no topo descrevendo a migração:
```sql
-- Migração: Descrição do que faz
-- Data: YYYY-MM-DD
```
6. Se necessário script JS para executar, criar `015-descricao.js`:
```javascript
const postgres = require("postgres")
const sql = postgres(process.env.DATABASE_URL)
async function main() { /* ... */ }
main().catch(console.error)
```
7. Testar no Postgres da VPS antes de commitar
