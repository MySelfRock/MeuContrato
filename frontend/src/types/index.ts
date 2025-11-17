export enum UserPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  SIGNED = 'SIGNED',
}

export interface User {
  id: string
  email: string
  name: string
  plan: UserPlan
  credits: number
  createdAt: string
  updatedAt: string
}

export interface TemplateField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox'
  required: boolean
  placeholder?: string
  options?: string[]
}

export interface ContractTemplate {
  id: string
  name: string
  slug: string
  category: string
  description: string
  jsonSchema: {
    fields: TemplateField[]
  }
  aiPromptBase: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ContractInstance {
  id: string
  userId: string
  templateId: string
  answers: Record<string, any>
  generatedText?: string
  pdfUrl?: string
  status: ContractStatus
  createdAt: string
  updatedAt: string
  template?: {
    id: string
    name: string
    category: string
  }
  user?: {
    id: string
    name: string
    email: string
    plan: UserPlan
  }
}

export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiErrorResponse {
  error: string
  message?: string
  details?: any
}

export interface AuthResponse {
  user: User
  token: string
}

export interface UserStats {
  user: User
  stats: {
    totalContracts: number
    recentContracts: ContractInstance[]
  }
}
