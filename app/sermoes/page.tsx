import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Play, ExternalLink } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { CHURCH_INFO } from "@/lib/constants"

export const revalidate = 3600

type Video = {
  id: string
  title: string
  published: string
  thumbnail: string
  url: string
}

async function getVideos(): Promise<Video[]> {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHURCH_INFO.YOUTUBE_CHANNEL_ID}`
    const res = await fetch(rssUrl, { next: { revalidate: 3600 } })
    const xml = await res.text()
    return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 12).map((m) => {
      const entry = m[1] ?? ""
      const id = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] ?? ""
      const title = entry.match(/<title>(.*?)<\/title>/)?.[1] ?? ""
      const published = entry.match(/<published>(.*?)<\/published>/)?.[1] ?? ""
      return {
        id,
        title,
        published,
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${id}`,
      }
    })
  } catch {
    return []
  }
}

export default async function SermoesPage() {
  const videos = await getVideos()
  const featured = videos[0]
  const rest = videos.slice(1)

  return (
    <SiteShell>
      <section className="relative w-full h-[50vh] bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1920&h=1080&fit=crop"
            alt="Pregações"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p className="site-label-dark mb-4 md:text-sm">
            PALAVRA DE DEUS
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-semibold mb-4">
            Pregações
          </h1>
          <p className="text-lg md:text-xl">
            Mensagens que transformam vidas e edificam a fé
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {featured ? (
            <>
              <div className="mb-12">
                <p className="site-label mb-3 text-muted-foreground">
                  Mais recente
                </p>
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/50 border border-border max-w-4xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${featured.id}`}
                    title={featured.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-foreground">{featured.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(featured.published).toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              {rest.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold text-foreground mb-8">
                    Mais mensagens
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {rest.map((video) => (
                      <a
                        key={video.id}
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-background rounded-2xl border border-border overflow-hidden hover:border-foreground/25 transition-all"
                      >
                        <div className="relative aspect-video overflow-hidden">
                          <Image
                            src={video.thumbnail}
                            alt={video.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="bg-foreground text-background rounded-full p-4">
                              <Play className="h-6 w-6 fill-current" aria-hidden />
                            </span>
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-foreground/80 transition-colors">
                            {video.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(video.published).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-6">
                Não foi possível carregar as pregações no momento.
              </p>
              <a
                href={CHURCH_INFO.YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-foreground text-background font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all"
              >
                Ver no YouTube <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          <div className="text-center mt-12">
            <a
              href={CHURCH_INFO.YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-foreground hover:underline"
            >
              Ver todas no YouTube <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="site-cta-band">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6">
            Venha viver a palavra conosco
          </h2>
          <p className="text-lg text-[var(--site-muted)] mb-8">
            Assista online ou participe pessoalmente dos nossos cultos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/eventos" className="site-btn-primary">
              Ver programação
            </Link>
            <Link href="/cadastro" className="site-btn-secondary">
            >
              Sou visitante
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
