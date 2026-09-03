import postgres from "postgres"

const sql = postgres(process.env.DATABASE_URL)

async function migrate() {
  console.log('Creating responsaveis table...')
  await sql`
    CREATE TABLE IF NOT EXISTS responsaveis (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome TEXT NOT NULL,
      criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `

  console.log('Creating visitantes table...')
  await sql`
    CREATE TABLE IF NOT EXISTS visitantes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome TEXT NOT NULL,
      celular TEXT NOT NULL,
      sexo TEXT,
      cidade TEXT,
      cidade_outra TEXT,
      bairro TEXT,
      faixa_etaria TEXT,
      civil_status TEXT,
      telefone TEXT,
      membro_igreja BOOLEAN DEFAULT FALSE,
      quer_visita BOOLEAN DEFAULT FALSE,
      data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      mensagem_enviada BOOLEAN DEFAULT FALSE,
      sem_whatsapp BOOLEAN DEFAULT FALSE,
      responsavel_id UUID REFERENCES responsaveis(id) ON DELETE SET NULL
    )
  `

  console.log('Creating indexes...')
  await sql`CREATE INDEX IF NOT EXISTS idx_visitantes_data_cadastro ON visitantes(data_cadastro DESC)`
  await sql`CREATE INDEX IF NOT EXISTS idx_visitantes_responsavel_id ON visitantes(responsavel_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_responsaveis_nome ON responsaveis(nome)`

  console.log('Migration complete!')
}

migrate().catch(console.error)
