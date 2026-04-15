// lib/scoring/blocks/critical-signals.ts
import { QualitativeData } from '@/types/financial'
import { ScoringBlock, ScoringMetric, RiskFlag } from '@/types/scoring'
import { clamp } from '@/lib/utils'

interface CriticalSignalsInput {
  qualitative: QualitativeData
}

interface CriticalSignalsResult extends ScoringBlock {
  flags: RiskFlag[]
}

/**
 * Bloco 5: Sinais Críticos (peso 15%)
 *
 * Começa em 100 e vai penalizando por sinais negativos
 * ou bonificando por sinais positivos.
 */
export function calculateCriticalSignals(
  input: CriticalSignalsInput
): CriticalSignalsResult {
  const { qualitative } = input
  const flags: RiskFlag[] = []
  let score = 100

  const metrics: ScoringMetric[] = []

  // ─── Penalizações críticas ───────────────────────────────
  if (qualitative.hasCovenantBreach) {
    score -= 20
    flags.push({
      code: 'covenant_breach',
      label: 'Quebra de Covenant Bancário',
      severity: 'critical',
      impact: -20,
      description: 'Incumprimento de covenants financeiros — banco pode exigir reembolso antecipado.',
    })
  }

  if (qualitative.hasInsolvencyProceedings) {
    score -= 30
    flags.push({
      code: 'insolvency_proceedings',
      label: 'Processo de Insolvência em Curso',
      severity: 'critical',
      impact: -30,
      description: 'Acção de insolvência activa — viabilidade da empresa em risco imediato.',
    })
  }

  if (qualitative.hasMajorClientLoss) {
    score -= 15
    flags.push({
      code: 'major_client_loss',
      label: 'Perda de Cliente Principal (>20% receita)',
      severity: 'critical',
      impact: -15,
      description: 'Perda de cliente que representa mais de 20% da receita total.',
    })
  }

  if (qualitative.hasSeniorManagementDeparture) {
    score -= 10
    flags.push({
      code: 'management_departure',
      label: 'Saída de Gestão Sénior',
      severity: 'critical',
      impact: -10,
      description: 'Saída inesperada de CEO, CFO ou director operacional chave.',
    })
  }

  if (qualitative.hasQualifiedAuditReport) {
    score -= 15
    flags.push({
      code: 'qualified_audit',
      label: 'Relatório de Auditoria Qualificado',
      severity: 'critical',
      impact: -15,
      description: 'Auditor emitiu opinião com reservas ou recusou emitir opinião.',
    })
  }

  if (qualitative.hasSupplierPaymentDelay) {
    score -= 10
    flags.push({
      code: 'supplier_delay',
      label: 'Atraso em Pagamentos a Fornecedores (>90 dias)',
      severity: 'critical',
      impact: -10,
      description: 'Fornecedores não recebem atempadamente — risco de ruptura operacional.',
    })
  }

  // ─── Penalizações de atenção ─────────────────────────────
  const concentration = qualitative.clientConcentrationPct ?? 0
  if (concentration > 40) {
    const penalty = concentration > 70 ? -8 : -4
    score += penalty
    flags.push({
      code: 'client_concentration',
      label: `Concentração de Clientes (${concentration}%)`,
      severity: 'warning',
      impact: penalty,
      description: 'Dependência excessiva de um único cliente aumenta o risco de negócio.',
    })
  }

  if (qualitative.hasRefinancingDependency) {
    score -= 8
    flags.push({
      code: 'refinancing_dependency',
      label: 'Dependência de Refinanciamento',
      severity: 'warning',
      impact: -8,
      description: 'Empresa depende de refinanciamento de curto prazo para operar.',
    })
  }

  if (qualitative.hasNegativeEbitdaStreak) {
    score -= 8
    flags.push({
      code: 'negative_ebitda_streak',
      label: 'EBITDA Negativo por 2+ Trimestres',
      severity: 'warning',
      impact: -8,
      description: 'Tendência persistente de EBITDA negativo indica problemas estruturais.',
    })
  }

  if (qualitative.hasMaterialLitigation) {
    score -= 5
    flags.push({
      code: 'material_litigation',
      label: 'Litígios Materiais Pendentes',
      severity: 'warning',
      impact: -5,
      description: 'Processos judiciais com potencial impacto material nas contas.',
    })
  }

  if (qualitative.hasTaxComplianceIssues) {
    score -= 5
    flags.push({
      code: 'tax_compliance',
      label: 'Incumprimento Fiscal',
      severity: 'warning',
      impact: -5,
      description: 'Dívidas fiscais ou incumprimento de obrigações tributárias.',
    })
  }

  // ─── Bonificações ────────────────────────────────────────
  if (qualitative.hasNewFinancing) {
    score += 8
    flags.push({
      code: 'new_financing',
      label: 'Novo Financiamento Confirmado',
      severity: 'info',
      impact: 8,
      description: 'Linha de crédito ou capital aprovado — melhora liquidez futura.',
    })
  }

  if (qualitative.hasNewMultiyearContract) {
    score += 6
    flags.push({
      code: 'new_contract',
      label: 'Novo Contrato Plurianual Assinado',
      severity: 'info',
      impact: 6,
      description: 'Contrato de longo prazo garante receita previsível.',
    })
  }

  if (qualitative.hasDebtRestructuringCompleted) {
    score += 8
    flags.push({
      code: 'debt_restructuring',
      label: 'Reestruturação de Dívida Concluída',
      severity: 'info',
      impact: 8,
      description: 'Dívida renegociada — melhora perfil de vencimentos e serviço da dívida.',
    })
  }

  if (qualitative.hasNewStrategicShareholder) {
    score += 6
    flags.push({
      code: 'strategic_shareholder',
      label: 'Novo Accionista Estratégico',
      severity: 'info',
      impact: 6,
      description: 'Entrada de investidor estratégico — capital e rede de suporte.',
    })
  }

  const rawScore = clamp(score, 0, 100)

  metrics.push({
    name: 'Score de Sinais',
    value: rawScore,
    score: rawScore,
    weight: 1.0,
  })

  const criticalCount = flags.filter(f => f.severity === 'critical').length
  const interpretation = criticalCount >= 3
    ? 'Múltiplos sinais críticos identificados — situação de crise que requer intervenção imediata.'
    : criticalCount >= 1
    ? 'Sinais críticos presentes — situação requer atenção urgente e plano de acção concreto.'
    : rawScore >= 80
    ? 'Perfil de risco qualitativo favorável — sem sinais de alarme relevantes.'
    : 'Alguns sinais de atenção presentes — monitorização activa recomendada.'

  return {
    name: 'critical_signals',
    label: 'Sinais Críticos',
    weight: 0.15,
    rawScore,
    weightedScore: rawScore * 0.15,
    metrics,
    interpretation,
    flags,
  }
}
