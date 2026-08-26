import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, MapPin, Clock, ChevronRight } from "lucide-react";
import { sql } from "@/lib/neon";
import { MinistryIcon } from "@/components/ministry-icon";
import { SiteShell } from "@/components/site-shell";
import { CHURCH_INFO } from "@/lib/constants";

const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHURCH_INFO.YOUTUBE_CHANNEL_ID}`

async function getVideos() {
  try {
    const res = await fetch(RSS_URL, { next: { revalidate: 3600 } })
    const xml = await res.text()
    return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 4).map((m) => {
      const entry = m[1] ?? ""
      const id = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] ?? ""
      const title = entry.match(/<title>(.*?)<\/title>/)?.[1] ?? ""
      const published = entry.match(/<published>(.*?)<\/published>/)?.[1] ?? ""
      return { id, title, published, thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, url: `https://www.youtube.com/watch?v=${id}` }
    })
  } catch { return [] }
}

export const revalidate = 3600

export default async function HomeLanding() {
  const videos = await getVideos()
  const eventos = await sql`SELECT titulo, data, horario, descricao, tipo FROM eventos WHERE data >= CURRENT_DATE ORDER BY data ASC LIMIT 6`
  const ministerios = await sql`SELECT nome, descricao, icone FROM ministerios WHERE ativo = true ORDER BY ordem ASC, nome ASC`
  return (
    <SiteShell variant="dark">
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1920&q=80"
          alt="Culto"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/70 via-[#0a0a0a]/50 to-[#0a0a0a]" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-16">
          <p className="text-primary uppercase tracking-[0.35em] text-xs md:text-sm font-semibold mb-6">
            {CHURCH_INFO.NAME}
          </p>
          <h1 className="text-5xl md:text-8xl font-extrabold leading-[0.95] mb-8 tracking-tight">
            VENHA VIVER
            <br />
            <span className="text-primary">O EXTRAORDINÁRIO</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Uma comunidade apaixonada por Jesus, onde vidas são transformadas e famílias restauradas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/eventos" className="bg-primary text-primary-foreground font-bold px-8 py-4 rounded-full hover:opacity-90 transition-all text-sm uppercase tracking-wider">
              Horários dos Cultos
            </Link>
            <Link href="/sermoes" className="border border-white/30 text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2">
              <Play className="h-4 w-4" /> Assista ao Vivo
            </Link>
            {process.env.NEXT_PUBLIC_FEIJOADA_ATIVA === "true" && (
              <a
                href={process.env.NEXT_PUBLIC_FEIJOADA_URL || "https://feijoada.pibrr.com"}
                className="border border-primary/60 text-primary font-bold px-8 py-4 rounded-full hover:bg-primary/10 transition-all text-sm uppercase tracking-wider"
              >
                Feijoada da construção
              </a>
            )}
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-primary rounded-full" />
          </div>
        </div>
      </section>

      {/* ── Cultos ao Vivo / Última Mensagem ── */}
      <section className="py-20 px-4 bg-[#0f0f0f]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary uppercase tracking-[0.3em] text-xs font-semibold mb-3">Pregações</p>
            <h2 className="text-3xl md:text-5xl font-bold">Últimas Mensagens</h2>
          </div>
          {videos.length > 0 && videos[0] ? (
            <>
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/50 border border-white/5 max-w-4xl mx-auto mb-8">
                <iframe
                  src={`https://www.youtube.com/embed/${videos[0].id}`}
                  title={videos[0].title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {videos.slice(1).map((v) => (
                  <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="group rounded-xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all">
                    <div className="relative aspect-video">
                      <Image src={v.thumbnail} alt={v.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div className="p-3 bg-[#0a0a0a]">
                      <p className="text-sm font-medium text-white line-clamp-2">{v.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(v.published).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </a>
                ))}
              </div>
            </>
          ) : (
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/50 border border-white/5 max-w-4xl mx-auto group">
              <Image src="https://images.unsplash.com/photo-1478147427282-58a87a120781?w=1200&q=80" alt="Última pregação" fill className="object-cover opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Link href="/sermoes" className="bg-primary rounded-full p-5 hover:scale-110 transition-transform shadow-2xl">
                  <Play className="h-8 w-8 text-primary-foreground fill-current" />
                </Link>
              </div>
            </div>
          )}
          <div className="text-center mt-8">
            <a href={CHURCH_INFO.YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
              Ver todas no YouTube <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Quem Somos ── */}
      <section className="py-20 px-4 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-primary uppercase tracking-[0.3em] text-xs font-semibold mb-3">Quem Somos</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Uma igreja que<br />
              <span className="text-primary">transforma vidas</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              Somos uma comunidade de fé em {CHURCH_INFO.CITY}, comprometida com o evangelho de Jesus Cristo.
              Acreditamos que todo crente foi criado para pertencer a uma família espiritual e caminhar junto
              em propósito, amor e adoração.
            </p>
            <Link href="/sobre" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
              Conheça nossa história <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&q=80"
              alt="Comunidade"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/60 to-transparent" />
          </div>
        </div>
      </section>

      {/* ── Ministérios ── */}
      <section className="py-20 px-4 bg-[#0f0f0f]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary uppercase tracking-[0.3em] text-xs font-semibold mb-3">Ministérios</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Encontre o Seu Lugar</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Há um espaço para você servir e crescer no que Deus está fazendo em nossa casa.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {ministerios.map((m: any) => (
              <div key={m.nome} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center hover:border-primary/30 hover:bg-white/[0.04] transition-all group">
                <span className="mb-3 flex justify-center"><MinistryIcon name={m.icone} ministryName={m.nome} size={36} className="text-primary" /></span>
                <h3 className="text-sm font-bold mb-1 group-hover:text-primary transition-colors">{m.nome}</h3>
                {m.descricao && <p className="text-xs text-gray-500 line-clamp-2">{m.descricao}</p>}
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/ministerios" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
              Ver todos os ministérios <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Próximos Eventos ── */}
      <section id="programacao" className="py-20 px-4 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary uppercase tracking-[0.3em] text-xs font-semibold mb-3">Programação</p>
            <h2 className="text-3xl md:text-5xl font-bold">Próximos Eventos</h2>
          </div>
          {eventos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {eventos.map((ev: any, i: number) => {
                const date = new Date(ev.data)
                const dia = date.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" }).replace(".", "").toUpperCase()
                return (
                  <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-primary/30 hover:bg-white/[0.04] transition-all group">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">{dia}</span>
                      {ev.horario && (
                        <span className="flex items-center gap-1 text-sm text-gray-400">
                          <Clock className="h-3.5 w-3.5" /> {ev.horario}
                        </span>
                      )}
                      {ev.tipo && <span className="text-xs text-gray-500 ml-auto">{ev.tipo}</span>}
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{ev.titulo}</h3>
                    <p className="text-gray-400 text-sm">{ev.descricao || date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" })}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CHURCH_INFO.SCHEDULE.map((ev) => (
                <div key={`${ev.day}-${ev.label}`} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-primary/30 hover:bg-white/[0.04] transition-all group">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                      {ev.day.slice(0, 3).toUpperCase()}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-400">
                      <Clock className="h-3.5 w-3.5" /> {ev.time}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{ev.label}</h3>
                  <p className="text-gray-400 text-sm">{ev.day} às {ev.time}</p>
                </div>
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <Link href="/eventos" className="bg-primary text-primary-foreground font-bold px-8 py-4 rounded-full hover:opacity-90 transition-all text-sm uppercase tracking-wider inline-block">
              Confira a Programação Completa
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA: Encontre Jesus ── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1920&q=80"
          alt="Encontre Jesus"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#0a0a0a]/80" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Deus Tem Algo <span className="text-primary">Extraordinário</span> Para Você
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Precisa de oração? Quer conhecer Jesus? Estamos aqui para caminhar com você.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {["Conhecer Jesus", "Pedido de Oração", "Aconselhamento", "Quero Ser Batizado"].map((label) => (
              <Link key={label} href="/contato" className="border border-white/20 text-white font-semibold px-6 py-3 rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-sm">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Localização ── */}
      <section className="py-20 px-4 bg-[#0f0f0f]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-primary uppercase tracking-[0.3em] text-xs font-semibold mb-3">Localização</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Venha Nos Visitar</h2>
            <div className="space-y-4 text-gray-400">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-white font-semibold">{CHURCH_INFO.NAME}</p>
                  <p>{CHURCH_INFO.ADDRESS_LINE}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  {CHURCH_INFO.SCHEDULE.map((s) => (
                    <p key={s.day}>
                      <span className="text-white">{s.day}:</span> {s.time} ({s.label})
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <Link href="/contato" className="inline-flex items-center gap-2 text-primary font-semibold mt-6 hover:gap-3 transition-all">
              Como chegar <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-white/5 border border-white/10">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3984.0!2d-60.67!3d2.82!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMsKwNDknMTIuMCJOIDYwwrA0MCcxMi4wIlc!5e0!3m2!1spt-BR!2sbr!4v1"
              className="absolute inset-0 w-full h-full"
              style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
              allowFullScreen
              loading="lazy"
              title={`Localização ${CHURCH_INFO.SHORT_NAME}`}
            />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
