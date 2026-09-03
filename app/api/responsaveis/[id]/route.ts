import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __gestaoBff = await maybeProxyGestao(_request)
  if (__gestaoBff) return __gestaoBff

  try {
    const { id } = await params
    const rows = await sql`
      DELETE FROM responsaveis WHERE id = ${id} RETURNING id
    `

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Responsável não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao remover responsável:", error)
    return NextResponse.json(
      { error: "Erro ao remover responsável" },
      { status: 500 }
    )
  }
}
