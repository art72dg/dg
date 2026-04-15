import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col flex-1 items-center justify-center min-h-screen bg-slate-950 px-6">
      {/* Hero */}
      <div className="max-w-3xl w-full text-center space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-sm text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Diagnóstico financeiro por IA
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Turnaround{" "}
          <span className="text-emerald-400">AI</span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Diagnóstico financeiro premium para empresas em dificuldade.
          Scoring estruturado em 5 blocos, análise de risco e dossiers
          estratégicos gerados por IA em minutos.
        </p>

        {/* Score preview */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mt-8">
          {[
            { label: "Liquidez", score: 72, color: "yellow" },
            { label: "Rentabilidade", score: 45, color: "orange" },
            { label: "Estrutura", score: 38, color: "orange" },
            { label: "Score Global", score: 52, color: "yellow", highlight: true },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border p-4 text-center ${
                item.highlight
                  ? "border-emerald-500/30 bg-emerald-950/30"
                  : "border-slate-700 bg-slate-900"
              }`}
            >
              <div className={`text-3xl font-bold ${
                item.color === "yellow" ? "text-yellow-400" :
                item.color === "orange" ? "text-orange-400" :
                "text-emerald-400"
              }`}>
                {item.score}
              </div>
              <div className="text-xs text-slate-500 mt-1">{item.label}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-emerald-500 px-8 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
          >
            Começar gratuitamente
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-700 px-8 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
          >
            Entrar na conta
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mt-16 text-left">
          {[
            {
              icon: "📊",
              title: "Scoring em 5 Blocos",
              desc: "Liquidez, Rentabilidade, Estrutura, Operacional e Sinais Críticos — score 0 a 100 com 4 níveis de risco.",
            },
            {
              icon: "🤖",
              title: "Dossier por IA",
              desc: "Claude Sonnet gera análise narrativa completa: diagnóstico, cenários, recomendações e plano de acção.",
            },
            {
              icon: "🔒",
              title: "Dados Protegidos",
              desc: "Row Level Security no Supabase — os teus dados financeiros nunca são partilhados.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-700 bg-slate-900 p-6">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 text-center text-xs text-slate-600 pb-8">
        Turnaround AI · Análise indicativa, não constitui conselho de investimento
      </footer>
    </main>
  );
}
