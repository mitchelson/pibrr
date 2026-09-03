---
name: create-api-route
description: Criar nova API route seguindo os padrões do projeto
---
# Criar API Route

Ao criar uma nova API route em `app/api/`:

1. Criar arquivo `route.ts` no diretório adequado
2. Importar auth e sql:
```typescript
import { auth } from "@/lib/auth"
import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
```
3. Verificar autenticação:
```typescript
const session = await auth()
if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
```
4. Para rotas admin, verificar role:
```typescript
if (session.user.role !== "admin") return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
```
5. Usar SQL parameterizado via template literals
6. Retornar `NextResponse.json(data)` com status codes adequados
7. Tratar erros com try/catch e retornar status 500
