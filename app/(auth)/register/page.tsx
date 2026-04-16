'use client'
// app/(auth)/register/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(true)

      // Fire-and-forget welcome email — never blocks registration UX
      fetch('/api/send-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      }).catch(() => {})
    } catch {
      setError('Erro inesperado. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-6"
        style={{ background: 'hsl(var(--background))' }}
      >
        <div className="w-full max-w-sm text-center space-y-6">
          <div
            style={{
              width: '3rem',
              height: '3rem',
              border: '1px solid hsl(var(--primary) / 0.4)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              color: 'hsl(var(--primary))',
              fontSize: '1.25rem',
            }}
          >
            ✉
          </div>
          <div className="space-y-2">
            <h2
              style={{ fontSize: '1.25rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}
              className="font-display"
            >
              Confirma o teu email
            </h2>
            <p style={{ fontSize: '0.8125rem', lineHeight: 1.7, color: 'hsl(var(--muted-foreground))' }}>
              Enviámos um link de confirmação para{' '}
              <span style={{ color: 'hsl(var(--primary))' }}>{email}</span>.
              <br />Clica no link para activar a tua conta.
            </p>
          </div>
          <Link
            href="/login"
            className="label-uppercase"
            style={{
              color: 'hsl(var(--primary))',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    )
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
              Criar nova conta
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
              Começa gratuitamente. Sem cartão de crédito.
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

            {[
              { id: 'name', label: 'Nome', type: 'text', value: name, onChange: setName, placeholder: 'O teu nome completo', required: true, minLength: undefined },
              { id: 'email', label: 'Email', type: 'email', value: email, onChange: setEmail, placeholder: 'o@teu.email', required: true, minLength: undefined },
              { id: 'password', label: 'Password', type: 'password', value: password, onChange: setPassword, placeholder: 'Mínimo 8 caracteres', required: true, minLength: 8 },
            ].map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label
                  htmlFor={field.id}
                  className="label-uppercase"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  {field.label}
                </label>
                <input
                  id={field.id}
                  type={field.type}
                  required={field.required}
                  minLength={field.minLength}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
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
                  placeholder={field.placeholder}
                />
              </div>
            ))}

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
              {loading ? 'A criar conta...' : 'Criar conta'}
            </button>
          </form>

          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))' }}>
            Já tens conta?{' '}
            <Link
              href="/login"
              style={{ color: 'hsl(var(--primary))', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
