// app/analysis/[id]/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ScoreRing } from '@/components/scoring/score-ring'
import { RiskBadge } from '@/components/scoring/risk-badge'
import { ScoreBreakdown } from '@/components/scoring/score-breakdown'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { GenerateDossierButton } from './generate-dossier-button'
import { StatusPoller } from './status-poller'
import type { AnalysisStatus } from '@/types/report'
import type { ScoringBlock, RiskLevel, RiskFlag } from '@/types/scoring'
import type { ReportSection } from '@/types/report'

interface PageProps {
  params: Promise<{ id: string }>
}

// Simple markdown-to-html (headings, bold, bullets, line breaks)
function markdownToHtml(md: string): string {
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // headings
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-white mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-white mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-white mt-6 mb-2">$1</h1>')
    // bold + italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-slate-300 italic">$1</em>')
    // bullet lists
    .replace(/^[-•] (.+)$/gm, '<li class="ml-4 text-slate-300">$1</li>')
    // numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-slate-300">$1</li>')
    // paragraphs (double newline)
    .replace(/\n\n/g, '</p><p class="text-slate-300 leading-relaxed mb-3">')
    // single newlines → br
    .replace(/\n/g, '<br/>')
}

function renderMarkdown(content: string): string {
  return `<p class="text-slate-300 leading-relaxed mb-3">${markdownToHtml(content)}</p>`
}

function StatusCard({
  status,
  analysisId,
  errorMessage,
}: {
  status: AnalysisStatus
  analysisId: string
  errorMessage?: string | null
}) {
  const configs: Record<string, { icon: string; title: string; description: string; color: string }> = {
    draft: {
      icon: '📋',
      title: 'Rascunho',
      description: 'A análise foi criada e o score calculado. Clica em "Gerar Dossier" para produzir o relatório completo.',
      color: 'text-slate-400',
    },
    scoring: {
      icon: '⚙️',
      title: 'A calcular score...',
      description: 'O motor de scoring está a processar os dados financeiros.',
      color: 'text-yellow-400',
    },
    generating: {
      icon: '🤖',
      title: 'A gerar dossier...',
      description: 'A IA está a produzir o relatório de análise. Pode demorar alguns minutos.',
      color: 'text-emerald-400',
    },
    error: {
      icon: '⚠️',
      title: 'Erro',
      description: errorMessage ?? 'Ocorreu um erro durante o processamento.',
      color: 'text-red-400',
    },
  }

  const config = configs[status] ?? configs.draft

  return (
    <Card className="max-w-lg mx-auto">
      <CardContent>
        <div className="text-center py-8 space-y-4">
          <div className="text-5xl">{config.icon}</div>
          <div>
            <h3 className={`text-xl font-semibold ${config.color}`}>{config.title}</h3>
            <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">{config.description}</p>
          </div>
          {(status === 'draft' || status === 'error') && (
            <GenerateDossierButton analysisId={analysisId} />
          )}
          {(status === 'scoring' || status === 'generating') && (
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>A processar...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function AnalysisPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load analysis with company
  const { data: analysis } = await supabase
    .from('analyses')
    .select('*, companies(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!analysis) redirect('/dashboard')

  // Load scoring result
  const { data: scoringData } = await supabase
    .from('scoring_results')
    .select('*')
    .eq('analysis_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Load report
  const { data: reportData } = await supabase
    .from('analysis_reports')
    .select('*')
    .eq('analysis_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const status = analysis.status as AnalysisStatus
  const company = Array.isArray(analysis.companies) ? analysis.companies[0] : analysis.companies
  const scoring = scoringData
    ? {
        score: scoringData.score as number,
        riskLevel: scoringData.risk_level as RiskLevel,
        blocks: (scoringData.blocks ?? []) as ScoringBlock[],
        flags: (scoringData.flags ?? []) as RiskFlag[],
        dataCompleteness: scoringData.data_completeness as number,
      }
    : null

  const reportSections = reportData
    ? (reportData.sections as ReportSection[])
    : null

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Auto-refresh enquanto status for scoring/generating */}
      <StatusPoller status={status} />

      {/* Nav */}
      <nav className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-white">
            Turnaround <span className="text-emerald-400">AI</span>
          </span>
          <Link
            href="/dashboard"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{analysis.title}</h1>
            <p className="text-slate-400 mt-1">
              {company?.name}
              {company?.sector && (
                <span className="ml-2 text-slate-500">· {company.sector}</span>
              )}
              <span className="ml-2 text-slate-600">· {analysis.period}</span>
            </p>
          </div>
          {scoring && (
            <div className="flex items-center gap-4 shrink-0">
              <ScoreRing
                score={scoring.score}
                riskLevel={scoring.riskLevel}
                size={100}
              />
              <div className="space-y-2">
                <RiskBadge riskLevel={scoring.riskLevel} size="lg" />
                <p className="text-xs text-slate-500">
                  Completude: {Math.round(scoring.dataCompleteness)}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Status: not completed ───────────────────────────────────────── */}
        {status !== 'completed' && (
          <StatusCard
            status={status}
            analysisId={id}
            errorMessage={analysis.error_message as string | null}
          />
        )}

        {/* ── Completed dossier ───────────────────────────────────────────── */}
        {status === 'completed' && scoring && (
          <>
            {/* Score breakdown */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-white">Decomposição do Score</h2>
                <p className="text-sm text-slate-400">
                  Análise por bloco (5 dimensões)
                </p>
              </CardHeader>
              <CardContent>
                <ScoreBreakdown blocks={scoring.blocks} />
              </CardContent>
            </Card>

            {/* Risk flags */}
            {scoring.flags.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-white">Alertas e Sinais</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scoring.flags.map(flag => (
                      <div
                        key={flag.code}
                        className={`flex items-start gap-3 rounded-lg border p-3 ${
                          flag.severity === 'critical'
                            ? 'border-red-500/30 bg-red-950/20'
                            : flag.severity === 'warning'
                            ? 'border-yellow-500/30 bg-yellow-950/20'
                            : 'border-emerald-500/30 bg-emerald-950/20'
                        }`}
                      >
                        <span className="text-lg">
                          {flag.severity === 'critical' ? '🔴' : flag.severity === 'warning' ? '🟡' : '🟢'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            flag.severity === 'critical'
                              ? 'text-red-400'
                              : flag.severity === 'warning'
                              ? 'text-yellow-400'
                              : 'text-emerald-400'
                          }`}>
                            {flag.label}
                          </p>
                          {flag.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{flag.description}</p>
                          )}
                        </div>
                        <span className={`text-xs font-mono tabular-nums shrink-0 ${
                          flag.impact < 0 ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {flag.impact > 0 ? '+' : ''}{flag.impact}pts
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Report sections */}
            {reportSections && reportSections.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white">Relatório de Análise</h2>
                {reportSections
                  .filter(s => s.key !== 'disclaimer')
                  .map(section => (
                    <Card key={section.key}>
                      <CardHeader>
                        <h3 className="text-base font-semibold text-white">{section.title}</h3>
                      </CardHeader>
                      <CardContent>
                        <div
                          className="prose-sm text-slate-300 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(section.content) }}
                        />
                      </CardContent>
                    </Card>
                  ))}

                {/* Disclaimer */}
                {reportSections.find(s => s.key === 'disclaimer') && (
                  <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-6 py-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Aviso Legal
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {reportSections.find(s => s.key === 'disclaimer')?.content}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Generate report if scoring done but no report yet */}
            {!reportSections && (
              <StatusCard status="draft" analysisId={id} />
            )}
          </>
        )}

        {/* Footer metadata */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-600 pt-4 border-t border-slate-800">
          <span>ID: {id}</span>
          <span>Criado: {new Date(analysis.created_at as string).toLocaleDateString('pt-PT')}</span>
          {analysis.completed_at && (
            <span>Concluído: {new Date(analysis.completed_at as string).toLocaleDateString('pt-PT')}</span>
          )}
          {reportData && (
            <span>Modelo: {reportData.model_version as string}</span>
          )}
        </div>
      </div>
    </div>
  )
}
