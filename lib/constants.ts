// Constantes globais do projeto

// Configuracoes de validacao
export const VALIDATION_CONFIG = {
  NOME_MIN_LENGTH: 3,
  NOME_MAX_LENGTH: 100,
  TELEFONE_MIN_LENGTH: 14,
  TELEFONE_MAX_LENGTH: 15,
  CIDADE_MAX_LENGTH: 50,
  BAIRRO_MAX_LENGTH: 50,
} as const

// Mensagens de erro padrao
export const ERROR_MESSAGES = {
  NOME_REQUIRED: "Nome e obrigatorio",
  NOME_MIN_LENGTH: `Nome deve ter pelo menos ${VALIDATION_CONFIG.NOME_MIN_LENGTH} caracteres`,
  NOME_MAX_LENGTH: `Nome deve ter no maximo ${VALIDATION_CONFIG.NOME_MAX_LENGTH} caracteres`,
  NOME_INVALID_CHARS: "Nome deve conter apenas letras e espacos",
  TELEFONE_INVALID: "Formato de telefone invalido",
  TELEFONE_REQUIRED: "Telefone e obrigatorio",
  CIDADE_MAX_LENGTH: `Cidade deve ter no maximo ${VALIDATION_CONFIG.CIDADE_MAX_LENGTH} caracteres`,
  BAIRRO_MAX_LENGTH: `Bairro deve ter no maximo ${VALIDATION_CONFIG.BAIRRO_MAX_LENGTH} caracteres`,
  SEXO_REQUIRED: "Por favor selecione uma opcao",
} as const

// Configuracoes de UI
export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 3000,
  LOADING_DELAY: 500,
} as const

// Regex patterns
export const REGEX_PATTERNS = {
  NOME: /^[a-zA-ZÀ-ÿ\s]+$/,
  TELEFONE: /^\(\d{2}\) \d{4,5}-\d{4}$/,
  APENAS_NUMEROS: /\D/g,
} as const

// Configuracoes de autenticacao
export const AUTH_CONFIG = {
  STORAGE_KEY: "pib_auth",
  ADMIN_PASSWORD: "igreja123",
} as const

// URLs e contatos
export const CONTACT_INFO = {
  CAPELANIA_PHONE: "+55 95 9152-2392",
  CAPELANIA_CONTACT: "Manuela",
  PASTOR: "Pr. Marcelo",
} as const

export const CHURCH_INFO = {
  NAME: "Primeira Igreja Batista de Roraima",
  SHORT_NAME: "PIB Roraima",
  CITY: "Boa Vista, RR",
  ADDRESS_LINE: "Rua General Penha Brasil, 345 - Centro",
  ADDRESS_FULL: "Rua General Penha Brasil, 345 - Centro, Boa Vista, RR",
  MAPS_EMBED_URL:
    "https://www.google.com/maps?q=Rua+General+Penha+Brasil,+345,+Centro,+Boa+Vista,+RR&hl=pt-BR&z=17&output=embed",
  EMAIL: "contato@pibr.org.br",
  PHONE_DISPLAY: CONTACT_INFO.CAPELANIA_PHONE,
  WHATSAPP_E164: "559591522392",
  INSTAGRAM_URL: "https://www.instagram.com/pibroraimaoficial/",
  YOUTUBE_URL: "https://www.youtube.com/@primeiraigrejabatistarorai8230",
  YOUTUBE_CHANNEL_ID: "UCIbxja1EbdUKBsB9xizP4GA",
  SCHEDULE: [
    { day: "Domingo", time: "19h", label: "Culto" },
    { day: "Quarta", time: "19h30", label: "Oração" },
  ],
  BRAND_GOLD: "#c9a84c",
  BRAND_GOLD_HOVER: "#d4b85c",
} as const
