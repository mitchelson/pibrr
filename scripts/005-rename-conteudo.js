import postgres from "postgres"
const sql = postgres(process.env.DATABASE_URL);

async function main() {
  await sql`ALTER TABLE mensagem_modelos RENAME COLUMN conteudo TO corpo`;
  console.log("Renamed column conteudo -> corpo");
}

main().catch(console.error);
