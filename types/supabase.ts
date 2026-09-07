// Tipos do banco de dados (Neon PostgreSQL)

export interface Visitante {
  id: string
  nome: string
  celular: string
  sexo: string | null
  cidade: string | null
  cidade_outra: string | null
  bairro: string | null
  faixa_etaria: string | null
  civil_status: string | null
  membro_igreja: boolean
  quer_visita: boolean
  data_cadastro: string
  sem_whatsapp: boolean
  /** @deprecated use user_id — legado da tabela responsaveis */
  responsavel_id: string | null
  /** Responsável atual (users.id) */
  user_id?: string | null
}

export interface VisitanteInsert {
  nome: string
  celular: string
  sexo?: string | null
  cidade?: string | null
  cidade_outra?: string | null
  bairro?: string | null
  faixa_etaria?: string | null
  civil_status?: string | null
  membro_igreja?: boolean
  quer_visita?: boolean
  sem_whatsapp?: boolean
  responsavel_id?: string | null
}

export interface VisitanteUpdate {
  nome?: string
  celular?: string
  sexo?: string | null
  cidade?: string | null
  cidade_outra?: string | null
  bairro?: string | null
  faixa_etaria?: string | null
  civil_status?: string | null
  membro_igreja?: boolean
  quer_visita?: boolean
  sem_whatsapp?: boolean
  responsavel_id?: string | null
}

export interface Responsavel {
  id: string
  nome: string
  criado_em: string
}

export type VisitanteComResponsavel = Visitante & {
  responsavel_nome?: string | null
}

// --- Message system types ---

export interface MensagemCategoria {
  id: string
  nome: string
  descricao: string | null
  ordem: number
  ativa: boolean
  created_at: string
  updated_at: string
  modelos: MensagemModelo[]
}

export interface MensagemModelo {
  id: string
  categoria_id: string
  titulo: string
  corpo: string
  ordem: number
  created_at: string
  updated_at: string
}

export interface VisitanteMensagemEnviada {
  id: string
  visitante_id: string
  categoria_id: string
  enviada_em: string
}

// Enums para campos do formulario

export const FaixaEtariaEnum = {
  ADOLESCENTE: "Adolescente",
  JOVEM: "Jovem",
  ADULTO: "Adulto",
  IDOSO: "Idoso",
} as const

export type FaixaEtariaType = (typeof FaixaEtariaEnum)[keyof typeof FaixaEtariaEnum]

export const SexoEnum = {
  MASCULINO: "Masculino",
  FEMININO: "Feminino",
} as const

export type SexoType = (typeof SexoEnum)[keyof typeof SexoEnum]

export const CivilStatusEnum = {
  SOLTEIRO: "Solteiro",
  CASADO: "Casado",
  DIVORCIADO: "Divorciado",
  VIUVO: "Viuvo",
} as const

export type CivilStatusType = (typeof CivilStatusEnum)[keyof typeof CivilStatusEnum]

export const CidadeEnum = {
  BV: "BV - moro",
  OUTRA: "Outra",
} as const

export type CidadeType = (typeof CidadeEnum)[keyof typeof CidadeEnum]

export function isValidSexo(sexo: string): sexo is SexoType {
  return Object.values(SexoEnum).includes(sexo as SexoType)
}

export function isValidFaixaEtaria(faixa: string): faixa is FaixaEtariaType {
  return Object.values(FaixaEtariaEnum).includes(faixa as FaixaEtariaType)
}

export function isValidCivilStatus(status: string): status is CivilStatusType {
  return Object.values(CivilStatusEnum).includes(status as CivilStatusType)
}

// --- Evento models/positions types ---

export interface EventoModelo {
  id: string
  nome: string
  tipo: string
  horario: string | null
  descricao: string | null
  criado_em: string
  posicoes?: EventoPosicao[]
}

export interface EventoPosicao {
  id: string
  evento_id: string | null
  modelo_id: string | null
  ministerio_id: string
  funcao: string
  quantidade: number
  criado_em: string
  ministerio_nome?: string
  ministerio_icone?: string
}

// Role types
export type UserRole = "admin" | "supervisor" | "lider" | "membro"
