// types/financial.ts

export interface BalanceSheet {
  // Activo
  totalAssets: number
  currentAssets: number
  cash: number
  accountsReceivable?: number
  inventory?: number
  nonCurrentAssets?: number

  // Passivo
  totalLiabilities: number
  currentLiabilities: number
  shortTermDebt?: number
  accountsPayable?: number
  nonCurrentLiabilities?: number
  longTermDebt?: number

  // Capital Próprio
  equity: number
  retainedEarnings?: number
}

export interface IncomeStatement {
  revenue: number
  grossProfit?: number
  ebitda: number
  ebit?: number
  interestExpense: number
  netIncome: number
  depreciation?: number
  amortization?: number
}

export interface CashFlowStatement {
  operatingCashFlow?: number
  capitalExpenditure?: number
  freeCashFlow?: number
  financingCashFlow?: number
  investingCashFlow?: number
}

export interface FinancialData {
  period: string         // ex: "2024", "2023-Q4", "2023-H1"
  currency: string       // ex: "EUR", "USD"
  unit: 'units' | 'thousands' | 'millions'
  balanceSheet: BalanceSheet
  incomeStatement: IncomeStatement
  cashFlow?: CashFlowStatement
}

export interface QualitativeData {
  // Sinais críticos
  hasCovenantBreach: boolean
  hasInsolvencyProceedings: boolean
  hasMajorClientLoss: boolean       // >20% receita
  hasSeniorManagementDeparture: boolean
  hasQualifiedAuditReport: boolean
  hasSupplierPaymentDelay: boolean  // >90 dias

  // Sinais de atenção
  clientConcentrationPct?: number   // % do maior cliente
  hasRefinancingDependency: boolean
  hasNegativeEbitdaStreak: boolean  // 2+ trimestres
  hasMaterialLitigation: boolean
  hasTaxComplianceIssues: boolean

  // Sinais positivos
  hasNewFinancing: boolean
  hasNewMultiyearContract: boolean
  hasDebtRestructuringCompleted: boolean
  hasNewStrategicShareholder: boolean

  // Contexto adicional (texto livre)
  additionalContext?: string
}
