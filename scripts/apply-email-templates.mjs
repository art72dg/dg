#!/usr/bin/env node
/**
 * apply-email-templates.mjs
 *
 * Applies DUO International branded email templates and SMTP config
 * to the Supabase project via the Management API.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-email-templates.mjs
 *
 * Get your access token at: https://app.supabase.com/account/tokens
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_REF = 'rxikiqfzyhqksrhngbme'
const API_BASE = 'https://api.supabase.com/v1'

const token = process.env.SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error('❌  SUPABASE_ACCESS_TOKEN is required.')
  console.error('   Get yours at: https://app.supabase.com/account/tokens')
  console.error('   Usage: SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-email-templates.mjs')
  process.exit(1)
}

function readTemplate(name) {
  const path = join(__dirname, '..', 'supabase', 'email-templates', `${name}.html`)
  return readFileSync(path, 'utf-8')
}

async function patchAuthConfig(payload) {
  const res = await fetch(`${API_BASE}/projects/${PROJECT_REF}/config/auth`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API error ${res.status}: ${body}`)
  }

  return res.json()
}

async function main() {
  console.log(`\n🔧  Applying email templates to project ${PROJECT_REF}...\n`)

  const confirmSignup   = readTemplate('confirm-signup')
  const passwordReset   = readTemplate('password-reset')
  const magicLink       = readTemplate('magic-link')

  // 1. Update email templates + sender name
  console.log('📧  Updating email templates and sender settings...')
  await patchAuthConfig({
    // Sender
    smtp_sender_name: 'Turnaround AI',

    // Subjects
    mailer_subjects_confirmation:   'Confirma o teu registo — Turnaround AI',
    mailer_subjects_recovery:       'Repõe a tua palavra-passe — Turnaround AI',
    mailer_subjects_magic_link:     'O teu link de acesso — Turnaround AI',
    mailer_subjects_invite:         'Convite para a Turnaround AI',
    mailer_subjects_email_change:   'Confirma a alteração de email — Turnaround AI',

    // Templates
    mailer_templates_confirmation_content: confirmSignup,
    mailer_templates_recovery_content:     passwordReset,
    mailer_templates_magic_link_content:   magicLink,
  })
  console.log('✅  Templates updated.\n')

  // 2. Configure custom SMTP (Resend)
  //    Requires RESEND_API_KEY in environment
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey && resendKey !== 're_your_key_here') {
    console.log('📮  Configuring custom SMTP (Resend)...')
    await patchAuthConfig({
      smtp_host:     'smtp.resend.com',
      smtp_port:     465,
      smtp_user:     'resend',
      smtp_pass:     resendKey,
      smtp_admin_email: process.env.SMTP_FROM ?? 'noreply@duointernational.pt',
      smtp_sender_name: 'Turnaround AI',
      smtp_max_frequency: 1,
    })
    console.log('✅  Custom SMTP configured.\n')
  } else {
    console.log('⚠️   RESEND_API_KEY not set — skipping SMTP config.')
    console.log('    Set RESEND_API_KEY=re_xxx to also configure custom SMTP.\n')
  }

  console.log('🎉  Done! All email templates are now DUO International branded.')
  console.log(`    Preview at: https://app.supabase.com/project/${PROJECT_REF}/auth/templates\n`)
}

main().catch(err => {
  console.error('❌  Failed:', err.message)
  process.exit(1)
})
