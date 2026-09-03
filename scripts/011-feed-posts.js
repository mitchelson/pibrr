const postgres = require("postgres");
require("dotenv").config({ path: ".env.local" });

async function main() {
  const sql = postgres(process.env.DATABASE_URL);

  // 1. Campos extras em users
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS nascimento DATE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS data_batismo DATE`;
  console.log("✅ Campos bio, nascimento, data_batismo adicionados em users");

  // 2. Tabela feed_posts
  await sql`
    CREATE TABLE IF NOT EXISTS feed_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      autor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      conteudo TEXT,
      imagem_url TEXT,
      link TEXT,
      fixado BOOLEAN DEFAULT false,
      ativo BOOLEAN DEFAULT true,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_feed_posts_criado ON feed_posts(criado_em DESC)`;
  console.log("✅ Tabela feed_posts criada");

  // 3. Tabela feed_likes
  await sql`
    CREATE TABLE IF NOT EXISTS feed_likes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(post_id, user_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_feed_likes_post ON feed_likes(post_id)`;
  console.log("✅ Tabela feed_likes criada");

  // 4. Tabela feed_comments
  await sql`
    CREATE TABLE IF NOT EXISTS feed_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      conteudo TEXT NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON feed_comments(post_id)`;
  console.log("✅ Tabela feed_comments criada");

  console.log("\n🎉 Migration 011 concluída!");
}

main().catch(console.error);
