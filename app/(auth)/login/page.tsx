'use client'
// app/(auth)/login/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError('Email ou password incorrectos.')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Erro inesperado. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-80 shrink-0 p-10"
        style={{ borderRight: '1px solid hsl(var(--border))' }}
      >
        <a
          href="https://www.duointernational.pt"
          className="label-uppercase transition-opacity duration-300"
          style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
        >
          ← DUO International
        </a>
        <div className="space-y-3">
          <h1
            className="font-display"
            style={{ fontSize: '2rem', fontWeight: 400, color: 'hsl(var(--foreground))', lineHeight: 1.1 }}
          >
            Turnaround<br />
            <em style={{ fontStyle: 'italic', color: 'hsl(var(--primary))' }}>AI</em>
          </h1>
          <p className="label-uppercase" style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.5 }}>
            Diagnóstico Financeiro
          </p>
        </div>
        <p style={{ fontSize: '0.6875rem', lineHeight: 1.7, color: 'hsl(var(--muted-foreground))', opacity: 0.45 }}>
          Análise indicativa.<br />Não constitui conselho de investimento.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-10">
          {/* Mobile logo */}
          <div className="lg:hidden text-center space-y-1">
            <h1
              className="font-display"
              style={{ fontSize: '2rem', fontWeight: 400, color: 'hsl(var(--foreground))' }}
            >
              Turnaround <em style={{ color: 'hsl(var(--primary))' }}>AI</em>
            </h1>
            <p className="label-uppercase" style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.5 }}>
              DUO International
            </p>
          </div>

          <div className="space-y-1">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
              Entrar na conta
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
              Introduz as tuas credenciais para aceder.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                className="px-4 py-3 text-sm"
                style={{
                  border: '1px solid hsl(var(--primary) / 0.3)',
                  background: 'hsl(var(--primary) / 0.05)',
                  borderRadius: 'var(--radius)',
                  color: 'hsl(var(--primary))',
                }}
              >
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="label-uppercase"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  border: '1px solid hsl(var(--border))',
                  background: 'transparent',
                  padding: '0.625rem 0.875rem',
                  fontSize: '0.875rem',
                  color: 'hsl(var(--foreground))',
                  borderRadius: 'var(--radius)',
                  outline: 'none',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--primary))')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border))')}
                placeholder="o@teu.email"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="label-uppercase"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  border: '1px solid hsl(var(--border))',
                  background: 'transparent',
                  padding: '0.625rem 0.875rem',
                  fontSize: '0.875rem',
                  color: 'hsl(var(--foreground))',
                  borderRadius: 'var(--radius)',
                  outline: 'none',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--primary))')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border))')}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'block',
                width: '100%',
                background: loading ? 'hsl(var(--primary) / 0.6)' : 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                padding: '0.7rem 1.5rem',
                fontSize: '0.8125rem',
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                borderRadius: 'var(--radius)',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>

          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
            Ainda não tens conta?{' '}
            <Link
              href="/register"
              style={{ color: 'hsl(var(--primary))', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
