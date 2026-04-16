// app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RISK_LEVEL_LABELS } from '@/types/scoring'

const RISK_DOT: Record<string, string> = {
  green: 'hsl(142 60% 40%)',
  yellow: 'hsl(45 85% 45%)',
  orange: 'hsl(25 80% 50%)',
  red: 'hsl(355 70% 45%)',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

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
  const processingCount = analyses?.filter(a => ['scoring', 'generating'].includes(a.status)).length ?? 0

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      {/* Navigation */}
      <nav style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        <div
          className="section-container h-14 flex items-center justify-between"
          style={{ maxWidth: '1200px' }}
        >
          <div className="flex items-center gap-6">
            <a
              href="https://www.duointernational.pt"
              className="label-uppercase duo-nav-link"
              style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.45 }}
            >
              ← DUO
            </a>
            <div
              style={{
                width: '1px',
                height: '16px',
                background: 'hsl(var(--border))',
              }}
            />
            <span
              className="font-display"
              style={{ fontSize: '1rem', fontWeight: 400, color: 'hsl(var(--foreground))' }}
            >
              Turnaround <em style={{ color: 'hsl(var(--primary))' }}>AI</em>
            </span>
          </div>

          <div className="flex items-center gap-5">
            <span className="label-uppercase" style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.5 }}>
              {user.email}
            </span>
            <form action="/api/auth/signout" method="POST">
              <button
                className="label-uppercase transition-opacity duration-200"
                style={{
                  color: 'hsl(var(--muted-foreground))',
                  opacity: 0.5,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="section-container py-12 space-y-12" style={{ maxWidth: '1200px' }}>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="label-uppercase" style={{ color: 'hsl(var(--primary))', opacity: 0.7 }}>
              Painel de Controlo
            </p>
            <h1
              className="font-display"
              style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 400, color: 'hsl(var(--foreground))', lineHeight: 1.1 }}
            >
              Análises Financeiras
            </h1>
          </div>
          <Link
            href="/dashboard/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              padding: '0.6rem 1.25rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              borderRadius: 'var(--radius)',
              textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}
          >
            + Nova Análise
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-px sm:grid-cols-4"
          style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
        >
          {[
            { label: 'Total de Análises', value: analyses?.length ?? 0 },
            { label: 'Concluídas', value: completedCount },
            { label: 'Risco Crítico', value: criticalCount },
            { label: 'Em Processamento', value: processingCount },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="p-6"
              style={{
                background: 'hsl(var(--background))',
                borderLeft: i > 0 ? '1px solid hsl(var(--border))' : 'none',
              }}
            >
              <div
                className="font-display"
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 300,
                  color: 'hsl(var(--foreground))',
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
              <div className="label-uppercase mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Analyses list */}
        <div className="space-y-4">
          <div
            className="flex items-center justify-between pb-3"
            style={{ borderBottom: '1px solid hsl(var(--border))' }}
          >
            <p className="label-uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Análises Recentes
            </p>
          </div>

          {!analyses || analyses.length === 0 ? (
            <div
              className="py-20 text-center"
              style={{ border: '1px dashed hsl(var(--border))', borderRadius: 'var(--radius)' }}
            >
              <p
                className="font-display"
                style={{ fontSize: '1.25rem', fontWeight: 400, color: 'hsl(var(--foreground))', marginBottom: '0.75rem' }}
              >
                Sem análises ainda
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', marginBottom: '1.75rem' }}>
                Cria a tua primeira análise para diagnosticar uma empresa
              </p>
              <Link
                href="/dashboard/new"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  borderRadius: 'var(--radius)',
                  textDecoration: 'none',
                }}
              >
                Criar análise
              </Link>
            </div>
          ) : (
            <div>
              {analyses.map((analysis, idx) => {
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
                    className="analysis-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 0',
                      borderBottom: '1px solid hsl(var(--border))',
                      textDecoration: 'none',
                    }}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Index */}
                      <span
                        className="label-uppercase shrink-0"
                        style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.4, width: '1.5rem', textAlign: 'right' }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>

                      {/* Risk dot */}
                      {sr && (
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: RISK_DOT[sr.risk_level] ?? 'hsl(var(--muted-foreground))',
                            flexShrink: 0,
                          }}
                        />
                      )}

                      <div className="min-w-0">
                        <div className="flex items-baseline gap-3">
                          <span
                            style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}
                            className="truncate"
                          >
                            {analysis.title}
                          </span>
                          <span
                            className="label-uppercase shrink-0"
                            style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
                          >
                            {analysis.period}
                          </span>
                        </div>
                        <p
                          style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.125rem' }}
                          className="truncate"
                        >
                          {company?.name}
                          {company?.sector ? ` · ${company.sector}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 ml-6">
                      {sr ? (
                        <div className="text-right">
                          <div
                            className="font-display"
                            style={{
                              fontSize: '1.5rem',
                              fontWeight: 300,
                              color: RISK_DOT[sr.risk_level] ?? 'hsl(var(--foreground))',
                              lineHeight: 1,
                            }}
                          >
                            {sr.score}
                          </div>
                          <div className="label-uppercase mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {RISK_LEVEL_LABELS[sr.risk_level as keyof typeof RISK_LEVEL_LABELS]}
                          </div>
                        </div>
                      ) : (
                        <span
                          className="label-uppercase"
                          style={{
                            color: analysis.status === 'error' ? 'hsl(355 65% 45%)' : 'hsl(var(--muted-foreground))',
                            opacity: 0.7,
                          }}
                        >
                          {analysis.status}
                        </span>
                      )}
                      <span style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.4 }}>→</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer
        className="section-container pb-10 mt-20"
        style={{ borderTop: '1px solid hsl(var(--border))', maxWidth: '1200px' }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-6">
          <p className="label-uppercase" style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.4 }}>
            Turnaround AI · <a href="https://www.duointernational.pt" style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>DUO International</a>
          </p>
          <div className="flex items-center gap-4">
            <p className="label-uppercase" style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.3 }}>
              Análise indicativa, não constitui conselho de investimento
            </p>
            <Link
              href="/ai-act"
              className="label-uppercase"
              style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.3, textDecoration: 'none' }}
            >
              Termos · AI Act
            </Link>
            <Link
              href="/help"
              className="label-uppercase"
              style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.3, textDecoration: 'none' }}
            >
              Ajuda
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
