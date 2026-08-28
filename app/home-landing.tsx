import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, MapPin, Clock, ChevronRight } from "lucide-react";
import { sql } from "@/lib/neon";
import { MinistryIcon } from "@/components/ministry-icon";
import { SiteShell } from "@/components/site-shell";
import { CHURCH_INFO } from "@/lib/constants";
import { getFeijoadaCampanhaAtiva } from "@/lib/feijoada-campanha";
import { SITE_IMAGES } from "@/lib/site-images";

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

export const revalidate = 60

export default async function HomeLanding() {
  const [videos, eventos, ministerios, feijoada] = await Promise.all([
    getVideos(),
    sql`SELECT titulo, data, horario, descricao, tipo FROM eventos WHERE data >= CURRENT_DATE ORDER BY data ASC LIMIT 6`,
    sql`SELECT nome, descricao, icone FROM ministerios WHERE ativo = true ORDER BY ordem ASC, nome ASC`,
    getFeijoadaCampanhaAtiva(),
  ])
  return (
    <SiteShell variant="dark">
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <Image
          src={SITE_IMAGES.adoracao}
          alt="Momento de adoração no culto"
          fill
          className="object-cover scale-105 animate-[kenburns_18s_ease-out_infinite_alternate]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--site-bg)]/75 via-[var(--site-bg)]/55 to-[var(--site-bg)]" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-16">
          <p className="site-label-dark mb-6 md:text-sm">
            {CHURCH_INFO.NAME}
          </p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold leading-[0.98] mb-8 tracking-tight">
            Venha viver
            <br />
            <span className="text-white/90">o extraordinário</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--site-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Uma comunidade apaixonada por Jesus, onde vidas são transformadas e famílias restauradas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/eventos" className="site-btn-primary uppercase tracking-wider">
              Horários dos Cultos
            </Link>
            <Link href="/sermoes" className="site-btn-outline-light uppercase tracking-wider">
              <Play className="h-4 w-4" /> Assista ao Vivo
            </Link>
            {feijoada.ativa && (
              <a href={feijoada.url} className="site-btn-secondary uppercase tracking-wider">
                {feijoada.nome?.trim() || "Feijoada da construção"}
              </a>
            )}
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white rounded-full" />
          </div>
        </div>
      </section>

      {/* ── Cultos ao Vivo / Última Mensagem ── */}
      <section className="site-section-band">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="site-label-dark mb-3">Pregações</p>
            <h2 className="font-display text-3xl md:text-5xl font-semibold">Últimas Mensagens</h2>
          </div>
          {videos.length > 0 && videos[0] ? (
            <>
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/50 border border-[var(--site-line)] max-w-4xl mx-auto mb-8">
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
                  <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="group rounded-xl overflow-hidden border border-[var(--site-line)] hover:border-white/25 transition-all">
                    <div className="relative aspect-video">
                      <Image src={v.thumbnail} alt={v.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div className="p-3 bg-[var(--site-bg)]">
                      <p className="text-sm font-medium text-white line-clamp-2">{v.title}</p>
                      <p className="text-xs text-[var(--site-muted)] mt-1">{new Date(v.published).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </a>
                ))}
              </div>
            </>
          ) : (
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/50 border border-[var(--site-line)] max-w-4xl mx-auto group">
              <Image src={SITE_IMAGES.louvor} alt="Louvor e adoração" fill className="object-cover opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Link href="/sermoes" className="bg-white rounded-full p-5 hover:scale-110 transition-transform shadow-2xl">
                  <Play className="h-8 w-8 text-[var(--site-ink)] fill-current" />
                </Link>
              </div>
            </div>
          )}
          <div className="text-center mt-8">
            <a href={CHURCH_INFO.YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="site-link-dark">
              Ver todas no YouTube <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Quem Somos ── */}
      <section className="site-section-dark">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="site-label-dark mb-3">Quem Somos</p>
            <h2 className="font-display text-3xl md:text-5xl font-semibold mb-6 leading-tight">
              Uma igreja que
              <br />
              <span className="text-white/90">transforma vidas</span>
            </h2>
            <p className="text-[var(--site-muted)] text-lg leading-relaxed mb-6">
              Somos uma comunidade de fé em {CHURCH_INFO.CITY}, comprometida com o evangelho de Jesus Cristo.
              Acreditamos que todo crente foi criado para pertencer a uma família espiritual e caminhar junto
              em propósito, amor e adoração.
            </p>
            <Link href="/sobre" className="site-link-dark">
              Conheça nossa história <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[var(--site-line)]">
            <Image
              src={SITE_IMAGES.comunidadeGrupo}
              alt="Comunidade da igreja em comunhão"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--site-bg)]/60 to-transparent" />
          </div>
        </div>
      </section>

      {/* ── Ministérios ── */}
      <section className="site-section-band">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="site-label-dark mb-3">Ministérios</p>
            <h2 className="font-display text-3xl md:text-5xl font-semibold mb-4">Encontre o Seu Lugar</h2>
            <p className="text-[var(--site-muted)] text-lg max-w-2xl mx-auto">
              Há um espaço para você servir e crescer no que Deus está fazendo em nossa casa.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {ministerios.map((m: any) => (
              <div key={m.nome} className="site-card-dark p-6 text-center group">
                <span className="mb-3 flex justify-center"><MinistryIcon name={m.icone} ministryName={m.nome} size={36} className="text-white" /></span>
                <h3 className="text-sm font-bold mb-1 group-hover:text-white transition-colors">{m.nome}</h3>
                {m.descricao && <p className="text-xs text-[var(--site-muted)] line-clamp-2">{m.descricao}</p>}
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/ministerios" className="site-link-dark">
              Ver todos os ministérios <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Próximos Eventos ── */}
      <section id="programacao" className="site-section-dark">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="site-label-dark mb-3">Programação</p>
            <h2 className="font-display text-3xl md:text-5xl font-semibold">Próximos Eventos</h2>
          </div>
          {eventos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {eventos.map((ev: any, i: number) => {
                const date = new Date(ev.data)
                const dia = date.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" }).replace(".", "").toUpperCase()
                return (
                  <div key={i} className="site-card-dark p-6 group">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-white text-[var(--site-ink)] text-xs font-bold px-3 py-1 rounded-lg">{dia}</span>
                      {ev.horario && (
                        <span className="flex items-center gap-1 text-sm text-[var(--site-muted)]">
                          <Clock className="h-3.5 w-3.5" /> {ev.horario}
                        </span>
                      )}
                      {ev.tipo && <span className="text-xs text-[var(--site-muted)] ml-auto">{ev.tipo}</span>}
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">{ev.titulo}</h3>
                    <p className="text-[var(--site-muted)] text-sm">{ev.descricao || date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" })}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CHURCH_INFO.SCHEDULE.map((ev) => (
                <div key={`${ev.day}-${ev.label}`} className="site-card-dark p-6 group">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-white text-[var(--site-ink)] text-xs font-bold px-3 py-1 rounded-lg">
                      {ev.day.slice(0, 3).toUpperCase()}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-[var(--site-muted)]">
                      <Clock className="h-3.5 w-3.5" /> {ev.time}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">{ev.label}</h3>
                  <p className="text-[var(--site-muted)] text-sm">{ev.day} às {ev.time}</p>
                </div>
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <Link href="/eventos" className="site-btn-primary uppercase tracking-wider inline-flex">
              Confira a Programação Completa
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA: Encontre Jesus ── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <Image
          src={SITE_IMAGES.comunidadeAbraco}
          alt="Acolhimento na comunidade da igreja"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[var(--site-bg)]/85" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-5xl font-semibold mb-6">
            Deus tem algo <span className="text-white/90">extraordinário</span> para você
          </h2>
          <p className="text-lg text-[var(--site-muted)] mb-10 max-w-2xl mx-auto">
            Precisa de oração? Quer conhecer Jesus? Estamos aqui para caminhar com você.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {["Conhecer Jesus", "Pedido de Oração", "Aconselhamento", "Quero Ser Batizado"].map((label) => (
              <Link key={label} href="/contato" className="site-btn-secondary text-sm">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Localização ── */}
      <section className="site-section-band">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="site-label-dark mb-3">Localização</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6">Venha Nos Visitar</h2>
            <div className="space-y-4 text-[var(--site-muted)]">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-white mt-0.5 shrink-0" />
                <div>
                  <p className="text-white font-semibold">{CHURCH_INFO.NAME}</p>
                  <p>{CHURCH_INFO.ADDRESS_LINE}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-white mt-0.5 shrink-0" />
                <div>
                  {CHURCH_INFO.SCHEDULE.map((s) => (
                    <p key={s.day}>
                      <span className="text-white">{s.day}:</span> {s.time} ({s.label})
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <Link href="/contato" className="site-link-dark mt-6">
              Como chegar <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-white/5 border border-[var(--site-line)]">
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
