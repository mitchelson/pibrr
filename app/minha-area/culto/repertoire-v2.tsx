"use client"

import { useState } from "react"
import useSWR from "swr"
import { Music, Pencil, Plus } from "lucide-react"
import { RepertoireForm } from "@/app/minha-area/repertoire-form"
import { RepertoireList } from "@/app/minha-area/repertoire-list"
import { DsBtn, DsEmpty, DsSection } from "@/components/app-v2/ds"

const fetcher = async (url: string) => {
  const r = await fetch(url)
  const data = await r.json()
  if (!r.ok) {
    const err = new Error(data?.message || data?.error || "Erro na API") as Error & {
      status?: number
    }
    err.status = r.status
    throw err
  }
  return data
}

/**
 * Repertório no culto.
 * Por quê separado: só importa se existir música ou se o usuário pode editar.
 * Como: esconde a seção inteira se não há itens e não pode editar.
 */
export function RepertoireV2({ eventoId }: { eventoId: string }) {
  const { data, error, mutate } = useSWR(`/api/repertorio?evento_id=${eventoId}`, fetcher)
  const [editing, setEditing] = useState(false)

  if (error) {
    return (
      <DsSection eyebrow="Preparação" title="Repertório">
        <DsEmpty title="Não foi possível carregar" description="Tente atualizar a página." />
      </DsSection>
    )
  }

  if (!data) return null

  const items = Array.isArray(data.items) ? data.items : []
  const canEdit = Boolean(data.canEdit)
  const hasItems = items.length > 0

  if (!hasItems && !canEdit) return null

  if (editing) {
    return (
      <DsSection eyebrow="Preparação" title="Repertório">
        <RepertoireForm
          eventoId={eventoId}
          initialItems={hasItems ? items : undefined}
          onSaved={() => {
            setEditing(false)
            mutate()
          }}
          onCancel={() => setEditing(false)}
        />
      </DsSection>
    )
  }

  return (
    <DsSection
      eyebrow="Preparação"
      title="Repertório"
      action={
        canEdit ? (
          <DsBtn variant="ghost" size="sm" onClick={() => setEditing(true)}>
            {hasItems ? (
              <>
                <Pencil className="h-3.5 w-3.5" /> Editar
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </>
            )}
          </DsBtn>
        ) : null
      }
    >
      {hasItems ? (
        <div className="pib-panel p-4">
          <p className="pib-mute mb-3 flex items-center gap-1.5 text-xs">
            <Music className="h-3.5 w-3.5" /> Músicas deste culto
          </p>
          <RepertoireList items={items} />
        </div>
      ) : (
        <DsEmpty title="Sem repertório" description="Quem tem permissão pode adicionar as músicas." />
      )}
    </DsSection>
  )
}
