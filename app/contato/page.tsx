"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Bus,
  Car,
  Accessibility,
  Instagram,
  Youtube,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { CHURCH_INFO } from "@/lib/constants";
import { SITE_IMAGES } from "@/lib/site-images";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export default function ContatoPage() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    assunto: "",
    mensagem: "",
  });

  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    try {
      const res = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao enviar");
      }

      toast({
        title: "Mensagem enviada!",
        description: "Entraremos em contato em breve.",
      });
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        assunto: "",
        mensagem: "",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: err.message || "Tente novamente em instantes.",
      });
    } finally {
      setEnviando(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const scheduleText = CHURCH_INFO.SCHEDULE.map(
    (s) => `${s.day}: ${s.time} (${s.label})`
  ).join("\n");

  const informacoes: { titulo: string; conteudo: string; Icon: LucideIcon }[] = [
    {
      titulo: "Endereço",
      conteudo: CHURCH_INFO.ADDRESS_LINE,
      Icon: MapPin,
    },
    {
      titulo: "Telefone",
      conteudo: CHURCH_INFO.PHONE_DISPLAY,
      Icon: Phone,
    },
    {
      titulo: "Email",
      conteudo: CHURCH_INFO.EMAIL,
      Icon: Mail,
    },
    {
      titulo: "Horários de Culto",
      conteudo: scheduleText,
      Icon: Clock,
    },
  ];

  return (
    <SiteShell>
      <section className="relative w-full h-[40vh] bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="absolute inset-0 opacity-30">
          <Image
            src={SITE_IMAGES.comunidadeAbraco}
            alt="Acolhimento na igreja"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p className="site-label-dark mb-4 md:text-sm">
            FALE CONOSCO
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-semibold mb-4">Contato</h1>
          <p className="text-lg md:text-xl">
            Estamos aqui para você. Entre em contato!
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/40">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {informacoes.map((info, index) => {
              const InfoIcon = info.Icon;
              return (
                <div
                  key={index}
                  className="bg-background p-6 rounded-lg border border-border text-center"
                >
                  <div className="mb-4 flex justify-center">
                    <InfoIcon className="h-10 w-10 text-foreground" aria-hidden />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {info.titulo}
                  </h3>
                  <p className="text-muted-foreground whitespace-pre-line text-sm">
                    {info.conteudo}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Envie uma Mensagem
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="(95) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assunto">Assunto *</Label>
                <select
                  id="assunto"
                  name="assunto"
                  value={formData.assunto}
                  onChange={handleChange}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Selecione...</option>
                  <option value="visitante">Primeira Visita</option>
                  <option value="ministerio">Participar de Ministério</option>
                  <option value="oracao">Pedido de Oração</option>
                  <option value="evento">Informações sobre Eventos</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mensagem">Mensagem *</Label>
                <Textarea
                  id="mensagem"
                  name="mensagem"
                  value={formData.mensagem}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Escreva sua mensagem aqui..."
                />
              </div>
              <Button type="submit" className="w-full" disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar Mensagem"}
              </Button>
            </form>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Localização
            </h2>
            <div
              className="bg-muted rounded-lg overflow-hidden mb-6 border border-border"
              style={{ height: "300px" }}
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.3083649999997!2d-60.67638908523426!3d2.8198899577214!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMsKwNDknMTEuNiJOIDYwwrA0MCczMy4wIlc!5e0!3m2!1spt-BR!2sbr!4v1234567890123!5m2!1spt-BR!2sbr"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Localização ${CHURCH_INFO.SHORT_NAME}`}
              />
            </div>

            <div className="bg-muted/40 p-6 rounded-lg mb-6 border border-border">
              <h3 className="text-xl font-bold text-foreground mb-4">
                Como Chegar
              </h3>
              <p className="text-muted-foreground mb-4">
                Estamos localizados em {CHURCH_INFO.CITY}, de fácil acesso por
                transporte público e com estacionamento disponível.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Bus className="h-5 w-5 shrink-0 text-foreground mt-0.5" aria-hidden />
                  <span>Ônibus: Linhas 101, 202, 303</span>
                </li>
                <li className="flex items-start gap-2">
                  <Car className="h-5 w-5 shrink-0 text-foreground mt-0.5" aria-hidden />
                  <span>Estacionamento próprio disponível</span>
                </li>
                <li className="flex items-start gap-2">
                  <Accessibility className="h-5 w-5 shrink-0 text-foreground mt-0.5" aria-hidden />
                  <span>Acessibilidade para pessoas com deficiência</span>
                </li>
              </ul>
            </div>

            <div className="bg-[var(--site-bg)] text-white p-6 rounded-2xl border border-[var(--site-line)]">
              <h3 className="text-xl font-bold mb-4">
                Redes Sociais
              </h3>
              <div className="flex gap-4">
                <a
                  href={CHURCH_INFO.INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-background text-foreground p-3 rounded-full hover:bg-foreground hover:text-background transition-all"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" aria-hidden />
                </a>
                <a
                  href={CHURCH_INFO.YOUTUBE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-background text-foreground p-3 rounded-full hover:bg-foreground hover:text-background transition-all"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5" aria-hidden />
                </a>
                <a
                  href={`https://wa.me/${CHURCH_INFO.WHATSAPP_E164}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-background text-foreground p-3 rounded-full hover:bg-foreground hover:text-background transition-all"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
