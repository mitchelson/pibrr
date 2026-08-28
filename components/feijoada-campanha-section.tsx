import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Calendar, Target } from "lucide-react"
import {
  formatFeijoadaData,
  formatFeijoadaPreco,
  type FeijoadaCampanha,
} from "@/lib/feijoada-campanha"
import { SITE_IMAGES } from "@/lib/site-images"

type Props = {
  campanha: FeijoadaCampanha
}

export function FeijoadaCampanhaSection({ campanha }: Props) {
  if (!campanha.ativa) return null

  const preco = formatFeijoadaPreco(campanha)
  const dataFormatada = formatFeijoadaData(campanha.dataEvento)
  const restam =
    campanha.metaFeijoadas > campanha.vendido
      ? campanha.metaFeijoadas - campanha.vendido
      : null

  return (
    <section id="feijoada" className="relative overflow-hidden border-y border-[var(--site-line)] bg-[var(--site-bg)] py-20 px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.06),_transparent_55%)]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-[var(--site-line)] bg-white/[0.02] shadow-2xl">
            <Image
              src={SITE_IMAGES.feijoadaCampanha}
              alt="Campanha Feijoada da construção"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 90vw, 50vw"
            />
          </div>
        </div>

        <div>
          <p className="site-label-dark mb-4">Campanha em andamento</p>
          <h2 className="font-display text-4xl font-semibold leading-[1.02] tracking-tight md:text-5xl lg:text-6xl">
            {campanha.nome}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--site-muted)] md:text-xl">
            {campanha.descricao?.trim() ||
              "Cada feijoada vendida nos aproxima do novo templo. Compre a sua, compartilhe com a família e faça parte da construção da casa de Deus em Roraima."}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {dataFormatada && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--site-line)] px-4 py-2 text-sm text-[var(--site-muted)]">
                <Calendar className="h-4 w-4 shrink-0 text-white" aria-hidden />
                {dataFormatada}
              </span>
            )}
            {preco && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
                A partir de {preco}
              </span>
            )}
          </div>

          {campanha.metaFeijoadas > 0 && (
            <div className="mt-10 rounded-2xl border border-[var(--site-line)] bg-white/[0.03] p-6">
              <div className="mb-3 flex items-center justify-between gap-4 text-sm">
                <span className="inline-flex items-center gap-2 font-semibold text-white">
                  <Target className="h-4 w-4" aria-hidden />
                  Meta da campanha
                </span>
                <span className="text-[var(--site-muted)]">
                  {campanha.vendido.toLocaleString("pt-BR")} / {campanha.metaFeijoadas.toLocaleString("pt-BR")} feijoadas
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${Math.min(100, campanha.progresso)}%` }}
                />
              </div>
              {restam != null && restam > 0 && (
                <p className="mt-3 text-sm text-[var(--site-muted)]">
                  Faltam <span className="font-semibold text-white">{restam.toLocaleString("pt-BR")}</span> para batermos a meta.
                </p>
              )}
            </div>
          )}

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href={campanha.comprarUrl}
              className="site-btn-primary group w-full text-center text-base uppercase tracking-wider sm:w-auto sm:min-w-[280px]"
            >
              Comprar feijoada agora
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href={campanha.url}
              className="site-btn-secondary w-full text-center text-sm sm:w-auto"
            >
              Ver campanha completa
            </a>
          </div>

          <p className="mt-6 text-sm text-[var(--site-muted)]">
            Pagamento seguro por PIX · retirada no dia do evento · cada compra gera seu comprovante digital.
          </p>
        </div>
      </div>
    </section>
  )
}
