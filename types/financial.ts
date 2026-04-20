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
  agingData?: AgingSchedule
  treasuryData?: TreasuryData
  assetSaleData?: AssetSaleData
}

export interface YoYTrend {
  previousPeriod: string
  revenueGrowthPct: number | null       // % crescimento receita
  ebitdaMarginChangePp: number | null   // variação pp margem EBITDA
  netMarginChangePp: number | null      // variação pp margem líquida
  equityChangePct: number | null        // % variação capital próprio
  debtChangePct: number | null          // % variação dívida total
  cashChangePct: number | null          // % variação tesouraria
  currentRatioChange: number | null     // variação absoluta current ratio
}

// ── Aging schedules (antiguidade de saldos) ──────────────────────────────
export interface AgingSchedule {
  // Clientes — contas a receber
  receivablesUnder30: number       // < 30 dias correntes
  receivables30to60?: number       // 30–60 dias
  receivables60to90?: number       // 60–90 dias
  receivablesOver90: number        // > 90 dias (risco de incobrabilidade)
  receivablesDisputed?: number     // montante em litígio/disputa

  // Fornecedores — contas a pagar
  payablesUnder30?: number         // < 30 dias
  payables30to60?: number          // 30–60 dias
  payables60to90?: number          // 60–90 dias
  payablesOver90?: number          // > 90 dias (atraso grave)
}

// ── Treasury & liquidity data ────────────────────────────────────────────
export interface TreasuryData {
  availableCreditLines?: number    // linhas de crédito disponíveis não utilizadas
  committedFacilities?: number     // facilidades comprometidas mas não utilizadas
  projectedInflows30d?: number     // entradas de caixa previstas a 30 dias
  projectedOutflows30d?: number    // saídas de caixa previstas a 30 dias
  projectedInflows90d?: number     // entradas de caixa previstas a 90 dias
  projectedOutflows90d?: number    // saídas de caixa previstas a 90 dias
  daysUntilCashOut?: number        // dias estimados até esgotamento de caixa (burn)
}

// ── Asset sale potential ──────────────────────────────────────────────────
export interface AssetSaleData {
  hasNonCoreRealEstate: boolean
  realEstateRealizableValue?: number        // valor realizável estimado
  hasEquipmentForSale: boolean
  equipmentRealizableValue?: number
  hasSubsidiariesForDivestiture: boolean
  subsidiariesRealizableValue?: number
  hasInvestmentsForSale: boolean
  investmentsRealizableValue?: number
  totalEstimatedRealizableValue?: number    // soma estimada total
  timelineMonths?: number                   // prazo estimado para realização (meses)
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
