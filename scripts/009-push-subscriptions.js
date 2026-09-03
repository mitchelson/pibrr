import postgres from "postgres"

const sql = postgres(process.env.DATABASE_URL)

async function main() {
  console.log("=== Migration 009: push_subscriptions ===")

  await sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_push_sub_user ON push_subscriptions(user_id)`

  console.log("push_subscriptions ok")
  console.log("=== Migration 009 finalizada ===")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
