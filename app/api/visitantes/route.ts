import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { requireStaff } from "@/lib/authorization"

export async function GET(request: NextRequest) {
  const check = await requireStaff(request)
  if (!check.authorized) return check.response

  try {
    const rows = await sql`
      SELECT
        v.*,
        u.nome AS responsavel_nome
      FROM visitantes v
      LEFT JOIN users u ON v.user_id = u.id
      ORDER BY v.data_cadastro DESC
    `
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Erro ao buscar visitantes:", error)
    return NextResponse.json(
      { error: "Erro ao buscar visitantes" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nome,
      celular,
      sexo,
      cidade,
      cidade_outra,
      bairro,
      faixa_etaria,
      civil_status,
      membro_igreja,
      quer_visita,
      sem_whatsapp,
      responsavel_id,
    } = body

    if (!nome || !celular) {
      return NextResponse.json(
        { error: "Nome e celular sao obrigatorios" },
        { status: 400 }
      )
    }

    const rows = await sql`
      INSERT INTO visitantes (
        nome, celular, sexo, cidade, cidade_outra, bairro,
        faixa_etaria, civil_status, membro_igreja,
        quer_visita, sem_whatsapp, responsavel_id
      ) VALUES (
        ${nome}, ${celular}, ${sexo || null}, ${cidade || null},
        ${cidade_outra || null}, ${bairro || null}, ${faixa_etaria || null},
        ${civil_status || null},
        ${membro_igreja ?? false}, ${quer_visita ?? false},
        ${sem_whatsapp ?? false}, ${responsavel_id || null}
      )
      RETURNING *
    `

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error("Erro ao criar visitante:", error)
    return NextResponse.json(
      { error: "Erro ao criar visitante" },
      { status: 500 }
    )
  }
}
