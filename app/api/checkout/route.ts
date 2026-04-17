// app/api/checkout/route.ts
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const PRICE_ID = 'price_1TNJJEGTySJp8Dg6192Xz0wk' // €49 — Dossier Completo

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured')
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { analysisId } = await request.json() as { analysisId: string }
    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId obrigatório' }, { status: 400 })
    }

    // Verificar que a análise pertence ao utilizador
    const { data: analysis } = await supabase
      .from('analyses')
      .select('id, title, payment_status')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single()

    if (!analysis) {
      return NextResponse.json({ error: 'Análise não encontrada' }, { status: 404 })
    }

    if (analysis.payment_status === 'paid') {
      return NextResponse.json({ error: 'Esta análise já foi paga' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://turnaround-ai.vercel.app'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: PRICE_ID,
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${appUrl}/analysis/${analysisId}?payment=success`,
      cancel_url: `${appUrl}/analysis/${analysisId}`,
      metadata: {
        analysisId,
        userId: user.id,
      },
      customer_email: user.email,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[POST /api/checkout]', error)
    return NextResponse.json({ error: 'Erro ao criar sessão de pagamento' }, { status: 500 })
  }
}
