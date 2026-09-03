"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import useSWR from "swr"
import { useSession } from "next-auth/react"
import {
  AtSign,
  Heart,
  ImagePlus,
  Link2,
  Loader2,
  MessageCircle,
  Pin,
  Send,
  Trash2,
  X as XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MinistryIcon } from "@/components/ministry-icon"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { UserProfileDialog } from "@/components/user-profile-dialog"
import { DsBtn, DsChip, DsEmpty, DsField, DsHero, DsPage, DsPanel, useDsConfirm } from "@/components/app-v2/ds"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

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

function PostMencoesV2({ ministerioIds, userIds }: { ministerioIds?: string[]; userIds?: string[] }) {
  const { data: ministerios } = useSWR("/api/ministerios", fetcher)
  const ids = typeof ministerioIds === "string" ? JSON.parse(ministerioIds) : ministerioIds
  const uids = typeof userIds === "string" ? JSON.parse(userIds) : userIds
  const { data: users } = useSWR(uids?.length ? "/api/users" : null, fetcher)

  if (!ids?.length && !uids?.length) return null

  return (
    <div className="flex flex-wrap gap-1.5 px-4 pb-3">
      {ids?.map((id: string) => {
        const m = ministerios?.find((x: any) => x.id === id)
        return m ? (
          <DsChip key={id}>
            <MinistryIcon name={m.icone} ministryName={m.nome} mono size={12} />
            {m.nome}
          </DsChip>
        ) : null
      })}
      {uids?.map((id: string) => {
        const u = users?.find((x: any) => x.id === id)
        return <DsChip key={id}>@{u?.nome?.split(" ")[0] || "membro"}</DsChip>
      })}
    </div>
  )
}

function PostCardV2({ post, session, mutate }: { post: any; session: any; mutate: () => void }) {
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { ask, node } = useDsConfirm()
  const { data: comments, mutate: mutateComments } = useSWR(
    showComments ? `/api/feed/${post.id}/comments` : null,
    fetcher
  )

  const handleLike = async () => {
    if (!session) {
      toast({ title: "Faça login para curtir" })
      return
    }
    const method = post.liked ? "DELETE" : "POST"
    await fetch(`/api/feed/${post.id}/like`, { method })
    mutate()
  }

  const handleComment = async () => {
    if (!comment.trim()) return
    setSubmitting(true)
    await fetch(`/api/feed/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conteudo: comment }),
    })
    setComment("")
    setSubmitting(false)
    mutateComments()
    mutate()
  }

  const handleDeleteComment = async (commentId: string) => {
    const ok = await ask({ title: "Remover comentário?", danger: true, confirmLabel: "Remover" })
    if (!ok) return
    await fetch(`/api/feed/${post.id}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment_id: commentId }),
    })
    mutateComments()
    mutate()
  }

  const handleDelete = async () => {
    const ok = await ask({
      title: "Remover esta postagem?",
      description: "Essa ação não pode ser desfeita.",
      danger: true,
      confirmLabel: "Remover",
    })
    if (!ok) return
    await fetch(`/api/feed/${post.id}`, { method: "DELETE" })
    mutate()
  }

  const canDelete = session?.user?.role === "admin" || session?.user?.id === post.autor_id

  return (
    <DsPanel>
      <div className="flex items-center gap-3 p-4 pb-2">
        <UserProfileDialog userId={post.autor_id}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.autor_foto} />
            <AvatarFallback>{post.autor_nome?.[0]}</AvatarFallback>
          </Avatar>
        </UserProfileDialog>
        <div className="min-w-0 flex-1">
          <UserProfileDialog userId={post.autor_id}>
            <p className="truncate text-sm font-semibold hover:underline">{post.autor_nome}</p>
          </UserProfileDialog>
          <p className="pib-mute text-xs">{timeAgo(post.criado_em)}</p>
        </div>
        {post.fixado && <Pin className="h-4 w-4 shrink-0" aria-label="Fixado" />}
        {canDelete && (
          <DsBtn variant="ghost" size="icon" onClick={handleDelete} aria-label="Remover postagem">
            <Trash2 className="h-4 w-4" />
          </DsBtn>
        )}
      </div>

      {post.conteudo && <p className="whitespace-pre-wrap px-4 pb-3 text-sm">{post.conteudo}</p>}

      {post.link && (
        <a
          href={post.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-4 mb-3 flex items-center gap-2 truncate rounded-[var(--pib-radius-sm)] bg-black/[0.04] px-3 py-2 text-sm transition-colors hover:bg-black/[0.07]"
        >
          <Link2 className="h-4 w-4 shrink-0" aria-hidden />
          {post.link.replace(/^https?:\/\//, "").split("/")[0]}
        </a>
      )}

      {(post.mencoes_ministerios || post.mencoes_users) && (
        <PostMencoesV2 ministerioIds={post.mencoes_ministerios} userIds={post.mencoes_users} />
      )}

      {post.imagem_url && (
        <div className="relative aspect-video w-full">
          <Image src={post.imagem_url} alt="" fill className="object-cover" />
        </div>
      )}

      <div className="flex items-center gap-5 border-t px-4 py-3">
        <button type="button" onClick={handleLike} className="flex items-center gap-1.5 text-sm">
          <Heart className={cn("h-5 w-5", post.liked && "fill-[var(--pib-ink)]")} />
          <span className="pib-mute">{post.likes_count || ""}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-sm"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="pib-mute">{post.comments_count || ""}</span>
        </button>
      </div>

      {showComments && (
        <div className="space-y-3 border-t bg-black/[0.02] px-4 py-3">
          {comments?.map((c: any) => (
            <div key={c.id} className="flex gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={c.user_foto} />
                <AvatarFallback>{c.user_nome?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 rounded-[var(--pib-radius-sm)] bg-[var(--pib-paper-raised)] px-3 py-2 text-sm">
                <span className="font-semibold">{c.user_nome}</span> <span>{c.conteudo}</span>
              </div>
              {(session?.user?.role === "admin" || session?.user?.id === c.user_id) && (
                <button
                  type="button"
                  onClick={() => handleDeleteComment(c.id)}
                  className="pib-mute self-center hover:text-[var(--pib-ink)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
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
                className="h-9 min-h-[36px] resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleComment()
                  }
                }}
              />
              <DsBtn size="sm" onClick={handleComment} disabled={submitting || !comment.trim()}>
                <Send className="h-4 w-4" />
              </DsBtn>
            </div>
          )}
        </div>
      )}
      {node}
    </DsPanel>
  )
}

function NewPostFormV2({ mutate }: { mutate: () => void }) {
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    <DsPanel className="space-y-3 p-4">
      <Textarea
        value={conteudo}
        onChange={(e) => setConteudo(e.target.value)}
        placeholder="Compartilhe algo com a igreja..."
        className="min-h-[80px] resize-none"
      />

      {imagemUrl && (
        <div className="relative h-48 w-full overflow-hidden rounded-[var(--pib-radius-sm)]">
          <Image src={imagemUrl} alt="" fill className="object-cover" />
          <button
            type="button"
            onClick={() => setImagemUrl("")}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      <DsField label="Link (opcional)">
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://"
          className="w-full text-sm"
        />
      </DsField>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DsBtn variant="ghost" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            Imagem
          </DsBtn>
          <DsBtn variant="ghost" size="sm" onClick={() => setShowMencoes((v) => !v)}>
            <AtSign className="h-4 w-4" />
            Marcar
          </DsBtn>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>
        <DsBtn onClick={handleSubmit} disabled={submitting || (!conteudo.trim() && !imagemUrl)}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Publicar
        </DsBtn>
      </div>

      {(selectedMinisterios.length > 0 || selectedUsers.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {selectedMinisterios.map((id) => {
            const m = ministerios?.find((x: any) => x.id === id)
            return m ? (
              <DsChip key={id} active onClick={() => setSelectedMinisterios((s) => s.filter((x) => x !== id))}>
                <MinistryIcon name={m.icone} ministryName={m.nome} mono size={12} />
                {m.nome}
                <XIcon className="h-3 w-3" />
              </DsChip>
            ) : null
          })}
          {selectedUsers.map((id) => {
            const u = users?.find((x: any) => x.id === id)
            return u ? (
              <DsChip key={id} active onClick={() => setSelectedUsers((s) => s.filter((x) => x !== id))}>
                @{u.nome?.split(" ")[0]}
                <XIcon className="h-3 w-3" />
              </DsChip>
            ) : null
          })}
        </div>
      )}

      {showMencoes && (
        <div className="space-y-3 rounded-[var(--pib-radius-sm)] border border-[var(--pib-line)] p-3">
          <div>
            <p className="pib-kicker mb-1.5">Ministérios</p>
            <div className="flex flex-wrap gap-1.5">
              {ministerios
                ?.filter((m: any) => m.ativo)
                .map((m: any) => (
                  <DsChip
                    key={m.id}
                    active={selectedMinisterios.includes(m.id)}
                    onClick={() =>
                      setSelectedMinisterios((s) => (s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id]))
                    }
                  >
                    <MinistryIcon name={m.icone} ministryName={m.nome} mono size={12} />
                    {m.nome}
                  </DsChip>
                ))}
            </div>
          </div>
          {users && (
            <div>
              <p className="pib-kicker mb-1.5">Pessoas</p>
              <div className="flex flex-wrap gap-1.5">
                {users.slice(0, 20).map((u: any) => (
                  <DsChip
                    key={u.id}
                    active={selectedUsers.includes(u.id)}
                    onClick={() =>
                      setSelectedUsers((s) => (s.includes(u.id) ? s.filter((x) => x !== u.id) : [...s, u.id]))
                    }
                  >
                    @{u.nome?.split(" ")[0]}
                  </DsChip>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DsPanel>
  )
}

export default function FeedV2() {
  const { data: session } = useSession()
  const [page, setPage] = useState(1)
  const { data, mutate } = useSWR(`/api/feed?page=${page}`, fetcher)

  const canPost =
    session?.user?.role === "admin" || session?.user?.role === "lider" || session?.user?.role === "supervisor"

  return (
    <DsPage>
      <DsHero kicker="PIB Roraima" title="Comunidade" subtitle="Vida da igreja além da escala" />

      {canPost && <NewPostFormV2 mutate={mutate} />}

      <div className="pib-stack pib-stack--tight">
        {data?.posts?.map((post: any) => (
          <PostCardV2 key={post.id} post={post} session={session} mutate={mutate} />
        ))}
      </div>

      {data?.posts?.length === 0 && (
        <DsEmpty title="Nenhuma postagem ainda" description="Quando alguém publicar, aparece aqui." />
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <DsBtn variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </DsBtn>
          <span className="pib-mute text-sm">
            {page} / {data.pages}
          </span>
          <DsBtn variant="ghost" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
            Próxima
          </DsBtn>
        </div>
      )}
    </DsPage>
  )
}
