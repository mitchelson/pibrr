import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock } from "lucide-react"
import { sql } from "@/lib/neon"
import { SiteShell } from "@/components/site-shell"
import { CHURCH_INFO } from "@/lib/constants"

export const revalidate = 60
export const dynamic = "force-dynamic"

export default async function EventosPage() {
  const eventos = await sql`
    SELECT * FROM eventos WHERE data >= CURRENT_DATE ORDER BY data ASC
  `

  const tiposUnicos = ["Todos", ...new Set(eventos.map((e: any) => e.tipo).filter(Boolean))]

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative w-full h-[50vh] bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="absolute inset-0 opacity-30">
          <Image src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1920&h=1080&fit=crop" alt="Eventos" fill className="object-cover" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p className="site-label-dark mb-4 md:text-sm">CALENDÁRIO</p>
          <h1 className="font-display text-4xl md:text-6xl font-semibold mb-4">Eventos & Cultos</h1>
          <p className="text-lg md:text-xl">Participe dos momentos que Deus tem preparado para você</p>
        </div>
      </section>

      {/* Horários fixos */}
      <section className="bg-muted/40 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">
            Programação semanal
          </h2>
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {CHURCH_INFO.SCHEDULE.map((s) => (
              <div
                key={`${s.day}-${s.label}`}
                className="rounded-full border border-border bg-background px-5 py-2 text-sm"
              >
                <span className="font-semibold text-foreground">{s.day}</span>
                <span className="text-muted-foreground"> · {s.time} · {s.label}</span>
              </div>
            ))}
          </div>
          {tiposUnicos.length > 1 && (
            <div className="flex flex-wrap gap-3 justify-center">
              {tiposUnicos.map((cat) => (
                <span key={cat as string} className="px-6 py-2 rounded-full bg-background text-foreground font-semibold border border-border">{cat as string}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lista */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">Próximos Eventos</h2>
          {eventos.length === 0 ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-lg">Nenhum evento agendado no momento.</p>
              <Link href="/#programacao" className="inline-block font-semibold text-foreground hover:underline">
                Ver programação semanal
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {eventos.map((evento: any) => (
                <div key={evento.id} className="bg-background rounded-2xl border border-border overflow-hidden hover:border-foreground/25 transition-all duration-300 group">
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                    <Calendar className="h-16 w-16 text-white/30" aria-hidden />
                    {evento.tipo && (
                      <div className="absolute top-4 right-4 bg-foreground text-background px-3 py-1 rounded-lg text-xs font-semibold">
                        {evento.tipo}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-xl mb-2 text-foreground">{evento.titulo}</h3>
                    {evento.descricao && <p className="text-muted-foreground mb-4 text-sm">{evento.descricao}</p>}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-foreground">
                        <Calendar className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="font-semibold">{new Date(evento.data).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}</span>
                      </div>
                      {evento.horario && (
                        <div className="flex items-center text-foreground">
                          <Clock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                          <span>{evento.horario}</span>
                        </div>
                      )}
                    </div>
                    <Link href="/#programacao" className="mt-4 block text-center bg-foreground text-background font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-all">
                      Ver programação
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="site-cta-band">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6">Venha nos visitar!</h2>
          <p className="text-lg text-[var(--site-muted)] mb-8">
            Primeira vez na igreja? Cadastre-se como visitante e seja bem-vindo à nossa família.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/cadastro" className="site-btn-primary">
              Sou visitante
            </Link>
            <Link href="/#programacao" className="site-btn-secondary">
              Ver programação
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
