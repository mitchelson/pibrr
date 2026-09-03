"use client"

import React, { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import useSWR from "swr"
import { useSession } from "next-auth/react"
import { Heart, MessageCircle, Send, Trash2, ImagePlus, Loader2, Pin, Link2 } from "lucide-react"
import { MinistryIcon } from "@/components/ministry-icon"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { NotificationsButton } from "@/components/notifications-button"
import { UserProfileDialog } from "@/components/user-profile-dialog"
import { MemberShell } from "@/components/app-v2/member-shell"
import { useAppUi } from "@/hooks/use-app-ui"

const fetcher = (url: string) => fetch(url).then(r => r.json())

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "agora"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  return new Date(date).toLocaleDateString("pt-BR")
}

function PostMencoes({ ministerioIds, userIds }: { ministerioIds?: string[]; userIds?: string[] }) {
  const { data: ministerios } = useSWR("/api/ministerios", fetcher)
  const ids = typeof ministerioIds === "string" ? JSON.parse(ministerioIds) : ministerioIds
  const uids = typeof userIds === "string" ? JSON.parse(userIds) : userIds

  const { data: users } = useSWR(uids?.length ? "/api/users" : null, fetcher)

  return (
    <div className="px-4 pb-3 flex flex-wrap gap-1.5">
      {ids?.map((id: string) => {
        const m = ministerios?.find((x: any) => x.id === id)
        return m ? (
          <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs text-foreground font-medium">
            <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={12} />
            {m.nome}
          </span>
        ) : null
      })}
      {uids?.map((id: string) => {
        const u = users?.find((x: any) => x.id === id)
        return (
          <span key={id} className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600 font-medium">
            @{u?.nome?.split(" ")[0] || "membro"}
          </span>
        )
      })}
    </div>
  )
}

function PostCard({ post, session, mutate }: { post: any; session: any; mutate: () => void }) {
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { data: comments, mutate: mutateComments } = useSWR(showComments ? `/api/feed/${post.id}/comments` : null, fetcher)

  const handleLike = async () => {
    if (!session) { toast({ title: "Faça login para curtir" }); return }
    const method = post.liked ? "DELETE" : "POST"
    await fetch(`/api/feed/${post.id}/like`, { method })
    mutate()
  }

  const handleComment = async () => {
    if (!comment.trim()) return
    setSubmitting(true)
    await fetch(`/api/feed/${post.id}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conteudo: comment }),
    })
    setComment("")
    setSubmitting(false)
    mutateComments()
    mutate()
  }

  const handleDeleteComment = async (commentId: string) => {
    await fetch(`/api/feed/${post.id}/comments`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment_id: commentId }),
    })
    mutateComments()
    mutate()
  }

  const handleDelete = async () => {
    if (!confirm("Remover esta postagem?")) return
    await fetch(`/api/feed/${post.id}`, { method: "DELETE" })
    mutate()
  }

  const canDelete = session?.user?.role === "admin" || session?.user?.id === post.autor_id

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <UserProfileDialog userId={post.autor_id}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.autor_foto} />
            <AvatarFallback>{post.autor_nome?.[0]}</AvatarFallback>
          </Avatar>
        </UserProfileDialog>
        <div className="flex-1">
          <UserProfileDialog userId={post.autor_id}>
            <p className="font-semibold text-sm hover:underline">{post.autor_nome}</p>
          </UserProfileDialog>
          <p className="text-xs text-gray-500">{timeAgo(post.criado_em)}</p>
        </div>
        {post.fixado && <Pin className="h-4 w-4 text-primary" />}
        {canDelete && (
          <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 p-1">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {post.conteudo && <p className="px-4 pb-3 text-sm whitespace-pre-wrap">{post.conteudo}</p>}
      {post.link && (
        <a href={post.link} target="_blank" rel="noopener noreferrer" className="mx-4 mb-3 flex items-center gap-2 text-sm text-foreground bg-primary/10 rounded-lg px-3 py-2 hover:bg-primary/15 transition-colors truncate">
          <Link2 className="h-4 w-4 shrink-0" aria-hidden />
          {post.link.replace(/^https?:\/\//, "").split("/")[0]}
        </a>
      )}
      {(post.mencoes_ministerios || post.mencoes_users) && (
        <PostMencoes ministerioIds={post.mencoes_ministerios} userIds={post.mencoes_users} />
      )}
      {post.imagem_url && (
        <div className="relative w-full aspect-video">
          <Image src={post.imagem_url} alt="" fill className="object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3 border-t">
        <button onClick={handleLike} className="flex items-center gap-1 text-sm hover:text-red-500 transition-colors">
          <Heart className={`h-5 w-5 ${post.liked ? "fill-red-500 text-red-500" : ""}`} />
          <span>{post.likes_count || ""}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1 text-sm hover:text-blue-500 transition-colors">
          <MessageCircle className="h-5 w-5" />
          <span>{post.comments_count || ""}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t px-4 py-3 space-y-3 bg-gray-50">
          {comments?.map((c: any) => (
            <div key={c.id} className="flex gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={c.user_foto} />
                <AvatarFallback>{c.user_nome?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-white rounded-lg px-3 py-2 text-sm">
                <span className="font-semibold">{c.user_nome}</span>{" "}
                <span>{c.conteudo}</span>
              </div>
              {(session?.user?.role === "admin" || session?.user?.id === c.user_id) && (
                <button onClick={() => handleDeleteComment(c.id)} className="text-gray-400 hover:text-red-500 self-center">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {session && (
            <div className="flex gap-2">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escreva um comentário..."
                className="min-h-[36px] h-9 resize-none text-sm"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment() } }}
              />
              <Button size="sm" onClick={handleComment} disabled={submitting || !comment.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NewPostForm({ mutate }: { mutate: () => void }) {
  const [conteudo, setConteudo] = useState("")
  const [link, setLink] = useState("")
  const [uploading, setUploading] = useState(false)
  const [imagemUrl, setImagemUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [selectedMinisterios, setSelectedMinisterios] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showMencoes, setShowMencoes] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { data: ministerios } = useSWR("/api/ministerios", fetcher)
  const { data: users } = useSWR(showMencoes ? "/api/users" : null, fetcher)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: form })
    if (res.ok) {
      const { url } = await res.json()
      setImagemUrl(url)
    } else {
      const err = await res.json()
      toast({ title: err.error || "Erro no upload", variant: "destructive" })
    }
    setUploading(false)
  }

  const handleSubmit = async () => {
    if (!conteudo.trim() && !imagemUrl) return
    setSubmitting(true)
    const res = await fetch("/api/feed", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conteudo: conteudo.trim() || null,
        imagem_url: imagemUrl || null,
        link: link.trim() || null,
        ministerio_ids: selectedMinisterios.length > 0 ? selectedMinisterios : null,
        user_ids: selectedUsers.length > 0 ? selectedUsers : null,
      }),
    })
    if (res.ok) {
      setConteudo("")
      setImagemUrl("")
      setLink("")
      setSelectedMinisterios([])
      setSelectedUsers([])
      setShowMencoes(false)
      mutate()
    } else {
      const err = await res.json()
      toast({ title: err.error || "Erro ao postar", variant: "destructive" })
    }
    setSubmitting(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
      <Textarea
        value={conteudo}
        onChange={(e) => setConteudo(e.target.value)}
        placeholder="Compartilhe algo com a igreja..."
        className="min-h-[80px] resize-none"
      />
      {imagemUrl && (
        <div className="relative w-full h-48 rounded-lg overflow-hidden">
          <Image src={imagemUrl} alt="" fill className="object-cover" />
          <button onClick={() => setImagemUrl("")} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
      <input
        type="url"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="Link (opcional)"
        className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#c9a84c]">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            <span>Imagem</span>
          </button>
          <button onClick={() => setShowMencoes(!showMencoes)} className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#c9a84c]">
            <span className="text-lg">@</span>
            <span>Marcar</span>
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <Button onClick={handleSubmit} disabled={submitting || (!conteudo.trim() && !imagemUrl)}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          Publicar
        </Button>
      </div>

      {/* Menções selecionadas */}
      {(selectedMinisterios.length > 0 || selectedUsers.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {selectedMinisterios.map((id) => {
            const m = ministerios?.find((x: any) => x.id === id)
            return m ? (
              <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-xs text-blue-700">
                <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={12} />
                {m.nome}
                <button onClick={() => setSelectedMinisterios(s => s.filter(x => x !== id))} className="text-blue-400 hover:text-blue-700">×</button>
              </span>
            ) : null
          })}
          {selectedUsers.map((id) => {
            const u = users?.find((x: any) => x.id === id)
            return u ? (
              <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-xs">
                @{u.nome?.split(" ")[0]}
                <button onClick={() => setSelectedUsers(s => s.filter(x => x !== id))} className="text-gray-400 hover:text-gray-700">×</button>
              </span>
            ) : null
          })}
        </div>
      )}

      {/* Painel de menções */}
      {showMencoes && (
        <div className="border rounded-lg p-3 space-y-3 max-h-48 overflow-y-auto">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1.5">Ministérios</p>
            <div className="flex flex-wrap gap-1.5">
              {ministerios?.filter((m: any) => m.ativo).map((m: any) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMinisterios(s => s.includes(m.id) ? s.filter(x => x !== m.id) : [...s, m.id])}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${selectedMinisterios.includes(m.id) ? "bg-blue-100 border-blue-300 text-blue-700" : "bg-white border-gray-200"}`}
                >
                  <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={12} />
                  {m.nome}
                </button>
              ))}
            </div>
          </div>
          {users && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Pessoas</p>
              <div className="flex flex-wrap gap-1.5">
                {users?.slice(0, 20).map((u: any) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUsers(s => s.includes(u.id) ? s.filter(x => x !== u.id) : [...s, u.id])}
                    className={`px-2 py-1 rounded-full text-xs border ${selectedUsers.includes(u.id) ? "bg-blue-100 border-blue-300 text-blue-700" : "bg-white border-gray-200"}`}
                  >
                    @{u.nome?.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function FeedPage() {
  const { data: session } = useSession()
  const [page, setPage] = useState(1)
  const { data, mutate } = useSWR(`/api/feed?page=${page}`, fetcher)
  const { version } = useAppUi()

  const canPost = session?.user?.role === "admin" || session?.user?.role === "lider" || session?.user?.role === "supervisor"

  return (
    <MemberShell showTabs={!!session}>
      <div className="border-b bg-background sticky top-0 z-30 md:static">
        <div className="mx-auto flex h-12 max-w-2xl items-center justify-between px-4 md:h-auto md:py-4">
          <h1 className="font-semibold md:text-xl">Feed</h1>
          {session ? (
            version === "v1" ? <NotificationsButton /> : <span />
          ) : (
            <Link href="/login" className="text-sm font-semibold text-primary">
              Entrar
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {canPost && <NewPostForm mutate={mutate} />}

        {data?.posts?.map((post: any) => (
          <PostCard key={post.id} post={post} session={session} mutate={mutate} />
        ))}

        {data?.posts?.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">Nenhuma postagem ainda.</p>
        )}

        {data && data.pages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <span className="self-center text-sm text-muted-foreground">
              {page} / {data.pages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
              Próxima
            </Button>
          </div>
        )}
      </div>
    </MemberShell>
  )
}
