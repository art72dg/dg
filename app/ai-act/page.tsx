import Link from 'next/link'

export default function AIActPage() {
  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>

      {/* Top bar */}
      <div style={{ borderBottom: '1px solid hsl(var(--border))' }} className="px-6 py-3 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5"
          style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.65, textDecoration: 'none', transition: 'opacity 0.2s' }}
        >
          <span>←</span>
          <span className="label-uppercase">Turnaround AI</span>
        </Link>
        <span className="label-uppercase" style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.5 }}>
          Conformidade · AI Act
        </span>
      </div>

      <div className="section-container py-20 md:py-32" style={{ maxWidth: '800px' }}>

        {/* Header */}
        <div className="space-y-6 mb-20">
          <p className="label-uppercase" style={{ color: 'hsl(var(--primary))', opacity: 0.7 }}>
            Regulamento UE 2024/1689 · Conformidade
          </p>
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
              fontWeight: 300,
              lineHeight: 1.1,
              color: 'hsl(var(--foreground))',
              letterSpacing: '-0.01em',
            }}
          >
            Termos de Conformidade AI Act
          </h1>
          <p style={{ fontSize: '0.8125rem', lineHeight: '1.75', color: 'hsl(var(--muted-foreground))' }}>
            Este documento descreve a classificação, obrigações e limitações do sistema Turnaround AI
            ao abrigo do Regulamento da UE sobre Inteligência Artificial (Reg. UE 2024/1689),
            em vigor a partir de 2 de agosto de 2026. Última actualização: Abril 2026.
          </p>
        </div>

        {/* Section divider helper — rendered inline per section */}

        {/* 1. Classificação do Sistema de IA */}
        <section className="mb-16" style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '2.5rem' }}>
          <p className="label-uppercase mb-6" style={{ color: 'hsl(var(--primary))', opacity: 0.6 }}>01</p>
          <h2
            className="font-display mb-8"
            style={{ fontSize: '1.5rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}
          >
            Classificação do Sistema de IA
          </h2>

          <div className="space-y-0" style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}>
            {[
              { label: 'Nome do Sistema', value: 'Turnaround AI' },
              { label: 'Fornecedor', value: 'DUO International, Lda.' },
              { label: 'Versão', value: '1.0' },
              { label: 'Data', value: 'Abril 2026' },
              { label: 'Classificação', value: 'Sistema de IA de Risco Limitado (Art. 50, Reg. UE 2024/1689)' },
              { label: 'Finalidade', value: 'Apoio à decisão em diagnóstico financeiro empresarial' },
              { label: 'Modelo Subjacente', value: 'Anthropic Claude (claude-sonnet-4-5) — sistema de IA de uso geral (GPAI)' },
            ].map((row, i) => (
              <div
                key={row.label}
                className="flex flex-col sm:flex-row"
                style={{
                  borderBottom: i < 6 ? '1px solid hsl(var(--border))' : 'none',
                  padding: '0.875rem 1.25rem',
                  gap: '0.5rem',
                }}
              >
                <span
                  className="label-uppercase shrink-0"
                  style={{ color: 'hsl(var(--muted-foreground))', width: '14rem', opacity: 0.6 }}
                >
                  {row.label}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--foreground))', lineHeight: 1.6 }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Obrigações de Transparência */}
        <section className="mb-16" style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '2.5rem' }}>
          <p className="label-uppercase mb-6" style={{ color: 'hsl(var(--primary))', opacity: 0.6 }}>02</p>
          <h2
            className="font-display mb-4"
            style={{ fontSize: '1.5rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}
          >
            Obrigações de Transparência (Art. 50)
          </h2>
          <p style={{ fontSize: '0.8125rem', lineHeight: '1.75', color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem' }}>
            Enquanto sistema de IA de risco limitado, o Turnaround AI cumpre as seguintes obrigações de transparência:
          </p>
          <ul className="space-y-3">
            {[
              'Identificação clara: todo o conteúdo gerado por IA é sempre identificado como tal, sem excepção.',
              'O utilizador é sempre informado que está a interagir com um sistema de inteligência artificial.',
              'Os relatórios e dossiers produzidos pela plataforma contêm a marca de água editorial "Gerado por IA — Turnaround AI".',
              'A natureza automatizada da análise é explicitada em todos os pontos de entrega de resultados.',
            ].map((item) => (
              <li
                key={item}
                style={{
                  fontSize: '0.8125rem',
                  lineHeight: '1.75',
                  color: 'hsl(var(--foreground))',
                  paddingLeft: '1.25rem',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '0.6em',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'hsl(var(--primary) / 0.5)',
                    display: 'inline-block',
                  }}
                />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 3. Supervisão Humana */}
        <section className="mb-16" style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '2.5rem' }}>
          <p className="label-uppercase mb-6" style={{ color: 'hsl(var(--primary))', opacity: 0.6 }}>03</p>
          <h2
            className="font-display mb-4"
            style={{ fontSize: '1.5rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}
          >
            Supervisão Humana
          </h2>
          <p style={{ fontSize: '0.8125rem', lineHeight: '1.75', color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem' }}>
            O Turnaround AI opera exclusivamente como ferramenta de apoio à decisão humana:
          </p>
          <ul className="space-y-3">
            {[
              'O sistema não toma decisões autónomas — é exclusivamente uma ferramenta de apoio à deliberação humana.',
              'Todas as análises requerem validação por profissional qualificado antes de qualquer decisão de negócio, investimento ou reestruturação.',
              'O utilizador é o responsável final por qualquer decisão de investimento, reestruturação ou financiamento tomada com base nos outputs da plataforma.',
            ].map((item) => (
              <li
                key={item}
                style={{
                  fontSize: '0.8125rem',
                  lineHeight: '1.75',
                  color: 'hsl(var(--foreground))',
                  paddingLeft: '1.25rem',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '0.6em',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'hsl(var(--primary) / 0.5)',
                    display: 'inline-block',
                  }}
                />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 4. Limitações e Precisão */}
        <section className="mb-16" style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '2.5rem' }}>
          <p className="label-uppercase mb-6" style={{ color: 'hsl(var(--primary))', opacity: 0.6 }}>04</p>
          <h2
            className="font-display mb-4"
            style={{ fontSize: '1.5rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}
          >
            Limitações e Precisão
          </h2>
          <p style={{ fontSize: '0.8125rem', lineHeight: '1.75', color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem' }}>
            O utilizador deve ter em conta as seguintes limitações inerentes ao sistema:
          </p>
          <ul className="space-y-3">
            {[
              'Os scores são modelos estatísticos calculados com base nos dados introduzidos pelo utilizador — não são dados auditados nem verificados por terceiros.',
              'A qualidade e fiabilidade da análise dependem directamente da qualidade, completude e exactidão dos dados fornecidos.',
              'O sistema não tem acesso a bases de dados externas, mercados financeiros, registos públicos ou quaisquer fontes de informação em tempo real.',
              'Os resultados podem conter erros, omissões ou imprecisões. Nenhuma análise deve ser utilizada como única fonte de informação para decisões críticas.',
            ].map((item) => (
              <li
                key={item}
                style={{
                  fontSize: '0.8125rem',
                  lineHeight: '1.75',
                  color: 'hsl(var(--foreground))',
                  paddingLeft: '1.25rem',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '0.6em',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'hsl(var(--primary) / 0.5)',
                    display: 'inline-block',
                  }}
                />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 5. Proibições Aplicáveis */}
        <section className="mb-16" style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '2.5rem' }}>
          <p className="label-uppercase mb-6" style={{ color: 'hsl(var(--primary))', opacity: 0.6 }}>05</p>
          <h2
            className="font-display mb-4"
            style={{ fontSize: '1.5rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}
          >
            Proibições Aplicáveis (Art. 5)
          </h2>
          <p style={{ fontSize: '0.8125rem', lineHeight: '1.75', color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem' }}>
            O Turnaround AI não é e não pode ser utilizado para as seguintes finalidades proibidas pelo Art. 5 do Regulamento:
          </p>
          <ul className="space-y-3">
            {[
              'O sistema não é utilizado para avaliação de risco de crédito de consumidores — destina-se exclusivamente a utilização B2B (empresas e profissionais).',
              'Não é utilizado para scoring social, discriminação de pessoas singulares ou para decisões com impacto directo sobre direitos individuais.',
              'Não utiliza quaisquer técnicas de manipulação subconsciente, subliminar ou enganosa.',
            ].map((item) => (
              <li
                key={item}
                style={{
                  fontSize: '0.8125rem',
                  lineHeight: '1.75',
                  color: 'hsl(var(--foreground))',
                  paddingLeft: '1.25rem',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '0.6em',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'hsl(var(--primary) / 0.5)',
                    display: 'inline-block',
                  }}
                />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 6. Dados e Privacidade */}
        <section className="mb-16" style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '2.5rem' }}>
          <p className="label-uppercase mb-6" style={{ color: 'hsl(var(--primary))', opacity: 0.6 }}>06</p>
          <h2
            className="font-display mb-4"
            style={{ fontSize: '1.5rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}
          >
            Dados e Privacidade
          </h2>
          <ul className="space-y-3">
            {[
              'Os dados financeiros processados são armazenados com isolamento por utilizador através de Row Level Security (RLS) na camada de base de dados.',
              'Os dados introduzidos na plataforma não são utilizados para treino de modelos de IA, por parte da DUO International ou de terceiros.',
              'Retenção de dados: conforme a política de privacidade DUO International, disponível em duointernational.pt.',
              'Conformidade com o Regulamento Geral de Protecção de Dados (RGPD, Reg. UE 2016/679).',
            ].map((item) => (
              <li
                key={item}
                style={{
                  fontSize: '0.8125rem',
                  lineHeight: '1.75',
                  color: 'hsl(var(--foreground))',
                  paddingLeft: '1.25rem',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '0.6em',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'hsl(var(--primary) / 0.5)',
                    display: 'inline-block',
                  }}
                />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 7. Direito de Recurso */}
        <section className="mb-16" style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '2.5rem' }}>
          <p className="label-uppercase mb-6" style={{ color: 'hsl(var(--primary))', opacity: 0.6 }}>07</p>
          <h2
            className="font-display mb-4"
            style={{ fontSize: '1.5rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}
          >
            Direito de Recurso
          </h2>
          <ul className="space-y-3">
            {[
              'O utilizador pode contestar qualquer análise gerada pela plataforma, solicitando revisão ou clarificação.',
              'Para questões relacionadas com o sistema de IA, transparência ou conformidade: geral@duointernational.pt',
              'Autoridade de supervisão nacional competente: CNPD — Comissão Nacional de Protecção de Dados (Portugal).',
              'Autoridade reguladora sectorial: ANACOM — Autoridade Nacional de Comunicações.',
            ].map((item) => (
              <li
                key={item}
                style={{
                  fontSize: '0.8125rem',
                  lineHeight: '1.75',
                  color: 'hsl(var(--foreground))',
                  paddingLeft: '1.25rem',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '0.6em',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'hsl(var(--primary) / 0.5)',
                    display: 'inline-block',
                  }}
                />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 8. Disclaimer Legal */}
        <section className="mb-20" style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '2.5rem' }}>
          <p className="label-uppercase mb-6" style={{ color: 'hsl(var(--primary))', opacity: 0.6 }}>08</p>
          <h2
            className="font-display mb-6"
            style={{ fontSize: '1.5rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}
          >
            Disclaimer Legal
          </h2>
          <blockquote
            style={{
              borderLeft: '2px solid hsl(var(--primary) / 0.4)',
              paddingLeft: '1.5rem',
              marginLeft: 0,
            }}
          >
            <p
              className="font-display"
              style={{
                fontSize: '1.0625rem',
                fontStyle: 'italic',
                fontWeight: 400,
                lineHeight: 1.7,
                color: 'hsl(var(--foreground))',
              }}
            >
              "A Turnaround AI é uma ferramenta de apoio à decisão. Os resultados gerados não
              constituem conselho de investimento, consultoria financeira, avaliação pericial ou
              parecer jurídico. A DUO International não assume responsabilidade por decisões
              tomadas com base nesta análise."
            </p>
          </blockquote>
        </section>

      </div>

      {/* Footer */}
      <footer
        className="section-container pb-10 mt-auto"
        style={{ borderTop: '1px solid hsl(var(--border))', maxWidth: '800px' }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-6">
          <p className="label-uppercase" style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.4 }}>
            Turnaround AI · <a href="https://www.duointernational.pt" style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>DUO International</a>
          </p>
          <p className="label-uppercase" style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.3 }}>
            Reg. UE 2024/1689 · AI Act Compliance
          </p>
        </div>
      </footer>

    </div>
  )
}
