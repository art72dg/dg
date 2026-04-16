'use client'
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col flex-1 min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      {/* Top bar */}
      <div style={{ borderBottom: '1px solid hsl(var(--border))' }} className="px-6 py-3 flex items-center justify-between">
        <a
          href="https://www.duointernational.pt"
          className="flex items-center gap-1.5 transition-opacity duration-300"
          style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.65 }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '0.65')}
        >
          <span>←</span>
          <span className="label-uppercase" style={{ fontSize: '0.625rem' }}>DUO International</span>
        </a>
        <span className="label-uppercase" style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.625rem' }}>
          turnaround-ai
        </span>
      </div>

      <div className="flex flex-col flex-1 section-container py-32 md:py-48">
        {/* Hero */}
        <div className="max-w-3xl w-full space-y-10">
          {/* Label */}
          <p className="label-uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Diagnóstico Empresarial · DUO International
          </p>

          {/* Title */}
          <div className="space-y-4">
            <h1
              className="font-display"
              style={{
                fontSize: 'clamp(3rem, 8vw, 5.5rem)',
                fontWeight: 300,
                lineHeight: 1.05,
                color: 'hsl(var(--foreground))',
                letterSpacing: '-0.01em',
              }}
            >
              Turnaround AI
            </h1>
            <p
              className="font-display"
              style={{
                fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
                fontStyle: 'italic',
                fontWeight: 400,
                color: 'hsl(var(--muted-foreground))',
                lineHeight: 1.4,
              }}
            >
              "Diagnóstico financeiro estruturado para empresas em momentos decisivos."
            </p>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid hsl(var(--border) / 0.5)', paddingTop: '2rem' }}>
            <p style={{ fontSize: '0.8125rem', lineHeight: '1.75', color: 'hsl(var(--muted-foreground))' }}>
              Scoring estruturado em 5 blocos, análise de risco e dossiers estratégicos
              gerados por IA — para decisões de investimento, reestruturação e financiamento.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center px-8 text-sm font-medium transition-opacity duration-300"
              style={{
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                borderRadius: 'var(--radius)',
                letterSpacing: '0.05em',
                opacity: 1,
              }}
            >
              Começar gratuitamente
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center px-8 text-sm font-medium transition-opacity duration-300"
              style={{
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                borderRadius: 'var(--radius)',
                letterSpacing: '0.05em',
                opacity: 0.7,
              }}
            >
              Entrar na conta
            </Link>
          </div>
        </div>

        {/* Score preview */}
        <div className="grid grid-cols-2 gap-px sm:grid-cols-4 mt-20" style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}>
          {[
            { label: "Liquidez", score: 72 },
            { label: "Rentabilidade", score: 45 },
            { label: "Estrutura", score: 38 },
            { label: "Score Global", score: 52, highlight: true },
          ].map((item, i) => (
            <div
              key={item.label}
              className="p-6 text-center"
              style={{
                background: item.highlight ? 'hsl(var(--card))' : 'hsl(var(--background))',
                borderLeft: i > 0 ? '1px solid hsl(var(--border))' : 'none',
              }}
            >
              <div
                className="font-display"
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 300,
                  color: item.highlight ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                  lineHeight: 1,
                }}
              >
                {item.score}
              </div>
              <div className="label-uppercase mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-3 mt-20" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          {[
            {
              num: "01",
              title: "Scoring em 5 Blocos",
              desc: "Liquidez, Rentabilidade, Estrutura, Operacional e Sinais Críticos — score 0 a 100 com 4 níveis de risco.",
            },
            {
              num: "02",
              title: "Dossier por IA",
              desc: "Claude Sonnet gera análise narrativa completa: diagnóstico, cenários, recomendações e plano de acção.",
            },
            {
              num: "03",
              title: "Dados Protegidos",
              desc: "Row Level Security no Supabase — os teus dados financeiros nunca são partilhados.",
            },
          ].map((f, i) => (
            <div
              key={f.title}
              className="py-8 pr-8"
              style={{
                borderRight: i < 2 ? '1px solid hsl(var(--border))' : 'none',
                paddingLeft: i > 0 ? '2rem' : '0',
              }}
            >
              <div className="label-uppercase mb-4" style={{ color: 'hsl(var(--primary))', opacity: 0.6 }}>
                {f.num}
              </div>
              <h3
                className="font-display mb-3"
                style={{ fontSize: '1.25rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: '0.8125rem', lineHeight: '1.75', color: 'hsl(var(--muted-foreground))' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer
        className="section-container pb-10 mt-auto"
        style={{ borderTop: '1px solid hsl(var(--border))' }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-8">
          <p className="label-uppercase" style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.5 }}>
            Turnaround AI · Uma ferramenta da{" "}
            <a
              href="https://www.duointernational.pt"
              style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              DUO International
            </a>
          </p>
          <div className="flex items-center gap-4">
            <p className="label-uppercase" style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.35 }}>
              Análise indicativa, não constitui conselho de investimento
            </p>
            <Link
              href="/ai-act"
              className="label-uppercase"
              style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.35, textDecoration: 'none' }}
            >
              Termos · AI Act
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
