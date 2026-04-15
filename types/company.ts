// types/company.ts

export type CompanySector =
  | 'manufacturing'
  | 'retail'
  | 'services'
  | 'technology'
  | 'construction'
  | 'hospitality'
  | 'healthcare'
  | 'logistics'
  | 'energy'
  | 'agriculture'
  | 'other'

export type CompanySize = 'micro' | 'small' | 'medium' | 'large'

export interface Company {
  id: string
  userId: string
  name: string
  nif?: string           // Número de Identificação Fiscal
  sector: CompanySector
  size: CompanySize
  country: string        // ISO 3166-1 alpha-2
  foundedYear?: number
  numberOfEmployees?: number
  website?: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CompanyProfile extends Company {
  // Dados enriquecidos para análise
  mainProducts?: string[]
  mainClients?: string[]          // sem nomes se confidencial
  mainSuppliers?: string[]
  keyRisks?: string[]
  competitivePosition?: string
  ownershipStructure?: string
  managementTeamYears?: number    // anos médios de gestão na empresa
}
