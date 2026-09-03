import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()

    const sets: string[] = []
    const vals: unknown[] = []

    if (body.nome !== undefined) {
      sets.push("nome")
      vals.push(body.nome)
    }
    if (body.descricao !== undefined) {
      sets.push("descricao")
      vals.push(body.descricao)
    }
    if (body.ordem !== undefined) {
      sets.push("ordem")
      vals.push(body.ordem)
    }
    if (body.ativa !== undefined) {
      sets.push("ativa")
      vals.push(body.ativa)
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
    }

    // Build dynamic update - handle booleans properly
    let result
    if (sets.length === 1 && sets[0] === "ativa") {
      result = await sql`UPDATE mensagem_categorias SET ativa = ${body.ativa} WHERE id = ${id} RETURNING *`
    } else if (sets.length === 1 && sets[0] === "nome") {
      result = await sql`UPDATE mensagem_categorias SET nome = ${body.nome} WHERE id = ${id} RETURNING *`
    } else if (sets.length === 1 && sets[0] === "descricao") {
      result = await sql`UPDATE mensagem_categorias SET descricao = ${body.descricao} WHERE id = ${id} RETURNING *`
    } else if (sets.length === 1 && sets[0] === "ordem") {
      result = await sql`UPDATE mensagem_categorias SET ordem = ${body.ordem} WHERE id = ${id} RETURNING *`
    } else {
      // Multiple fields - handle each explicitly to avoid COALESCE issues with booleans
      result = await sql`
        UPDATE mensagem_categorias
        SET nome = CASE WHEN ${body.nome !== undefined} THEN ${body.nome} ELSE nome END,
            descricao = CASE WHEN ${body.descricao !== undefined} THEN ${body.descricao} ELSE descricao END,
            ordem = CASE WHEN ${body.ordem !== undefined} THEN ${body.ordem} ELSE ordem END,
            ativa = CASE WHEN ${body.ativa !== undefined} THEN ${body.ativa} ELSE ativa END
        WHERE id = ${id}
        RETURNING *
      `
    }

    if (result.length === 0) {
      return NextResponse.json({ error: "Categoria nao encontrada" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("Erro ao atualizar categoria:", msg, error)
    return NextResponse.json(
      { error: "Erro ao atualizar categoria", detail: msg },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await sql`DELETE FROM mensagem_modelos WHERE categoria_id = ${id}`
    await sql`DELETE FROM visitante_mensagens_enviadas WHERE categoria_id = ${id}`
    const result = await sql`DELETE FROM mensagem_categorias WHERE id = ${id} RETURNING id`
    if (result.length === 0) {
      return NextResponse.json({ error: "Categoria nao encontrada" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar categoria:", error)
    return NextResponse.json({ error: "Erro ao deletar categoria" }, { status: 500 })
  }
}
