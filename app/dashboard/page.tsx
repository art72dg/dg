// app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RISK_LEVEL_LABELS } from '@/types/scoring'
import { getRiskColor, getRiskBg } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Carregar análises recentes
  const { data: analyses } = await supabase
    .from('analyses')
    .select(`
      id, title, period, status, created_at,
      companies (name, sector),
      scoring_results (score, risk_level)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const completedCount = analyses?.filter(a => a.status === 'completed').length ?? 0
  const criticalCount = analyses?.filter((a) => {
    const sr = Array.isArray(a.scoring_results) ? a.scoring_results[0] : a.scoring_results
    return sr?.risk_level === 'red'
  }).length ?? 0

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Nav */}
      <nav className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-white">
              Turnaround <span className="text-emerald-400">AI</span>
            </span>
            <a href="https://www.duointernational.pt" target="_blank" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              duointernational.pt
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button className="text-sm text-slate-500 hover:text-slate-300">Sair</button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">Análises e diagnósticos financeiros</p>
          </div>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
          >
            + Nova Análise
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total de Análises', value: analyses?.length ?? 0, color: 'text-white' },
            { label: 'Concluídas', value: completedCount, color: 'text-emerald-400' },
            { label: 'Risco Crítico', value: criticalCount, color: 'text-red-400' },
            { label: 'Em Processamento', value: analyses?.filter(a => ['scoring','generating'].includes(a.status)).length ?? 0, color: 'text-yellow-400' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-slate-700 bg-slate-900 p-5">
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Analyses list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Análises Recentes
          </h2>

          {!analyses || analyses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-white mb-2">Ainda sem análises</h3>
              <p className="text-slate-400 text-sm mb-6">
                Cria a tua primeira análise para diagnosticar uma empresa
              </p>
              <Link
                href="/dashboard/new"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Criar análise
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {analyses.map((analysis) => {
                const sr = Array.isArray(analysis.scoring_results)
                  ? analysis.scoring_results[0]
                  : analysis.scoring_results
                const company = Array.isArray(analysis.companies)
                  ? analysis.companies[0]
                  : analysis.companies

                return (
                  <Link
                    key={analysis.id}
                    href={`/analysis/${analysis.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900 p-4 hover:border-slate-600 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-white truncate">{analysis.title}</h3>
                        <span className="text-xs text-slate-500 shrink-0">{analysis.period}</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {company?.name} · {company?.sector}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      {sr ? (
                        <div className={`rounded-lg border px-3 py-1.5 text-center ${getRiskBg(sr.risk_level)}`}>
                          <div className={`text-lg font-bold ${getRiskColor(sr.risk_level)}`}>
                            {sr.score}
                          </div>
                          <div className="text-xs text-slate-500">
                            {RISK_LEVEL_LABELS[sr.risk_level as keyof typeof RISK_LEVEL_LABELS]}
                          </div>
                        </div>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded-full border ${
                          analysis.status === 'completed' ? 'border-emerald-500/30 text-emerald-400' :
                          analysis.status === 'error' ? 'border-red-500/30 text-red-400' :
                          'border-slate-600 text-slate-400'
                        }`}>
                          {analysis.status}
                        </span>
                      )}
                      <span className="text-slate-600">→</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
