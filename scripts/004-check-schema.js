import postgres from "postgres"

const sql = postgres(process.env.DATABASE_URL);

async function checkSchema() {
  try {
    // Check if tables exist
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('mensagem_categorias', 'mensagem_modelos', 'visitante_mensagens_enviadas')
    `;
    console.log("Tables found:", tables.map(t => t.table_name));

    // Check mensagem_categorias columns
    const catCols = await sql`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'mensagem_categorias' ORDER BY ordinal_position
    `;
    console.log("mensagem_categorias columns:", catCols);

    // Check data
    const categorias = await sql`SELECT * FROM mensagem_categorias`;
    console.log("Categorias count:", categorias.length);
    if (categorias.length > 0) console.log("First categoria:", categorias[0]);

    const modelos = await sql`SELECT count(*) as total FROM mensagem_modelos`;
    console.log("Modelos count:", modelos[0].total);

  } catch (err) {
    console.error("Error:", err.message);
  }
}

checkSchema();
