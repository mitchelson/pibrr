import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { getSession } from "@/lib/mobile-auth"
import { maybeProxyGestao } from "@/lib/gestao-bff"


export async function POST(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff

  const session = await getSession(request)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 })

  // Limitar a 5MB
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Arquivo muito grande (máx 5MB)" }, { status: 400 })

  const blob = await put(`feed/${Date.now()}-${file.name}`, file, { access: "public" })

  return NextResponse.json({ url: blob.url })
}
