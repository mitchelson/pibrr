const postgres = require("postgres");
require("dotenv").config({ path: ".env.local" });

async function main() {
  const sql = postgres(process.env.DATABASE_URL);

  // 1. Tabela de modelos de evento (templates)
  await sql`
    CREATE TABLE IF NOT EXISTS evento_modelos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome TEXT NOT NULL UNIQUE,
      tipo TEXT DEFAULT 'Culto',
      horario TIME,
      descricao TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  console.log("✅ Tabela evento_modelos criada");

  // 2. Tabela de posições necessárias por evento+ministério
  await sql`
    CREATE TABLE IF NOT EXISTS evento_posicoes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
      modelo_id UUID REFERENCES evento_modelos(id) ON DELETE CASCADE,
      ministerio_id UUID NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
      funcao TEXT NOT NULL,
      quantidade INT NOT NULL DEFAULT 1,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
      CHECK (evento_id IS NOT NULL OR modelo_id IS NOT NULL)
    )
  `;
  console.log("✅ Tabela evento_posicoes criada");

  // 3. Adicionar modelo_id na tabela eventos
  await sql`
    ALTER TABLE eventos ADD COLUMN IF NOT EXISTS modelo_id UUID REFERENCES evento_modelos(id) ON DELETE SET NULL
  `;
  console.log("✅ Coluna modelo_id adicionada em eventos");

  // 4. Índices
  await sql`CREATE INDEX IF NOT EXISTS idx_evento_posicoes_evento ON evento_posicoes(evento_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_evento_posicoes_modelo ON evento_posicoes(modelo_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_evento_posicoes_ministerio ON evento_posicoes(ministerio_id)`;
  console.log("✅ Índices criados");

  console.log("\n🎉 Migration 010 concluída!");
}

main().catch(console.error);
