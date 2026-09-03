const postgres = require("postgres");
require("dotenv").config({ path: ".env.local" });

async function main() {
  const sql = postgres(process.env.DATABASE_URL);

  await sql`
    CREATE TABLE IF NOT EXISTS escala_trocas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      solicitante_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      escala_solicitante_id UUID NOT NULL REFERENCES escalas(id) ON DELETE CASCADE,
      destinatario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      escala_destinatario_id UUID NOT NULL REFERENCES escalas(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'pendente',
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_escala_trocas_dest ON escala_trocas(destinatario_id, status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_escala_trocas_solic ON escala_trocas(solicitante_id, status)`;
  console.log("✅ Tabela escala_trocas criada");
  console.log("\n🎉 Migration 013 concluída!");
}

main().catch(console.error);
