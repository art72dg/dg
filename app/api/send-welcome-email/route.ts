// app/api/send-welcome-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
})

const FROM_ADDRESS = 'Turnaround AI <onboarding@resend.dev>'
const PLATFORM_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://turnaround-ai.vercel.app'

function welcomeHtml(name: string): string {
  const firstName = name.split(' ')[0]
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bem-vindo à Turnaround AI</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;border-bottom:1px solid #e5e5e5;">
              <span style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#888888;">DUO International</span>
              <span style="font-size:13px;color:#cccccc;margin:0 8px;">·</span>
              <span style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#1a1a1a;font-weight:500;">Turnaround <em style="font-style:italic;color:#6366f1;">AI</em></span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding-top:36px;padding-bottom:36px;">
              <p style="font-size:22px;font-weight:400;line-height:1.3;color:#1a1a1a;margin:0 0 20px 0;">
                Olá ${firstName},
              </p>
              <p style="font-size:15px;line-height:1.7;color:#444444;margin:0 0 16px 0;">
                A tua conta <strong>Turnaround AI</strong> foi criada com sucesso.
              </p>
              <p style="font-size:15px;line-height:1.7;color:#444444;margin:0 0 32px 0;">
                Turnaround AI é a ferramenta de diagnóstico financeiro da DUO International — scoring estruturado em 5 blocos, análise de risco e dossiers estratégicos gerados por IA.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#6366f1;border-radius:6px;">
                    <a href="${PLATFORM_URL}/dashboard"
                       style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                      Aceder à plataforma →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;border-top:1px solid #e5e5e5;">
              <p style="font-size:12px;line-height:1.7;color:#999999;margin:0 0 4px 0;">
                Qualquer questão, contacta-nos em
                <a href="https://www.duointernational.pt" style="color:#6366f1;text-decoration:none;">www.duointernational.pt</a>
              </p>
              <p style="font-size:11px;line-height:1.6;color:#bbbbbb;margin:8px 0 0 0;">
                Análise indicativa. Não constitui conselho de investimento.<br />
                © DUO International
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function adminHtml(userEmail: string, userName: string, timestamp: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8" /><title>Novo registo</title></head>
<body style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a1a;padding:32px;">
  <h2 style="font-size:18px;font-weight:500;margin:0 0 24px 0;">Novo registo na Turnaround AI</h2>
  <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      <td style="padding:8px 16px 8px 0;font-size:13px;color:#888888;text-transform:uppercase;letter-spacing:0.06em;">Nome</td>
      <td style="padding:8px 0;font-size:14px;color:#1a1a1a;">${userName}</td>
    </tr>
    <tr>
      <td style="padding:8px 16px 8px 0;font-size:13px;color:#888888;text-transform:uppercase;letter-spacing:0.06em;">Email</td>
      <td style="padding:8px 0;font-size:14px;color:#1a1a1a;">${userEmail}</td>
    </tr>
    <tr>
      <td style="padding:8px 16px 8px 0;font-size:13px;color:#888888;text-transform:uppercase;letter-spacing:0.06em;">Data/hora</td>
      <td style="padding:8px 0;font-size:14px;color:#1a1a1a;">${timestamp}</td>
    </tr>
  </table>
</body>
</html>`
}

async function sendViaResend(
  apiKey: string,
  payload: {
    from: string
    to: string
    subject: string
    html: string
  }
): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend error ${res.status}: ${body}`)
  }
}

export async function POST(req: NextRequest) {
  // Verificar autenticação — evita spam de emails por chamadas não autorizadas
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Parse + validate body
  let parsed: z.infer<typeof bodySchema>
  try {
    const json = await req.json()
    parsed = bodySchema.parse(json)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, name } = parsed
  const apiKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL ?? 'hello@duointernational.pt'
  const timestamp = new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })

  // If no API key is configured, return 200 silently (non-blocking)
  if (!apiKey || apiKey === 're_your_key_here') {
    console.warn('[send-welcome-email] RESEND_API_KEY not configured — skipping email send')
    return NextResponse.json({ ok: true, skipped: true })
  }

  const errors: string[] = []

  // 1. Welcome email to new user
  try {
    await sendViaResend(apiKey, {
      from: FROM_ADDRESS,
      to: email,
      subject: 'Bem-vindo à Turnaround AI',
      html: welcomeHtml(name),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[send-welcome-email] Failed to send welcome email:', msg)
    errors.push(msg)
  }

  // 2. Admin notification
  try {
    await sendViaResend(apiKey, {
      from: FROM_ADDRESS,
      to: adminEmail,
      subject: `Novo registo: ${email}`,
      html: adminHtml(email, name, timestamp),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[send-welcome-email] Failed to send admin notification:', msg)
    errors.push(msg)
  }

  // Always return 200 — email failures must never break registration UX
  return NextResponse.json({ ok: true, errors: errors.length ? errors : undefined })
}
