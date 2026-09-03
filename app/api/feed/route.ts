import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/mobile-auth"

export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1")
  const limit = 20
  const offset = (page - 1) * limit

  const session = await getSession(request)
  const userId = session?.userId || null

  try {
    let posts
    if (userId) {
      posts = await sql`
        SELECT p.*, u.nome as autor_nome, u.foto_url as autor_foto,
          (SELECT count(*)::int FROM feed_likes WHERE post_id = p.id) as likes_count,
          (SELECT count(*)::int FROM feed_comments WHERE post_id = p.id) as comments_count,
          EXISTS(SELECT 1 FROM feed_likes WHERE post_id = p.id AND user_id = ${userId}) as liked
        FROM feed_posts p
        JOIN users u ON u.id = p.autor_id
        WHERE p.ativo = true
        ORDER BY p.fixado DESC, p.criado_em DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      posts = await sql`
        SELECT p.*, u.nome as autor_nome, u.foto_url as autor_foto,
          (SELECT count(*)::int FROM feed_likes WHERE post_id = p.id) as likes_count,
          (SELECT count(*)::int FROM feed_comments WHERE post_id = p.id) as comments_count,
          false as liked
        FROM feed_posts p
        JOIN users u ON u.id = p.autor_id
        WHERE p.ativo = true
        ORDER BY p.fixado DESC, p.criado_em DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    const total = await sql`SELECT count(*)::int as total FROM feed_posts WHERE ativo = true`
    return NextResponse.json({ posts, total: total[0].total, page, pages: Math.ceil(total[0].total / limit) })
  } catch (error: any) {
    console.error("Erro ao buscar feed:", error)
    return NextResponse.json({ posts: [], total: 0, page: 1, pages: 0 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const role = session.role
  if (role !== "admin" && role !== "lider" && role !== "supervisor") {
    return NextResponse.json({ error: "Sem permissão para postar" }, { status: 403 })
  }

  const userId = session.userId
  const { conteudo, imagem_url, link, ministerio_ids, user_ids } = await request.json()
  if (!conteudo && !imagem_url) return NextResponse.json({ error: "Conteúdo ou imagem obrigatório" }, { status: 400 })

  try {
    const mencoesMin = ministerio_ids?.length > 0 ? JSON.stringify(ministerio_ids) : null
    const mencoesUsers = user_ids?.length > 0 ? JSON.stringify(user_ids) : null

    const rows = await sql`
      INSERT INTO feed_posts (autor_id, conteudo, imagem_url, link, mencoes_ministerios, mencoes_users)
      VALUES (${userId}, ${conteudo || null}, ${imagem_url || null}, ${link || null}, ${mencoesMin}::jsonb, ${mencoesUsers}::jsonb)
      RETURNING *
    `
    const postId = rows[0].id

    if (ministerio_ids?.length > 0) {
      for (const minId of ministerio_ids) {
        const membros = await sql`
          SELECT user_id FROM ministerio_membros WHERE ministerio_id = ${minId} AND pendente = false AND user_id != ${userId}
        `
        const min = await sql`SELECT nome FROM ministerios WHERE id = ${minId}`
        const titulo = `${min[0]?.nome} foi mencionado`
        const msg = conteudo?.substring(0, 80) || "Nova postagem"
        for (const m of membros) {
          await sql`
            INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
            VALUES (${m.user_id}, 'feed_mencao', ${titulo}, ${msg}, '/feed')
          `
        }
      }
    }

    if (user_ids?.length > 0) {
      const msg = conteudo?.substring(0, 80) || "Nova postagem"
      for (const uid of user_ids) {
        if (uid === userId) continue
        await sql`
          INSERT INTO notifications (user_id, tipo, titulo, mensagem, link)
          VALUES (${uid}, 'feed_mencao', ${"Você foi mencionado em uma postagem"}, ${msg}, '/feed')
        `
      }
    }

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error: any) {
    console.error("Erro ao criar post:", error)
    return NextResponse.json({ error: error.message || "Erro ao criar post" }, { status: 500 })
  }
}
