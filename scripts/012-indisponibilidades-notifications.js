const postgres = require("postgres");
require("dotenv").config({ path: ".env.local" });

async function main() {
  const sql = postgres(process.env.DATABASE_URL);

  // 1. Tabela de indisponibilidades
  await sql`
    CREATE TABLE IF NOT EXISTS user_indisponibilidades (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      data_inicio DATE NOT NULL,
      data_fim DATE NOT NULL,
      motivo TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_indisponibilidades_user ON user_indisponibilidades(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_indisponibilidades_datas ON user_indisponibilidades(data_inicio, data_fim)`;
  console.log("✅ Tabela user_indisponibilidades criada");

  // 2. Tabela de notificações
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tipo VARCHAR(50) NOT NULL,
      titulo TEXT NOT NULL,
      mensagem TEXT,
      lida BOOLEAN DEFAULT false,
      link TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, lida, criado_em DESC)`;
  console.log("✅ Tabela notifications criada");

  console.log("\n🎉 Migration 012 concluída!");
}

main().catch(console.error);
