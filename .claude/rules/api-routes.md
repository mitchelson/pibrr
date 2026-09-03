---
paths:
  - "app/api/**/*.ts"
---

# Regras para API Routes

- Sempre importar `auth` de `@/lib/auth` e verificar sessão
- Sempre importar `sql` de `@/lib/db` para queries
- Usar `NextResponse.json()` para respostas
- Tratar erros com try/catch, retornar status 500 com mensagem genérica
- Verificar role para rotas admin: `session.user.role !== "admin"`
- SQL sempre parameterizado via template literals
- Não expor stack traces ou dados internos na resposta
