'use client'
// app/analysis/[id]/generate-dossier-button.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface GenerateDossierButtonProps {
  analysisId: string
  paymentStatus: 'free' | 'paid'
}

export function GenerateDossierButton({ analysisId, paymentStatus }: GenerateDossierButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Gerar dossier (já pago) ───────────────────────────────────────────────
  async function handleGenerate() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId }),
      })

      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? 'Erro ao gerar dossier')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  // ── Iniciar pagamento ─────────────────────────────────────────────────────
  async function handleBuy() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId }),
      })

      const body = await res.json() as { url?: string; error?: string }

      if (!res.ok || !body.url) {
        throw new Error(body.error ?? 'Erro ao criar sessão de pagamento')
      }

      window.location.href = body.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {paymentStatus === 'paid' ? (
        // Pago — gerar relatório
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: loading ? 'hsl(var(--primary) / 0.6)' : 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            padding: '0.75rem 2rem',
            fontSize: '0.8125rem',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            borderRadius: 'var(--radius)',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s',
          }}
        >
          {loading && (
            <span style={{
              width: '1rem', height: '1rem',
              borderRadius: '50%',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              animation: 'spin 0.6s linear infinite',
              display: 'inline-block',
            }} />
          )}
          {loading ? 'A gerar dossier...' : 'Gerar Dossier Completo'}
        </button>
      ) : (
        // Não pago — mostrar opção de compra
        <div style={{ textAlign: 'center' }}>
          <div style={{
            marginBottom: '1rem',
            padding: '1rem 1.5rem',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
            background: 'hsl(var(--primary) / 0.04)',
          }}>
            <p style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'hsl(var(--muted-foreground))', marginBottom: '0.5rem' }}>
              Dossier Completo
            </p>
            <p style={{ fontSize: '2rem', fontWeight: 600, color: 'hsl(var(--foreground))', fontFamily: 'var(--font-display)', marginBottom: '0.25rem' }}>
              €49
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>
              8 secções narrativas · Análise YoY · Cenários · Recomendações
            </p>
          </div>

          <button
            onClick={handleBuy}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: loading ? 'hsl(var(--primary) / 0.6)' : 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              padding: '0.75rem 2rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              borderRadius: 'var(--radius)',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
              width: '100%',
              justifyContent: 'center',
            }}
          >
            {loading && (
              <span style={{
                width: '1rem', height: '1rem',
                borderRadius: '50%',
                border: '2px solid currentColor',
                borderTopColor: 'transparent',
                animation: 'spin 0.6s linear infinite',
                display: 'inline-block',
              }} />
            )}
            {loading ? 'A redirigir...' : 'Comprar Dossier — €49'}
          </button>

          <p style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.75rem', opacity: 0.7 }}>
            Pagamento seguro via Stripe · Score gratuito sempre disponível
          </p>
        </div>
      )}

      {error && (
        <p style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))', textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>
  )
}
