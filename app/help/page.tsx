'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const FAQ_ITEMS = [
  {
    question: 'Como criar uma análise?',
    answer:
      'Clica em "Nova Análise" no dashboard, preenche os dados da empresa e os indicadores financeiros. O sistema calcula o score automaticamente.',
  },
  {
    question: 'O que é o score?',
    answer:
      'Um valor de 0 a 100 que representa a saúde financeira global da empresa, calculado em 5 blocos: Liquidez, Rentabilidade, Estrutura Financeira, Qualidade Operacional e Sinais Críticos.',
  },
  {
    question: 'O que é o dossier?',
    answer:
      'Um relatório narrativo gerado por IA com diagnóstico completo, cenários possíveis, recomendações estratégicas e plano de acção.',
  },
  {
    question: 'Os meus dados são seguros?',
    answer:
      'Sim. Cada utilizador só tem acesso às suas próprias análises (Row Level Security). Os dados nunca são partilhados.',
  },
  {
    question: 'Posso exportar o relatório?',
    answer:
      'A funcionalidade de exportação PDF está em desenvolvimento. Por agora podes copiar o conteúdo do dossier.',
  },
  {
    question: 'O que significa "Risco Crítico"?',
    answer:
      'Score abaixo de 25. Indica situação financeira muito preocupante que requer acção imediata.',
  },
]

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: 'Olá! Sou o assistente da Turnaround AI. Como posso ajudar?',
}

export default function HelpPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMessage: Message = { role: 'user', content: trimmed }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/help-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: newMessages.slice(1, -1),
        }),
      })

      if (!res.ok) throw new Error('Erro na resposta')

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Ocorreu um erro ao processar a tua mensagem. Tenta novamente ou contacta a DUO International em www.duointernational.pt.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'hsl(var(--background))' }}
    >
      {/* Top bar */}
      <nav style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        <div
          className="section-container h-14 flex items-center justify-between"
          style={{ maxWidth: '1200px' }}
        >
          <Link
            href="/dashboard"
            className="label-uppercase transition-opacity duration-300"
            style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.55, textDecoration: 'none' }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = '0.55'
            }}
          >
            ← Dashboard
          </Link>
          <span
            className="label-uppercase"
            style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
          >
            Centro de Ajuda
          </span>
        </div>
      </nav>

      {/* Two-column layout */}
      <div
        className="section-container py-12"
        style={{ maxWidth: '1200px' }}
      >
        <div
          className="grid gap-12"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
          }}
        >
          {/* Left column — FAQ */}
          <div>
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                fontWeight: 400,
                color: 'hsl(var(--foreground))',
                lineHeight: 1.1,
                marginBottom: '2rem',
              }}
            >
              Perguntas Frequentes
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {FAQ_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    borderTop: '1px solid hsl(var(--border))',
                    paddingTop: '1.25rem',
                    paddingBottom: '1.25rem',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                      color: 'hsl(var(--foreground))',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {item.question}
                  </p>
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: 'hsl(var(--muted-foreground))',
                      lineHeight: 1.6,
                    }}
                  >
                    {item.answer}
                  </p>
                </div>
              ))}
              <div style={{ borderTop: '1px solid hsl(var(--border))' }} />
            </div>
          </div>

          {/* Right column — Chat */}
          <div>
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                fontWeight: 400,
                color: 'hsl(var(--foreground))',
                lineHeight: 1.1,
                marginBottom: '0.5rem',
              }}
            >
              Fala connosco
            </h2>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'hsl(var(--muted-foreground))',
                marginBottom: '1.5rem',
              }}
            >
              Pergunta-nos o que precisares sobre a plataforma.
            </p>

            {/* Chat container */}
            <div
              style={{
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
                display: 'flex',
                flexDirection: 'column',
                height: '520px',
              }}
            >
              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  maxHeight: '400px',
                }}
              >
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '80%',
                        padding: '0.625rem 0.875rem',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.8125rem',
                        lineHeight: 1.55,
                        color: 'hsl(var(--foreground))',
                        background:
                          msg.role === 'user'
                            ? 'hsl(var(--primary) / 0.08)'
                            : 'hsl(var(--card))',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div
                      style={{
                        padding: '0.625rem 0.875rem',
                        borderRadius: 'var(--radius)',
                        background: 'hsl(var(--card))',
                        display: 'flex',
                        gap: '4px',
                        alignItems: 'center',
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            background: 'hsl(var(--muted-foreground))',
                            display: 'inline-block',
                            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div
                style={{
                  borderTop: '1px solid hsl(var(--border))',
                  padding: '0.875rem 1.25rem',
                  display: 'flex',
                  gap: '0.625rem',
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escreve a tua pergunta..."
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.8125rem',
                    color: 'hsl(var(--foreground))',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  style={{
                    background: loading || !input.trim()
                      ? 'hsl(var(--muted))'
                      : 'hsl(var(--primary))',
                    color: loading || !input.trim()
                      ? 'hsl(var(--muted-foreground))'
                      : 'hsl(var(--primary-foreground))',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    padding: '0.4rem 0.875rem',
                    fontSize: '0.625rem',
                    fontWeight: 500,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    cursor: loading || !input.trim() ? 'default' : 'pointer',
                    transition: 'background 0.2s, color 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="section-container pb-10 mt-20"
        style={{ borderTop: '1px solid hsl(var(--border))', maxWidth: '1200px' }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-6">
          <p
            className="label-uppercase"
            style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.4 }}
          >
            Turnaround AI ·{' '}
            <a
              href="https://www.duointernational.pt"
              style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              DUO International
            </a>
          </p>
          <p
            className="label-uppercase"
            style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.3 }}
          >
            Análise indicativa, não constitui conselho de investimento
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
