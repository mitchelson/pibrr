import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/mobile-auth"
import { maybeProxyGestao } from "@/lib/gestao-bff"


async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS ministerio_form_respostas (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      ministerios JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `
  await sql`
    DO $$ BEGIN
      IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'ministerio_form_respostas' AND column_name = 'user_id') = 'text' THEN
        ALTER TABLE ministerio_form_respostas DROP CONSTRAINT IF EXISTS ministerio_form_respostas_pkey;
        ALTER TABLE ministerio_form_respostas ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
        ALTER TABLE ministerio_form_respostas ADD PRIMARY KEY (user_id);
        ALTER TABLE ministerio_form_respostas ADD CONSTRAINT ministerio_form_respostas_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END $$;
  `
}

export async function GET(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  const session = await getSession(request)
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await ensureTable()
  const rows = await sql`SELECT ministerios FROM ministerio_form_respostas WHERE user_id = ${session.userId}::uuid`
  const raw = rows[0]?.ministerios ?? null
  const ministerios = typeof raw === "string" ? JSON.parse(raw) : raw
  return NextResponse.json({ ministerios })
}

export async function POST(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  const session = await getSession(request)
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { ministerios } = await request.json()
  if (!Array.isArray(ministerios) || ministerios.length === 0) {
    return NextResponse.json({ error: "Selecione ao menos um ministério" }, { status: 400 })
  }

  await ensureTable()

  await sql`
    INSERT INTO ministerio_form_respostas (user_id, ministerios, updated_at)
    VALUES (${session.userId}::uuid, ${JSON.stringify(ministerios)}, now())
    ON CONFLICT (user_id) DO UPDATE SET ministerios = ${JSON.stringify(ministerios)}, updated_at = now()
  `

  return NextResponse.json({ ok: true })
}
