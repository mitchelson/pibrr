import postgres from "postgres"

const sql = postgres(process.env.DATABASE_URL)

async function main() {
  console.log("=== Migration 008: ministerio_funcoes ===")

  await sql`
    CREATE TABLE IF NOT EXISTS ministerio_funcoes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ministerio_id UUID NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (ministerio_id, nome)
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_min_funcoes_ministerio ON ministerio_funcoes(ministerio_id)`
  console.log("ministerio_funcoes ok")

  console.log("=== Migration 008 finalizada ===")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
