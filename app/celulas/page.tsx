import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight, MessageCircle } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { CHURCH_INFO } from "@/lib/constants"
import {
  CELULAS_CONTATOS,
  formatWhatsappDisplay,
  whatsappUrl,
} from "@/lib/celulas-contatos"
import { SITE_IMAGES } from "@/lib/site-images"

export const metadata: Metadata = {
  title: "Células e Contatos | Primeira Igreja Batista de Roraima",
  description:
    "Fale com a secretaria da PIB Roraima ou entre em contato com uma de nossas células pelo WhatsApp.",
}

export default function CelulasPage() {
  const secretaria = CELULAS_CONTATOS.find((c) => c.destaque)
  const celulas = CELULAS_CONTATOS.filter((c) => !c.destaque)

  return (
    <SiteShell>
      <section className="relative flex h-[42vh] min-h-[280px] items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black text-white">
        <div className="absolute inset-0 opacity-35">
          <Image
            src={SITE_IMAGES.comunidadeGrupo}
            alt="Comunidade da igreja"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative z-10 max-w-4xl px-4 text-center">
          <p className="site-label-dark mb-4 md:text-sm">COMUNHÃO</p>
          <h1 className="font-display text-4xl font-semibold md:text-6xl">
            Células e Contatos
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80 md:text-xl">
            Escolha abaixo para falar com a secretaria ou participar de uma célula.
          </p>
        </div>
      </section>

      <section className="bg-muted/40 py-16 px-4">
        <div className="mx-auto max-w-lg">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {CHURCH_INFO.NAME}
            </p>
            <p className="mt-3 text-muted-foreground">
              Toque em um contato para abrir o WhatsApp com a mensagem pronta, quando disponível.
            </p>
          </div>

          {secretaria && (
            <div className="mb-8">
              <h2 className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Atendimento
              </h2>
              <ContatoCard contato={secretaria} />
            </div>
          )}

          <div>
            <h2 className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Células
            </h2>
            <ul className="space-y-3">
              {celulas.map((contato) => (
                <li key={contato.id}>
                  <ContatoCard contato={contato} />
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            Precisa de outro assunto?{" "}
            <Link href="/contato" className="font-semibold text-foreground underline-offset-4 hover:underline">
              Veja a página de contato
            </Link>
            .
          </p>
        </div>
      </section>
    </SiteShell>
  )
}

function ContatoCard({
  contato,
}: {
  contato: (typeof CELULAS_CONTATOS)[number]
}) {
  const href = whatsappUrl(contato.telefone, contato.mensagem)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        contato.destaque
          ? "group flex items-center gap-4 rounded-2xl border border-foreground bg-foreground p-5 text-background shadow-sm transition-all hover:opacity-95"
          : "group flex items-center gap-4 rounded-2xl border border-border bg-background p-5 transition-all hover:border-foreground/30 hover:shadow-md"
      }
    >
      <span
        className={
          contato.destaque
            ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background/15"
            : "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#128C7E]"
        }
        aria-hidden
      >
        <MessageCircle className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug">{contato.titulo}</span>
        {contato.descricao && (
          <span
            className={
              contato.destaque
                ? "mt-1 block text-sm text-background/75"
                : "mt-1 block text-sm text-muted-foreground"
            }
          >
            {contato.descricao}
          </span>
        )}
        <span
          className={
            contato.destaque
              ? "mt-2 block text-xs text-background/60"
              : "mt-2 block text-xs text-muted-foreground"
          }
        >
          {formatWhatsappDisplay(contato.telefone)}
        </span>
      </span>
      <ChevronRight
        className={
          contato.destaque
            ? "h-5 w-5 shrink-0 text-background/70 transition-transform group-hover:translate-x-0.5"
            : "h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        }
        aria-hidden
      />
    </a>
  )
}
