import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/mobile-auth"

export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!["admin", "supervisor"].includes(session.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

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
  await sql`ALTER TABLE ministerios ADD COLUMN IF NOT EXISTS form_obrigatorio BOOLEAN DEFAULT false`

  const rows = await sql`
    SELECT mfr.user_id, mfr.ministerios, mfr.updated_at, u.nome, u.foto_url
    FROM ministerio_form_respostas mfr
    JOIN users u ON u.id = mfr.user_id
    ORDER BY mfr.updated_at DESC
  `

  const parsed = rows.map((r: any) => ({
    ...r,
    ministerios: typeof r.ministerios === "string" ? JSON.parse(r.ministerios) : r.ministerios,
  }))

  return NextResponse.json(parsed)
}
