import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL || 'postgresql://noop:noop@localhost/noop'

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set — database queries will fail at runtime')
}

type SqlClient = ReturnType<typeof postgres>

declare global {
  // eslint-disable-next-line no-var
  var __pibrrSql: SqlClient | undefined
}

function createSql(): SqlClient {
  return postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 30,
    prepare: false,
  })
}

const sql: SqlClient = globalThis.__pibrrSql ?? createSql()
globalThis.__pibrrSql = sql

export { sql }
