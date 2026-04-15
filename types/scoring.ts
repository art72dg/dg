// types/scoring.ts

export type RiskLevel = 'green' | 'yellow' | 'orange' | 'red'

export type BlockName =
  | 'liquidity'
  | 'profitability'
  | 'financial_structure'
  | 'operational_quality'
  | 'critical_signals'

export interface ScoringBlock {
  name: BlockName
  label: string
  weight: number           // 0–1, soma = 1.0
  rawScore: number         // 0–100 antes de pesos
  weightedScore: number    // rawScore * weight
  metrics: ScoringMetric[]
  interpretation: string
}

export interface ScoringMetric {
  name: string
  value: number | null
  benchmark?: number
  score: number            // 0–100 para esta métrica
  weight: number           // peso dentro do bloco
  flag?: 'critical' | 'warning' | 'positive'
}

export interface RiskFlag {
  code: string
  label: string
  severity: 'critical' | 'warning' | 'info'
  impact: number           // impacto no score (-15 a +8)
  description: string
}

export interface ScoringResult {
  id: string
  analysisId: string
  score: number            // 0–100, final ponderado
  riskLevel: RiskLevel
  blocks: ScoringBlock[]
  flags: RiskFlag[]
  dataCompleteness: number // 0–100%
  calculatedAt: string     // ISO 8601
  version: string          // versão do algoritmo
}

// Constantes
export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  green: 'Risco Baixo',
  yellow: 'Atenção',
  orange: 'Risco Elevado',
  red: 'Crítico',
}

export const RISK_LEVEL_THRESHOLDS: Record<RiskLevel, [number, number]> = {
  green:  [75, 100],
  yellow: [50, 74],
  orange: [25, 49],
  red:    [0,  24],
}

export const BLOCK_WEIGHTS: Record<BlockName, number> = {
  liquidity:           0.25,
  profitability:       0.20,
  financial_structure: 0.20,
  operational_quality: 0.20,
  critical_signals:    0.15,
}

export const BLOCK_LABELS: Record<BlockName, string> = {
  liquidity:           'Liquidez e Tesouraria',
  profitability:       'Rentabilidade e Margens',
  financial_structure: 'Estrutura Financeira',
  operational_quality: 'Qualidade Operacional',
  critical_signals:    'Sinais Críticos',
}
