'use client'
// app/dashboard/new/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { CompanySector, CompanySize } from '@/types/company'
import type { QualitativeData, AgingSchedule, TreasuryData, AssetSaleData } from '@/types/financial'

// ── Step 1 data ───────────────────────────────────────────────────────────────
interface CompanyFormData {
  name: string
  sector: CompanySector
  size: CompanySize
  country: string
  description: string
}

// ── Step 2 data ───────────────────────────────────────────────────────────────
interface FinancialFormData {
  period: string
  currency: string
  unit: 'units' | 'thousands' | 'millions'
  // Balance sheet
  totalAssets: string
  currentAssets: string
  cash: string
  accountsReceivable: string
  inventory: string
  totalLiabilities: string
  currentLiabilities: string
  shortTermDebt: string
  accountsPayable: string
  longTermDebt: string
  equity: string
  // Income statement
  revenue: string
  grossProfit: string
  ebitda: string
  ebit: string
  interestExpense: string
  netIncome: string
  // Cash flow (optional)
  operatingCashFlow: string
  capitalExpenditure: string
  freeCashFlow: string
}

// ── Step 3 data — Tesouraria & Ativos ─────────────────────────────────────────
interface AgingFormData {
  receivablesUnder30: string
  receivables30to60: string
  receivables60to90: string
  receivablesOver90: string
  receivablesDisputed: string
  payablesUnder30: string
  payables30to60: string
  payables60to90: string
  payablesOver90: string
}

interface TreasuryFormData {
  availableCreditLines: string
  committedFacilities: string
  projectedInflows30d: string
  projectedOutflows30d: string
  projectedInflows90d: string
  projectedOutflows90d: string
  daysUntilCashOut: string
}

interface AssetFormData {
  hasNonCoreRealEstate: boolean
  realEstateRealizableValue: string
  hasEquipmentForSale: boolean
  equipmentRealizableValue: string
  hasSubsidiariesForDivestiture: boolean
  subsidiariesRealizableValue: string
  hasInvestmentsForSale: boolean
  investmentsRealizableValue: string
  timelineMonths: string
}

// ── Step 4 data ───────────────────────────────────────────────────────────────
type QualFormData = Omit<QualitativeData, 'clientConcentrationPct' | 'additionalContext'> & {
  clientConcentrationPct: string
  additionalContext: string
}

const SECTORS: { value: CompanySector; label: string }[] = [
  { value: 'manufacturing', label: 'Indústria' },
  { value: 'retail', label: 'Comércio' },
  { value: 'services', label: 'Serviços' },
  { value: 'technology', label: 'Tecnologia' },
  { value: 'construction', label: 'Construção' },
  { value: 'hospitality', label: 'Hotelaria/Restauração' },
  { value: 'healthcare', label: 'Saúde' },
  { value: 'logistics', label: 'Logística' },
  { value: 'energy', label: 'Energia' },
  { value: 'agriculture', label: 'Agricultura' },
  { value: 'other', label: 'Outro' },
]

const SIZES: { value: CompanySize; label: string }[] = [
  { value: 'micro', label: 'Micro (<10 trabalhadores)' },
  { value: 'small', label: 'Pequena (10–49)' },
  { value: 'medium', label: 'Média (50–249)' },
  { value: 'large', label: 'Grande (250+)' },
]

function parseNum(val: string): number | undefined {
  const n = parseFloat(val.replace(',', '.'))
  return isNaN(n) ? undefined : n
}

function num(val: string): number {
  return parseNum(val) ?? 0
}

const initialFinancial: FinancialFormData = {
  period: new Date().getFullYear().toString(),
  currency: 'EUR',
  unit: 'thousands',
  totalAssets: '', currentAssets: '', cash: '',
  accountsReceivable: '', inventory: '',
  totalLiabilities: '', currentLiabilities: '',
  shortTermDebt: '', accountsPayable: '', longTermDebt: '', equity: '',
  revenue: '', grossProfit: '', ebitda: '', ebit: '',
  interestExpense: '', netIncome: '',
  operatingCashFlow: '', capitalExpenditure: '', freeCashFlow: '',
}

const initialAging: AgingFormData = {
  receivablesUnder30: '', receivables30to60: '', receivables60to90: '',
  receivablesOver90: '', receivablesDisputed: '',
  payablesUnder30: '', payables30to60: '', payables60to90: '', payablesOver90: '',
}

const initialTreasury: TreasuryFormData = {
  availableCreditLines: '', committedFacilities: '',
  projectedInflows30d: '', projectedOutflows30d: '',
  projectedInflows90d: '', projectedOutflows90d: '',
  daysUntilCashOut: '',
}

const initialAssets: AssetFormData = {
  hasNonCoreRealEstate: false, realEstateRealizableValue: '',
  hasEquipmentForSale: false, equipmentRealizableValue: '',
  hasSubsidiariesForDivestiture: false, subsidiariesRealizableValue: '',
  hasInvestmentsForSale: false, investmentsRealizableValue: '',
  timelineMonths: '',
}

const initialQual: QualFormData = {
  hasCovenantBreach: false,
  hasInsolvencyProceedings: false,
  hasMajorClientLoss: false,
  hasSeniorManagementDeparture: false,
  hasQualifiedAuditReport: false,
  hasSupplierPaymentDelay: false,
  clientConcentrationPct: '',
  hasRefinancingDependency: false,
  hasNegativeEbitdaStreak: false,
  hasMaterialLitigation: false,
  hasTaxComplianceIssues: false,
  hasNewFinancing: false,
  hasNewMultiyearContract: false,
  hasDebtRestructuringCompleted: false,
  hasNewStrategicShareholder: false,
  additionalContext: '',
}

const QUAL_FLAGS: { key: keyof Omit<QualFormData, 'clientConcentrationPct' | 'additionalContext'>; label: string; type: 'critical' | 'warning' | 'positive' }[] = [
  { key: 'hasCovenantBreach', label: 'Incumprimento de covenants bancários', type: 'critical' },
  { key: 'hasInsolvencyProceedings', label: 'Processos de insolvência em curso', type: 'critical' },
  { key: 'hasMajorClientLoss', label: 'Perda de cliente representando >20% receita', type: 'critical' },
  { key: 'hasSeniorManagementDeparture', label: 'Saída da gestão sénior recente', type: 'critical' },
  { key: 'hasQualifiedAuditReport', label: 'Relatório de auditoria com reservas', type: 'critical' },
  { key: 'hasSupplierPaymentDelay', label: 'Atrasos de pagamento a fornecedores (>90 dias)', type: 'critical' },
  { key: 'hasRefinancingDependency', label: 'Dependência de refinanciamento', type: 'warning' },
  { key: 'hasNegativeEbitdaStreak', label: 'EBITDA negativo em 2+ trimestres consecutivos', type: 'warning' },
  { key: 'hasMaterialLitigation', label: 'Litigação material em curso', type: 'warning' },
  { key: 'hasTaxComplianceIssues', label: 'Incumprimentos fiscais', type: 'warning' },
  { key: 'hasNewFinancing', label: 'Novo financiamento obtido', type: 'positive' },
  { key: 'hasNewMultiyearContract', label: 'Novo contrato plurianual', type: 'positive' },
  { key: 'hasDebtRestructuringCompleted', label: 'Reestruturação de dívida concluída', type: 'positive' },
  { key: 'hasNewStrategicShareholder', label: 'Novo accionista estratégico', type: 'positive' },
]

export default function NewAnalysisPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [company, setCompany] = useState<CompanyFormData>({
    name: '',
    sector: 'services',
    size: 'small',
    country: 'PT',
    description: '',
  })
  const [financial, setFinancial] = useState<FinancialFormData>(initialFinancial)
  const [hasPreviousYear, setHasPreviousYear] = useState(false)
  const [prevFinancial, setPrevFinancial] = useState<FinancialFormData>({
    ...initialFinancial,
    period: (new Date().getFullYear() - 1).toString(),
  })
  const [aging, setAging] = useState<AgingFormData>(initialAging)
  const [treasury, setTreasury] = useState<TreasuryFormData>(initialTreasury)
  const [assets, setAssets] = useState<AssetFormData>(initialAssets)
  const [qual, setQual] = useState<QualFormData>(initialQual)
  const [uploadParsing, setUploadParsing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  // ── Step 1 submit ──────────────────────────────────────────────────────────
  async function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    if (!company.name.trim()) {
      setError('O nome da empresa é obrigatório.')
      return
    }
    setError(null)
    setStep(2)
  }

  // ── Step 2 submit ──────────────────────────────────────────────────────────
  async function handleStep2(e: React.FormEvent) {
    e.preventDefault()
    if (!financial.totalAssets || !financial.totalLiabilities || !financial.equity || !financial.revenue || !financial.ebitda) {
      setError('Preenche pelo menos os campos obrigatórios (*) do balanço e demonstração de resultados.')
      return
    }
    setError(null)
    setStep(3)
  }

  // ── Step 3 submit (tesouraria & ativos) ──────────────────────────────────
  async function handleStep3(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStep(4)
  }

  // ── Step 4 submit (final) ─────────────────────────────────────────────────
  async function handleStep4(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // 1. Create company
      const { data: createdCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          user_id: user.id,
          name: company.name,
          sector: company.sector,
          size: company.size,
          country: company.country,
          description: company.description || null,
        })
        .select('id')
        .single()

      if (companyError || !createdCompany) {
        throw new Error(companyError?.message ?? 'Erro ao criar empresa')
      }

      // 2. Create analysis
      const analysisRes = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: createdCompany.id,
          title: `Análise ${company.name} — ${financial.period}`,
          period: financial.period,
        }),
      })

      if (!analysisRes.ok) {
        const body = await analysisRes.json() as { error?: string }
        throw new Error(body.error ?? 'Erro ao criar análise')
      }

      const { data: analysis } = await analysisRes.json() as { data: { id: string } }

      // 3. Save financial data
      const financialPayload = {
        analysisId: analysis.id,
        period: financial.period,
        currency: financial.currency,
        unit: financial.unit,
        balanceSheet: {
          totalAssets: num(financial.totalAssets),
          currentAssets: num(financial.currentAssets),
          cash: num(financial.cash),
          accountsReceivable: parseNum(financial.accountsReceivable),
          inventory: parseNum(financial.inventory),
          totalLiabilities: num(financial.totalLiabilities),
          currentLiabilities: num(financial.currentLiabilities),
          shortTermDebt: parseNum(financial.shortTermDebt),
          accountsPayable: parseNum(financial.accountsPayable),
          longTermDebt: parseNum(financial.longTermDebt),
          equity: num(financial.equity),
        },
        incomeStatement: {
          revenue: num(financial.revenue),
          grossProfit: parseNum(financial.grossProfit),
          ebitda: num(financial.ebitda),
          ebit: parseNum(financial.ebit),
          interestExpense: num(financial.interestExpense),
          netIncome: num(financial.netIncome),
        },
        cashFlow:
          financial.operatingCashFlow || financial.capitalExpenditure || financial.freeCashFlow
            ? {
                operatingCashFlow: parseNum(financial.operatingCashFlow),
                capitalExpenditure: parseNum(financial.capitalExpenditure),
                freeCashFlow: parseNum(financial.freeCashFlow),
              }
            : undefined,
        agingData: aging.receivablesUnder30 || aging.receivablesOver90
          ? {
              receivablesUnder30: num(aging.receivablesUnder30),
              receivables30to60: parseNum(aging.receivables30to60),
              receivables60to90: parseNum(aging.receivables60to90),
              receivablesOver90: num(aging.receivablesOver90),
              receivablesDisputed: parseNum(aging.receivablesDisputed),
              payablesUnder30: parseNum(aging.payablesUnder30),
              payables30to60: parseNum(aging.payables30to60),
              payables60to90: parseNum(aging.payables60to90),
              payablesOver90: parseNum(aging.payablesOver90),
            }
          : undefined,
        treasuryData: treasury.availableCreditLines || treasury.projectedInflows30d || treasury.daysUntilCashOut
          ? {
              availableCreditLines: parseNum(treasury.availableCreditLines),
              committedFacilities: parseNum(treasury.committedFacilities),
              projectedInflows30d: parseNum(treasury.projectedInflows30d),
              projectedOutflows30d: parseNum(treasury.projectedOutflows30d),
              projectedInflows90d: parseNum(treasury.projectedInflows90d),
              projectedOutflows90d: parseNum(treasury.projectedOutflows90d),
              daysUntilCashOut: parseNum(treasury.daysUntilCashOut),
            }
          : undefined,
        assetSaleData: assets.hasNonCoreRealEstate || assets.hasEquipmentForSale || assets.hasSubsidiariesForDivestiture || assets.hasInvestmentsForSale
          ? {
              hasNonCoreRealEstate: assets.hasNonCoreRealEstate,
              realEstateRealizableValue: parseNum(assets.realEstateRealizableValue),
              hasEquipmentForSale: assets.hasEquipmentForSale,
              equipmentRealizableValue: parseNum(assets.equipmentRealizableValue),
              hasSubsidiariesForDivestiture: assets.hasSubsidiariesForDivestiture,
              subsidiariesRealizableValue: parseNum(assets.subsidiariesRealizableValue),
              hasInvestmentsForSale: assets.hasInvestmentsForSale,
              investmentsRealizableValue: parseNum(assets.investmentsRealizableValue),
              timelineMonths: parseNum(assets.timelineMonths),
            }
          : undefined,
        qualitativeData: {
          hasCovenantBreach: qual.hasCovenantBreach,
          hasInsolvencyProceedings: qual.hasInsolvencyProceedings,
          hasMajorClientLoss: qual.hasMajorClientLoss,
          hasSeniorManagementDeparture: qual.hasSeniorManagementDeparture,
          hasQualifiedAuditReport: qual.hasQualifiedAuditReport,
          hasSupplierPaymentDelay: qual.hasSupplierPaymentDelay,
          clientConcentrationPct: parseNum(qual.clientConcentrationPct),
          hasRefinancingDependency: qual.hasRefinancingDependency,
          hasNegativeEbitdaStreak: qual.hasNegativeEbitdaStreak,
          hasMaterialLitigation: qual.hasMaterialLitigation,
          hasTaxComplianceIssues: qual.hasTaxComplianceIssues,
          hasNewFinancing: qual.hasNewFinancing,
          hasNewMultiyearContract: qual.hasNewMultiyearContract,
          hasDebtRestructuringCompleted: qual.hasDebtRestructuringCompleted,
          hasNewStrategicShareholder: qual.hasNewStrategicShareholder,
          additionalContext: qual.additionalContext || undefined,
        },
      }

      const financialRes = await fetch('/api/financial-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(financialPayload),
      })

      if (!financialRes.ok) {
        const body = await financialRes.json() as { error?: string }
        throw new Error(body.error ?? 'Erro ao guardar dados financeiros')
      }

      // 4. Run scoring
      const scoringPayload = {
        analysisId: analysis.id,
        financialData: {
          period: financial.period,
          currency: financial.currency,
          unit: financial.unit,
          balanceSheet: {
            totalAssets: num(financial.totalAssets),
            currentAssets: num(financial.currentAssets),
            cash: num(financial.cash),
            accountsReceivable: parseNum(financial.accountsReceivable),
            inventory: parseNum(financial.inventory),
            totalLiabilities: num(financial.totalLiabilities),
            currentLiabilities: num(financial.currentLiabilities),
            shortTermDebt: parseNum(financial.shortTermDebt),
            accountsPayable: parseNum(financial.accountsPayable),
            longTermDebt: parseNum(financial.longTermDebt),
            equity: num(financial.equity),
          },
          incomeStatement: {
            revenue: num(financial.revenue),
            grossProfit: parseNum(financial.grossProfit),
            ebitda: num(financial.ebitda),
            ebit: parseNum(financial.ebit),
            interestExpense: num(financial.interestExpense),
            netIncome: num(financial.netIncome),
          },
          cashFlow:
            financial.operatingCashFlow || financial.capitalExpenditure || financial.freeCashFlow
              ? {
                  operatingCashFlow: parseNum(financial.operatingCashFlow),
                  capitalExpenditure: parseNum(financial.capitalExpenditure),
                  freeCashFlow: parseNum(financial.freeCashFlow),
                }
              : undefined,
        },
        previousYearData: buildPreviousYearData(),
        agingData: aging.receivablesUnder30 || aging.receivablesOver90
          ? {
              receivablesUnder30: num(aging.receivablesUnder30),
              receivables30to60: parseNum(aging.receivables30to60),
              receivables60to90: parseNum(aging.receivables60to90),
              receivablesOver90: num(aging.receivablesOver90),
              receivablesDisputed: parseNum(aging.receivablesDisputed),
              payablesUnder30: parseNum(aging.payablesUnder30),
              payables30to60: parseNum(aging.payables30to60),
              payables60to90: parseNum(aging.payables60to90),
              payablesOver90: parseNum(aging.payablesOver90),
            }
          : undefined,
        treasuryData: treasury.availableCreditLines || treasury.projectedInflows30d || treasury.daysUntilCashOut
          ? {
              availableCreditLines: parseNum(treasury.availableCreditLines),
              committedFacilities: parseNum(treasury.committedFacilities),
              projectedInflows30d: parseNum(treasury.projectedInflows30d),
              projectedOutflows30d: parseNum(treasury.projectedOutflows30d),
              projectedInflows90d: parseNum(treasury.projectedInflows90d),
              projectedOutflows90d: parseNum(treasury.projectedOutflows90d),
              daysUntilCashOut: parseNum(treasury.daysUntilCashOut),
            }
          : undefined,
        assetSaleData: assets.hasNonCoreRealEstate || assets.hasEquipmentForSale || assets.hasSubsidiariesForDivestiture || assets.hasInvestmentsForSale
          ? {
              hasNonCoreRealEstate: assets.hasNonCoreRealEstate,
              realEstateRealizableValue: parseNum(assets.realEstateRealizableValue),
              hasEquipmentForSale: assets.hasEquipmentForSale,
              equipmentRealizableValue: parseNum(assets.equipmentRealizableValue),
              hasSubsidiariesForDivestiture: assets.hasSubsidiariesForDivestiture,
              subsidiariesRealizableValue: parseNum(assets.subsidiariesRealizableValue),
              hasInvestmentsForSale: assets.hasInvestmentsForSale,
              investmentsRealizableValue: parseNum(assets.investmentsRealizableValue),
              timelineMonths: parseNum(assets.timelineMonths),
            }
          : undefined,
        qualitativeData: {
          hasCovenantBreach: qual.hasCovenantBreach,
          hasInsolvencyProceedings: qual.hasInsolvencyProceedings,
          hasMajorClientLoss: qual.hasMajorClientLoss,
          hasSeniorManagementDeparture: qual.hasSeniorManagementDeparture,
          hasQualifiedAuditReport: qual.hasQualifiedAuditReport,
          hasSupplierPaymentDelay: qual.hasSupplierPaymentDelay,
          clientConcentrationPct: parseNum(qual.clientConcentrationPct),
          hasRefinancingDependency: qual.hasRefinancingDependency,
          hasNegativeEbitdaStreak: qual.hasNegativeEbitdaStreak,
          hasMaterialLitigation: qual.hasMaterialLitigation,
          hasTaxComplianceIssues: qual.hasTaxComplianceIssues,
          hasNewFinancing: qual.hasNewFinancing,
          hasNewMultiyearContract: qual.hasNewMultiyearContract,
          hasDebtRestructuringCompleted: qual.hasDebtRestructuringCompleted,
          hasNewStrategicShareholder: qual.hasNewStrategicShareholder,
          additionalContext: qual.additionalContext || undefined,
        },
      }

      const scoringRes = await fetch('/api/scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoringPayload),
      })

      if (!scoringRes.ok) {
        const body = await scoringRes.json() as { error?: string }
        throw new Error(body.error ?? 'Erro no scoring')
      }

      router.push(`/analysis/${analysis.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tenta novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function setF(key: keyof FinancialFormData, value: string) {
    setFinancial(prev => ({ ...prev, [key]: value }))
  }

  function setPF(key: keyof FinancialFormData, value: string) {
    setPrevFinancial(prev => ({ ...prev, [key]: value }))
  }

  function setAg(key: keyof AgingFormData, value: string) {
    setAging(prev => ({ ...prev, [key]: value }))
  }

  function setTr(key: keyof TreasuryFormData, value: string) {
    setTreasury(prev => ({ ...prev, [key]: value }))
  }

  function setAs(key: keyof AssetFormData, value: boolean | string) {
    setAssets(prev => ({ ...prev, [key]: value }))
  }

  function setQ(key: keyof QualFormData, value: boolean | string) {
    setQual(prev => ({ ...prev, [key]: value }))
  }

  // ── File upload & parse ───────────────────────────────────────────────────
  async function handleFileUpload(file: File) {
    setUploadParsing(true)
    setUploadError(null)
    setUploadSuccess(false)

    try {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/parse-financial-file', { method: 'POST', body: form })
      const body = await res.json() as { data?: Record<string, unknown>; error?: string }

      if (!res.ok || !body.data) {
        throw new Error(body.error ?? 'Erro ao processar ficheiro')
      }

      const d = body.data

      // ── Pre-fill current year financial form ─────────────────────────────
      if (d.period && typeof d.period === 'string') setF('period', d.period)
      if (d.currency && typeof d.currency === 'string') setF('currency', d.currency)
      if (d.unit && typeof d.unit === 'string') setF('unit', d.unit as 'units' | 'thousands' | 'millions')

      const bs = d.balanceSheet as Record<string, number> | undefined
      if (bs) {
        if (bs.totalAssets)       setF('totalAssets',       String(bs.totalAssets))
        if (bs.currentAssets)     setF('currentAssets',     String(bs.currentAssets))
        if (bs.cash)              setF('cash',              String(bs.cash))
        if (bs.accountsReceivable) setF('accountsReceivable', String(bs.accountsReceivable))
        if (bs.inventory)         setF('inventory',         String(bs.inventory))
        if (bs.totalLiabilities)  setF('totalLiabilities',  String(bs.totalLiabilities))
        if (bs.currentLiabilities) setF('currentLiabilities', String(bs.currentLiabilities))
        if (bs.shortTermDebt)     setF('shortTermDebt',     String(bs.shortTermDebt))
        if (bs.accountsPayable)   setF('accountsPayable',   String(bs.accountsPayable))
        if (bs.longTermDebt)      setF('longTermDebt',      String(bs.longTermDebt))
        if (bs.equity)            setF('equity',            String(bs.equity))
      }

      const is = d.incomeStatement as Record<string, number> | undefined
      if (is) {
        if (is.revenue)         setF('revenue',         String(is.revenue))
        if (is.grossProfit)     setF('grossProfit',     String(is.grossProfit))
        if (is.ebitda)          setF('ebitda',          String(is.ebitda))
        if (is.ebit)            setF('ebit',            String(is.ebit))
        if (is.interestExpense) setF('interestExpense', String(is.interestExpense))
        if (is.netIncome)       setF('netIncome',       String(is.netIncome))
      }

      const cf = d.cashFlow as Record<string, number> | undefined
      if (cf) {
        if (cf.operatingCashFlow)   setF('operatingCashFlow',   String(cf.operatingCashFlow))
        if (cf.capitalExpenditure)  setF('capitalExpenditure',  String(cf.capitalExpenditure))
        if (cf.freeCashFlow)        setF('freeCashFlow',        String(cf.freeCashFlow))
      }

      // ── Pre-fill aging data ───────────────────────────────────────────────
      const ag = d.agingData as Record<string, number> | undefined
      if (ag) {
        if (ag.receivablesUnder30) setAg('receivablesUnder30', String(ag.receivablesUnder30))
        if (ag.receivables30to60)  setAg('receivables30to60',  String(ag.receivables30to60))
        if (ag.receivables60to90)  setAg('receivables60to90',  String(ag.receivables60to90))
        if (ag.receivablesOver90)  setAg('receivablesOver90',  String(ag.receivablesOver90))
        if (ag.receivablesDisputed) setAg('receivablesDisputed', String(ag.receivablesDisputed))
        if (ag.payablesUnder30)    setAg('payablesUnder30',    String(ag.payablesUnder30))
        if (ag.payables30to60)     setAg('payables30to60',     String(ag.payables30to60))
        if (ag.payables60to90)     setAg('payables60to90',     String(ag.payables60to90))
        if (ag.payablesOver90)     setAg('payablesOver90',     String(ag.payablesOver90))
      }

      // ── Pre-fill treasury data ────────────────────────────────────────────
      const tr = d.treasuryData as Record<string, number> | undefined
      if (tr) {
        if (tr.availableCreditLines)  setTr('availableCreditLines',  String(tr.availableCreditLines))
        if (tr.committedFacilities)   setTr('committedFacilities',   String(tr.committedFacilities))
        if (tr.projectedInflows30d)   setTr('projectedInflows30d',   String(tr.projectedInflows30d))
        if (tr.projectedOutflows30d)  setTr('projectedOutflows30d',  String(tr.projectedOutflows30d))
        if (tr.projectedInflows90d)   setTr('projectedInflows90d',   String(tr.projectedInflows90d))
        if (tr.projectedOutflows90d)  setTr('projectedOutflows90d',  String(tr.projectedOutflows90d))
        if (tr.daysUntilCashOut)      setTr('daysUntilCashOut',      String(tr.daysUntilCashOut))
      }

      // ── Pre-fill previous year data ────────────────────────────────────────
      const prev = d.previousYear as Record<string, unknown> | undefined
      if (prev) {
        setHasPreviousYear(true)
        if (prev.period && typeof prev.period === 'string') setPF('period', prev.period)
        const pbs = prev.balanceSheet as Record<string, number> | undefined
        if (pbs) {
          if (pbs.totalAssets)       setPF('totalAssets',       String(pbs.totalAssets))
          if (pbs.currentAssets)     setPF('currentAssets',     String(pbs.currentAssets))
          if (pbs.cash)              setPF('cash',              String(pbs.cash))
          if (pbs.totalLiabilities)  setPF('totalLiabilities',  String(pbs.totalLiabilities))
          if (pbs.currentLiabilities) setPF('currentLiabilities', String(pbs.currentLiabilities))
          if (pbs.longTermDebt)      setPF('longTermDebt',      String(pbs.longTermDebt))
          if (pbs.equity)            setPF('equity',            String(pbs.equity))
        }
        const pis = prev.incomeStatement as Record<string, number> | undefined
        if (pis) {
          if (pis.revenue)         setPF('revenue',         String(pis.revenue))
          if (pis.ebitda)          setPF('ebitda',          String(pis.ebitda))
          if (pis.netIncome)       setPF('netIncome',       String(pis.netIncome))
          if (pis.interestExpense) setPF('interestExpense', String(pis.interestExpense))
        }
      }

      setUploadSuccess(true)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro ao processar ficheiro')
    } finally {
      setUploadParsing(false)
    }
  }

  // ── Build previousYearData for scoring API ────────────────────────────────
  function buildPreviousYearData() {
    if (!hasPreviousYear || !prevFinancial.totalAssets) return undefined
    return {
      period: prevFinancial.period,
      currency: prevFinancial.currency,
      unit: prevFinancial.unit,
      balanceSheet: {
        totalAssets: num(prevFinancial.totalAssets),
        currentAssets: num(prevFinancial.currentAssets),
        cash: num(prevFinancial.cash),
        accountsReceivable: parseNum(prevFinancial.accountsReceivable),
        inventory: parseNum(prevFinancial.inventory),
        totalLiabilities: num(prevFinancial.totalLiabilities),
        currentLiabilities: num(prevFinancial.currentLiabilities),
        shortTermDebt: parseNum(prevFinancial.shortTermDebt),
        accountsPayable: parseNum(prevFinancial.accountsPayable),
        longTermDebt: parseNum(prevFinancial.longTermDebt),
        equity: num(prevFinancial.equity),
      },
      incomeStatement: {
        revenue: num(prevFinancial.revenue),
        grossProfit: parseNum(prevFinancial.grossProfit),
        ebitda: num(prevFinancial.ebitda),
        ebit: parseNum(prevFinancial.ebit),
        interestExpense: num(prevFinancial.interestExpense),
        netIncome: num(prevFinancial.netIncome),
      },
      cashFlow:
        prevFinancial.operatingCashFlow || prevFinancial.capitalExpenditure || prevFinancial.freeCashFlow
          ? {
              operatingCashFlow: parseNum(prevFinancial.operatingCashFlow),
              capitalExpenditure: parseNum(prevFinancial.capitalExpenditure),
              freeCashFlow: parseNum(prevFinancial.freeCashFlow),
            }
          : undefined,
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Nav */}
      <nav className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-white">
            Turnaround <span className="text-emerald-400">AI</span>
          </span>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header & stepper */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Nova Análise</h1>
          <p className="text-slate-400 text-sm">
            Preenche os dados para gerar um dossier de diagnóstico
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {[
            { n: 1, label: 'Empresa' },
            { n: 2, label: 'Financeiro' },
            { n: 3, label: 'Tesouraria' },
            { n: 4, label: 'Sinais' },
          ].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  n === step
                    ? 'bg-emerald-500 text-slate-950'
                    : n < step
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {n < step ? '✓' : n}
              </div>
              <span
                className={`text-sm ${
                  n === step ? 'text-white font-medium' : 'text-slate-500'
                }`}
              >
                {label}
              </span>
              {n < 4 && <div className="w-8 h-px bg-slate-700 mx-1" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ── Step 1: Company info ──────────────────────────────────────────── */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Informação da Empresa</h2>
              <p className="text-sm text-slate-400">Dados de identificação e caracterização</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep1} className="space-y-5">
                <Input
                  label="Nome da Empresa *"
                  value={company.name}
                  onChange={e => setCompany(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Empresa Exemplo S.A."
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">Sector *</label>
                    <select
                      value={company.sector}
                      onChange={e => setCompany(p => ({ ...p, sector: e.target.value as CompanySector }))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {SECTORS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">Dimensão *</label>
                    <select
                      value={company.size}
                      onChange={e => setCompany(p => ({ ...p, size: e.target.value as CompanySize }))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {SIZES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input
                  label="País (código ISO)"
                  value={company.country}
                  onChange={e => setCompany(p => ({ ...p, country: e.target.value.toUpperCase().slice(0, 2) }))}
                  placeholder="PT"
                  helperText="Código de 2 letras, ex: PT, ES, FR"
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">Descrição (opcional)</label>
                  <textarea
                    value={company.description}
                    onChange={e => setCompany(p => ({ ...p, description: e.target.value }))}
                    placeholder="Breve descrição da actividade da empresa..."
                    rows={3}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit">
                    Continuar →
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Financial data ────────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-6">

            {/* ── File upload card ───────────────────────────────────────────── */}
            <Card>
              <CardContent>
                <div className="py-1">
                  <p className="text-sm font-medium text-white mb-1">
                    Importar dados de um ficheiro
                    <span className="ml-2 text-xs font-normal text-slate-500">(opcional)</span>
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    Carrega um PDF, Excel (.xlsx), CSV ou imagem com os dados financeiros — a IA extrai os valores automaticamente.
                  </p>

                  <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
                    uploadParsing
                      ? 'border-slate-700 bg-slate-900/50 cursor-not-allowed'
                      : 'border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-950/10'
                  }`}>
                    <input
                      type="file"
                      accept=".pdf,.xlsx,.xls,.csv,.txt,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      disabled={uploadParsing}
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file)
                        e.target.value = '' // reset so same file can be re-uploaded
                      }}
                    />
                    {uploadParsing ? (
                      <>
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                        <span className="text-sm text-slate-400">A extrair dados com IA...</span>
                      </>
                    ) : uploadSuccess ? (
                      <>
                        <span className="text-2xl">✓</span>
                        <span className="text-sm text-emerald-400 font-medium">Dados extraídos com sucesso</span>
                        <span className="text-xs text-slate-500">Clica para substituir com outro ficheiro</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl text-slate-500">📎</span>
                        <span className="text-sm text-slate-400">
                          Arrasta ou clica para carregar ficheiro
                        </span>
                        <span className="text-xs text-slate-600">PDF · Excel · CSV · JPG · PNG — máx. 20 MB</span>
                      </>
                    )}
                  </label>

                  {uploadError && (
                    <p className="mt-2 text-xs text-red-400">{uploadError}</p>
                  )}
                  {uploadSuccess && (
                    <p className="mt-2 text-xs text-slate-500">
                      Os campos foram pré-preenchidos. Verifica e ajusta os valores antes de continuar.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Period & unit */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-white">Dados Financeiros</h2>
                <p className="text-sm text-slate-400">Período e moeda de referência</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Período *"
                    value={financial.period}
                    onChange={e => setF('period', e.target.value)}
                    placeholder="2024"
                    helperText="Ex: 2024, 2023-Q4, 2023-H1"
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">Moeda</label>
                    <select
                      value={financial.currency}
                      onChange={e => setF('currency', e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {['EUR', 'USD', 'GBP', 'BRL'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">Unidade</label>
                    <select
                      value={financial.unit}
                      onChange={e => setF('unit', e.target.value as 'units' | 'thousands' | 'millions')}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="units">Unidades (€)</option>
                      <option value="thousands">Milhares (k€)</option>
                      <option value="millions">Milhões (M€)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Balance sheet */}
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-white">Balanço</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Activo</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Total do Activo *" type="number" value={financial.totalAssets} onChange={e => setF('totalAssets', e.target.value)} placeholder="0" />
                    <Input label="Activo Corrente *" type="number" value={financial.currentAssets} onChange={e => setF('currentAssets', e.target.value)} placeholder="0" />
                    <Input label="Caixa e Equivalentes *" type="number" value={financial.cash} onChange={e => setF('cash', e.target.value)} placeholder="0" />
                    <Input label="Contas a Receber" type="number" value={financial.accountsReceivable} onChange={e => setF('accountsReceivable', e.target.value)} placeholder="0" />
                    <Input label="Inventários" type="number" value={financial.inventory} onChange={e => setF('inventory', e.target.value)} placeholder="0" />
                  </div>

                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-2">Passivo</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Total do Passivo *" type="number" value={financial.totalLiabilities} onChange={e => setF('totalLiabilities', e.target.value)} placeholder="0" />
                    <Input label="Passivo Corrente *" type="number" value={financial.currentLiabilities} onChange={e => setF('currentLiabilities', e.target.value)} placeholder="0" />
                    <Input label="Dívida Curto Prazo" type="number" value={financial.shortTermDebt} onChange={e => setF('shortTermDebt', e.target.value)} placeholder="0" />
                    <Input label="Fornecedores (a pagar)" type="number" value={financial.accountsPayable} onChange={e => setF('accountsPayable', e.target.value)} placeholder="0" />
                    <Input label="Dívida Longo Prazo" type="number" value={financial.longTermDebt} onChange={e => setF('longTermDebt', e.target.value)} placeholder="0" />
                  </div>

                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-2">Capital Próprio</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Capital Próprio Total *" type="number" value={financial.equity} onChange={e => setF('equity', e.target.value)} placeholder="0" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Income statement */}
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-white">Demonstração de Resultados</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Volume de Negócios *" type="number" value={financial.revenue} onChange={e => setF('revenue', e.target.value)} placeholder="0" />
                  <Input label="Resultado Bruto" type="number" value={financial.grossProfit} onChange={e => setF('grossProfit', e.target.value)} placeholder="0" />
                  <Input label="EBITDA *" type="number" value={financial.ebitda} onChange={e => setF('ebitda', e.target.value)} placeholder="0" />
                  <Input label="EBIT" type="number" value={financial.ebit} onChange={e => setF('ebit', e.target.value)} placeholder="0" />
                  <Input label="Encargos Financeiros *" type="number" value={financial.interestExpense} onChange={e => setF('interestExpense', e.target.value)} placeholder="0" />
                  <Input label="Resultado Líquido *" type="number" value={financial.netIncome} onChange={e => setF('netIncome', e.target.value)} placeholder="0" />
                </div>
              </CardContent>
            </Card>

            {/* Cash flow (optional) */}
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-white">
                  Fluxos de Caixa{' '}
                  <span className="text-sm font-normal text-slate-500">(opcional)</span>
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="Cash Flow Operacional" type="number" value={financial.operatingCashFlow} onChange={e => setF('operatingCashFlow', e.target.value)} placeholder="0" />
                  <Input label="CAPEX" type="number" value={financial.capitalExpenditure} onChange={e => setF('capitalExpenditure', e.target.value)} placeholder="0" />
                  <Input label="Free Cash Flow" type="number" value={financial.freeCashFlow} onChange={e => setF('freeCashFlow', e.target.value)} placeholder="0" />
                </div>
              </CardContent>
            </Card>

            {/* ── Previous year toggle ─────────────────────────────────────── */}
            <Card>
              <CardContent>
                <button
                  type="button"
                  onClick={() => setHasPreviousYear(p => !p)}
                  className="w-full flex items-center justify-between py-1 text-left group"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      Tenho dados do ano anterior
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Activa a análise de tendência YoY (crescimento de receita, margens, dívida…)
                    </p>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${hasPreviousYear ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                    <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${hasPreviousYear ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </button>

                {hasPreviousYear && (
                  <div className="mt-6 space-y-5 border-t border-slate-800 pt-6">
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      Dados do Ano Anterior
                    </p>

                    {/* Period row */}
                    <div className="grid grid-cols-3 gap-4">
                      <Input
                        label="Período anterior *"
                        value={prevFinancial.period}
                        onChange={e => setPF('period', e.target.value)}
                        placeholder={(new Date().getFullYear() - 1).toString()}
                      />
                    </div>

                    {/* Balance sheet */}
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Balanço — Activo</p>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Total do Activo *" type="number" value={prevFinancial.totalAssets} onChange={e => setPF('totalAssets', e.target.value)} placeholder="0" />
                      <Input label="Activo Corrente *" type="number" value={prevFinancial.currentAssets} onChange={e => setPF('currentAssets', e.target.value)} placeholder="0" />
                      <Input label="Caixa e Equivalentes" type="number" value={prevFinancial.cash} onChange={e => setPF('cash', e.target.value)} placeholder="0" />
                      <Input label="Contas a Receber" type="number" value={prevFinancial.accountsReceivable} onChange={e => setPF('accountsReceivable', e.target.value)} placeholder="0" />
                    </div>

                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-1">Balanço — Passivo & Capital Próprio</p>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Total do Passivo *" type="number" value={prevFinancial.totalLiabilities} onChange={e => setPF('totalLiabilities', e.target.value)} placeholder="0" />
                      <Input label="Passivo Corrente" type="number" value={prevFinancial.currentLiabilities} onChange={e => setPF('currentLiabilities', e.target.value)} placeholder="0" />
                      <Input label="Dívida Total" type="number" value={prevFinancial.longTermDebt} onChange={e => setPF('longTermDebt', e.target.value)} placeholder="0" />
                      <Input label="Capital Próprio *" type="number" value={prevFinancial.equity} onChange={e => setPF('equity', e.target.value)} placeholder="0" />
                    </div>

                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-1">Demonstração de Resultados</p>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Volume de Negócios *" type="number" value={prevFinancial.revenue} onChange={e => setPF('revenue', e.target.value)} placeholder="0" />
                      <Input label="EBITDA *" type="number" value={prevFinancial.ebitda} onChange={e => setPF('ebitda', e.target.value)} placeholder="0" />
                      <Input label="Resultado Líquido" type="number" value={prevFinancial.netIncome} onChange={e => setPF('netIncome', e.target.value)} placeholder="0" />
                      <Input label="Encargos Financeiros" type="number" value={prevFinancial.interestExpense} onChange={e => setPF('interestExpense', e.target.value)} placeholder="0" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="secondary" type="button" onClick={() => { setError(null); setStep(1) }}>
                ← Anterior
              </Button>
              <Button type="submit">
                Continuar →
              </Button>
            </div>
          </form>
        )}

        {/* ── Step 3: Tesouraria & Ativos ──────────────────────────────────────── */}
        {step === 3 && (
          <form onSubmit={handleStep3} className="space-y-6">

            {/* Aging — Clientes */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-white">Antiguidade de Saldos — Clientes</h2>
                <p className="text-sm text-slate-400">Decomposição das contas a receber por prazo de vencimento</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Corrente (< 30 dias)" type="number" value={aging.receivablesUnder30} onChange={e => setAg('receivablesUnder30', e.target.value)} placeholder="0" />
                  <Input label="30–60 dias" type="number" value={aging.receivables30to60} onChange={e => setAg('receivables30to60', e.target.value)} placeholder="0" />
                  <Input label="60–90 dias" type="number" value={aging.receivables60to90} onChange={e => setAg('receivables60to90', e.target.value)} placeholder="0" />
                  <Input label="> 90 dias (risco)" type="number" value={aging.receivablesOver90} onChange={e => setAg('receivablesOver90', e.target.value)} placeholder="0" />
                  <Input label="Em litígio / disputa" type="number" value={aging.receivablesDisputed} onChange={e => setAg('receivablesDisputed', e.target.value)} placeholder="0" helperText="Valor de créditos em disputa formal" />
                </div>
              </CardContent>
            </Card>

            {/* Aging — Fornecedores */}
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-white">Antiguidade de Saldos — Fornecedores</h2>
                <p className="text-sm text-slate-400">Decomposição das contas a pagar por prazo</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Corrente (< 30 dias)" type="number" value={aging.payablesUnder30} onChange={e => setAg('payablesUnder30', e.target.value)} placeholder="0" />
                  <Input label="30–60 dias" type="number" value={aging.payables30to60} onChange={e => setAg('payables30to60', e.target.value)} placeholder="0" />
                  <Input label="60–90 dias" type="number" value={aging.payables60to90} onChange={e => setAg('payables60to90', e.target.value)} placeholder="0" />
                  <Input label="> 90 dias (atraso grave)" type="number" value={aging.payablesOver90} onChange={e => setAg('payablesOver90', e.target.value)} placeholder="0" />
                </div>
              </CardContent>
            </Card>

            {/* Treasury */}
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-white">Disponibilidade de Tesouraria</h2>
                <p className="text-sm text-slate-400">Liquidez disponível e projeções de curto prazo</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Linhas de crédito disponíveis"
                      type="number"
                      value={treasury.availableCreditLines}
                      onChange={e => setTr('availableCreditLines', e.target.value)}
                      placeholder="0"
                      helperText="Crédito aprovado não utilizado"
                    />
                    <Input
                      label="Facilidades comprometidas"
                      type="number"
                      value={treasury.committedFacilities}
                      onChange={e => setTr('committedFacilities', e.target.value)}
                      placeholder="0"
                      helperText="Ex: factoring, confirming"
                    />
                    <Input
                      label="Dias até esgotar caixa"
                      type="number"
                      value={treasury.daysUntilCashOut}
                      onChange={e => setTr('daysUntilCashOut', e.target.value)}
                      placeholder="Ex: 90"
                      helperText="Cash runway estimado (burn rate)"
                    />
                  </div>

                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-2">Projeções de Caixa</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Entradas previstas a 30 dias" type="number" value={treasury.projectedInflows30d} onChange={e => setTr('projectedInflows30d', e.target.value)} placeholder="0" />
                    <Input label="Saídas previstas a 30 dias" type="number" value={treasury.projectedOutflows30d} onChange={e => setTr('projectedOutflows30d', e.target.value)} placeholder="0" />
                    <Input label="Entradas previstas a 90 dias" type="number" value={treasury.projectedInflows90d} onChange={e => setTr('projectedInflows90d', e.target.value)} placeholder="0" />
                    <Input label="Saídas previstas a 90 dias" type="number" value={treasury.projectedOutflows90d} onChange={e => setTr('projectedOutflows90d', e.target.value)} placeholder="0" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Asset sales */}
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-white">Possibilidade de Venda de Activos</h2>
                <p className="text-sm text-slate-400">Activos não estratégicos com potencial de monetização</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {([
                    { key: 'hasNonCoreRealEstate' as const, valKey: 'realEstateRealizableValue' as const, label: 'Imóveis não estratégicos', placeholder: 'Valor realizável estimado' },
                    { key: 'hasEquipmentForSale' as const, valKey: 'equipmentRealizableValue' as const, label: 'Equipamento / maquinaria', placeholder: 'Valor realizável estimado' },
                    { key: 'hasSubsidiariesForDivestiture' as const, valKey: 'subsidiariesRealizableValue' as const, label: 'Participações / subsidiárias', placeholder: 'Valor realizável estimado' },
                    { key: 'hasInvestmentsForSale' as const, valKey: 'investmentsRealizableValue' as const, label: 'Investimentos financeiros', placeholder: 'Valor realizável estimado' },
                  ] as const).map(item => (
                    <div key={item.key} className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={assets[item.key]}
                          onChange={e => setAs(item.key, e.target.checked)}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                        />
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{item.label}</span>
                      </label>
                      {assets[item.key] && (
                        <div className="ml-7">
                          <Input
                            label={item.placeholder}
                            type="number"
                            value={assets[item.valKey]}
                            onChange={e => setAs(item.valKey, e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {(assets.hasNonCoreRealEstate || assets.hasEquipmentForSale || assets.hasSubsidiariesForDivestiture || assets.hasInvestmentsForSale) && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                      <Input
                        label="Prazo de realização (meses)"
                        type="number"
                        value={assets.timelineMonths}
                        onChange={e => setAs('timelineMonths', e.target.value)}
                        placeholder="Ex: 6"
                        helperText="Estimativa para concluir as vendas"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="secondary" type="button" onClick={() => { setError(null); setStep(2) }}>
                ← Anterior
              </Button>
              <Button type="submit">
                Continuar →
              </Button>
            </div>
          </form>
        )}

        {/* ── Step 4: Qualitative signals ───────────────────────────────────── */}
        {step === 4 && (
          <form onSubmit={handleStep4} className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-white">Sinais Qualitativos</h2>
                <p className="text-sm text-slate-400">
                  Selecciona os alertas que se aplicam a esta empresa
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Critical */}
                  <div>
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">
                      Sinais Críticos
                    </p>
                    <div className="space-y-3">
                      {QUAL_FLAGS.filter(f => f.type === 'critical').map(flag => (
                        <label
                          key={flag.key}
                          className="flex items-start gap-3 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={qual[flag.key] as boolean}
                            onChange={e => setQ(flag.key, e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                          />
                          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                            {flag.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Warning */}
                  <div>
                    <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-3">
                      Sinais de Atenção
                    </p>
                    <div className="space-y-3">
                      {QUAL_FLAGS.filter(f => f.type === 'warning').map(flag => (
                        <label
                          key={flag.key}
                          className="flex items-start gap-3 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={qual[flag.key] as boolean}
                            onChange={e => setQ(flag.key, e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                          />
                          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                            {flag.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Positive */}
                  <div>
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                      Factores Positivos
                    </p>
                    <div className="space-y-3">
                      {QUAL_FLAGS.filter(f => f.type === 'positive').map(flag => (
                        <label
                          key={flag.key}
                          className="flex items-start gap-3 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={qual[flag.key] as boolean}
                            onChange={e => setQ(flag.key, e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                          />
                          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                            {flag.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Concentration + context */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                    <Input
                      label="Concentração no maior cliente (%)"
                      type="number"
                      value={qual.clientConcentrationPct}
                      onChange={e => setQ('clientConcentrationPct', e.target.value)}
                      placeholder="Ex: 35"
                      helperText="Percentagem da receita total"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300">
                      Contexto adicional (opcional)
                    </label>
                    <textarea
                      value={qual.additionalContext}
                      onChange={e => setQ('additionalContext', e.target.value)}
                      placeholder="Informação relevante adicional que não está reflectida nos dados acima..."
                      rows={4}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="secondary" type="button" onClick={() => { setError(null); setStep(3) }}>
                ← Anterior
              </Button>
              <Button type="submit" loading={submitting}>
                {submitting ? 'A calcular score...' : 'Calcular Score →'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
