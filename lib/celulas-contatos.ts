/** Contatos de secretaria e células (antes no Taplink pibroraimaoficial). */

export type CelulaContato = {
  id: string
  titulo: string
  telefone: string
  descricao?: string
  mensagem?: string
  destaque?: boolean
}

export const CELULAS_CONTATOS: CelulaContato[] = [
  {
    id: "secretaria",
    titulo: "Secretaria - PIB",
    telefone: "5595991522392",
    descricao: "Dúvidas gerais, informações e atendimento da igreja.",
    destaque: true,
  },
  {
    id: "desafiando-homens",
    titulo: "Célula — Desafiando Homens",
    telefone: "5595984099182",
    descricao: "Grupo de homens em comunhão e discipulado.",
    mensagem: "Olá, como faço para participar da célula de Desafiando Homens?",
  },
  {
    id: "mulheres-virtuosas",
    titulo: "Célula — Mulheres Virtuosas",
    telefone: "5595999819294",
    descricao: "Comunhão e crescimento para mulheres.",
    mensagem: "Olá, como faço para participar da célula das Mulheres Virtuosas?",
  },
  {
    id: "a3-casais",
    titulo: "Célula — A3 (Casais)",
    telefone: "5595991151464",
    descricao: "Encontro para casais.",
    mensagem: "Olá, como faço para participar da célula de jovens casados A3?",
  },
  {
    id: "avante",
    titulo: "Célula — AVANTE (Jovens Solteiros)",
    telefone: "5595981227732",
    descricao: "Jovens solteiros — Kadosh e Shamma.",
    mensagem:
      "Olá, como faço para participar da célula de jovens solteiros Kadosh e Shamma?",
  },
]

export function whatsappUrl(telefone: string, mensagem?: string): string {
  const base = `https://api.whatsapp.com/send?phone=${telefone}`
  if (!mensagem) return base
  return `${base}&text=${encodeURIComponent(mensagem)}`
}

/** Ex.: 5595991522392 → +55 95 99152-2392 */
export function formatWhatsappDisplay(telefone: string): string {
  const digits = telefone.replace(/\D/g, "")
  if (digits.length === 13 && digits.startsWith("55")) {
    const ddd = digits.slice(2, 4)
    const rest = digits.slice(4)
    const part1 = rest.slice(0, rest.length - 4)
    const part2 = rest.slice(-4)
    return `+55 ${ddd} ${part1}-${part2}`
  }
  return `+${digits}`
}
