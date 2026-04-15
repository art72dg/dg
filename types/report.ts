// types/report.ts

export type AnalysisStatus = 'draft' | 'scoring' | 'generating' | 'completed' | 'error'

export type ReportSectionKey =
  | 'executive_summary'
  | 'liquidity_analysis'
  | 'profitability_analysis'
  | 'financial_structure'
  | 'operational_quality'
  | 'risk_signals'
  | 'scenarios'
  | 'recommendations'
  | 'disclaimer'

export interface ReportSection {
  key: ReportSectionKey
  title: string
  content: string          // markdown
  generatedAt: string
}

export interface AnalysisReport {
  id: string
  analysisId: string
  sections: ReportSection[]
  generatedAt: string
  modelVersion: string     // ex: "claude-sonnet-4-20250514"
  status: 'complete' | 'partial' | 'error'
  wordCount: number
}

export interface Analysis {
  id: string
  userId: string
  companyId: string
  status: AnalysisStatus
  title: string
  period: string
  report?: AnalysisReport
  scoringResultId?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  errorMessage?: string
}
