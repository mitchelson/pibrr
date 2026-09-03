import React from "react"
import Link from "next/link"
import Image from "next/image"
import { User } from "lucide-react"
import { sql } from "@/lib/db"
import { MinistryIcon } from "@/components/ministry-icon"
import { SiteShell } from "@/components/site-shell"
import { SITE_IMAGES } from "@/lib/site-images"

export const revalidate = 60
export const dynamic = "force-dynamic"

export default async function MinisteriosPage() {
  const ministerios = await sql`
    SELECT m.*, 
      (SELECT json_agg(json_build_object('nome', u.nome, 'is_lider', mm.is_lider))
       FROM ministerio_membros mm JOIN users u ON u.id = mm.user_id
       WHERE mm.ministerio_id = m.id AND mm.is_lider = true) as lideres
    FROM ministerios m
    WHERE m.ativo = true
    ORDER BY m.ordem ASC, m.nome ASC
  `

  if (ministerios.length === 0) {
    return (
      <SiteShell>
        <HeroSection />
        <section className="py-16 px-4 text-center">
          <p className="text-lg text-muted-foreground">Os ministérios serão exibidos em breve.</p>
        </section>
      </SiteShell>
    )
  }

  return (
    <SiteShell>
      <HeroSection />

      <section className="bg-muted/40 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Descubra seu propósito</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Acreditamos que cada pessoa foi criada com dons e talentos únicos para servir ao Reino de Deus.
            Nossos ministérios são oportunidades de usar seus dons, crescer espiritualmente e fazer diferença na vida de outras pessoas.
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          {ministerios.map((m: any, index: number) => {
            const liderNome = m.lideres?.[0]?.nome || "Coordenação"
            return (
              <div key={m.id} className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center`}>
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="relative h-[300px] rounded-lg overflow-hidden border border-border bg-muted/40 flex items-center justify-center">
                    <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={96} />
                  </div>
                </div>
                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <div className="flex items-center gap-3 mb-4">
                    <MinistryIcon name={m.icone} ministryName={m.nome} color={m.cor} size={48} />
                    <h3 className="text-3xl font-bold text-foreground">{m.nome}</h3>
                  </div>
                  <p className="text-muted-foreground mb-4 text-lg">{m.descricao || "Ministério da nossa igreja."}</p>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-foreground">{liderNome}</span>
                    </div>
                  </div>
                  <Link href="/form-ministerios" className="inline-block bg-foreground text-background font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all">
                    Quero servir
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="site-cta-band">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6">Pronto para fazer a diferença?</h2>
          <p className="text-lg text-[var(--site-muted)] mb-8">Descubra como você pode servir e crescer conosco</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/form-ministerios" className="site-btn-primary">
              Quero servir
            </Link>
            <Link href="/contato" className="site-btn-secondary">
              Falar Conosco
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}

function HeroSection() {
  return (
    <section className="relative w-full h-[50vh] bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
      <div className="absolute inset-0 opacity-30">
        <Image src={SITE_IMAGES.louvor} alt="Ministério de louvor" fill className="object-cover" />
      </div>
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <p className="site-label-dark mb-4 md:text-sm">SERVINDO JUNTOS</p>
        <h1 className="font-display text-4xl md:text-6xl font-semibold mb-4">Ministérios</h1>
        <p className="text-lg md:text-xl">Há um lugar para você no que Deus está fazendo em nossa casa</p>
      </div>
    </section>
  )
}
