import postgres from "postgres"

const sql = postgres(process.env.DATABASE_URL);

async function migrate() {
  console.log("Adding msg_segunda and msg_sabado columns...");

  await sql`ALTER TABLE visitantes ADD COLUMN IF NOT EXISTS msg_segunda BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE visitantes ADD COLUMN IF NOT EXISTS msg_sabado BOOLEAN DEFAULT FALSE`;

  console.log("Migrating mensagem_enviada data to msg_segunda...");
  await sql`UPDATE visitantes SET msg_segunda = mensagem_enviada WHERE mensagem_enviada = TRUE`;

  console.log("Dropping telefone column...");
  await sql`ALTER TABLE visitantes DROP COLUMN IF EXISTS telefone`;

  console.log("Dropping old mensagem_enviada column...");
  await sql`ALTER TABLE visitantes DROP COLUMN IF EXISTS mensagem_enviada`;

  console.log("Migration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
