import postgres from "postgres"

const sql = postgres(process.env.DATABASE_URL);

function slugify(nome) {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
}

async function main() {
  console.log("=== Migration 007: migrar responsaveis -> users + ministerio Integracao ===");

  // 1. Cria ministerio Integracao
  let integracaoId;
  const exist = await sql`SELECT id FROM ministerios WHERE nome = 'Integracao' LIMIT 1`;
  if (exist.length === 0) {
    const inserted = await sql`
      INSERT INTO ministerios (nome, descricao, cor, ordem)
      VALUES ('Integracao', 'Acompanhamento e envio de mensagens para visitantes', '#10b981', 1)
      RETURNING id
    `;
    integracaoId = inserted[0].id;
    console.log("ministerio Integracao criado:", integracaoId);
  } else {
    integracaoId = exist[0].id;
    console.log("ministerio Integracao ja existia:", integracaoId);
  }

  // 2. Para cada responsavel cria user (email placeholder ate o primeiro login) e vincula
  const responsaveis = await sql`SELECT id, nome FROM responsaveis ORDER BY nome`;
  console.log(`Encontrados ${responsaveis.length} responsaveis para migrar`);

  for (const r of responsaveis) {
    const slug = slugify(r.nome) || "pendente";
    const placeholderEmail = `pendente.${r.id.slice(0, 8)}.${slug}@pib-integracao.local`;

    // Idempotente: se ja existe user com esse email placeholder, reaproveita
    const existsUser = await sql`SELECT id FROM users WHERE email = ${placeholderEmail} LIMIT 1`;
    let userId;
    if (existsUser.length === 0) {
      const inserted = await sql`
        INSERT INTO users (email, nome, role, ativo)
        VALUES (${placeholderEmail}, ${r.nome}, 'membro', true)
        RETURNING id
      `;
      userId = inserted[0].id;
      console.log(`  + user criado para ${r.nome}: ${userId}`);
    } else {
      userId = existsUser[0].id;
      console.log(`  = user ja existia para ${r.nome}: ${userId}`);
    }

    // Vincula ao ministerio Integracao
    await sql`
      INSERT INTO ministerio_membros (ministerio_id, user_id, is_lider)
      VALUES (${integracaoId}, ${userId}, false)
      ON CONFLICT (ministerio_id, user_id) DO NOTHING
    `;

    // Espelha na coluna nova de visitantes (responsavel_id original continua intacto)
    await sql`
      UPDATE visitantes
      SET user_id = ${userId}
      WHERE responsavel_id = ${r.id} AND user_id IS NULL
    `;
  }

  console.log("=== Migration 007 finalizada ===");
  console.log(
    "Quando o responsavel fizer login via Google pela primeira vez, identifique-o manualmente em /admin/membros para unificar o email real."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
