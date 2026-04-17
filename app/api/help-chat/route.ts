// app/api/help-chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const SYSTEM_PROMPT = `És o assistente de suporte da Turnaround AI, uma ferramenta de diagnóstico financeiro da DUO International.

A plataforma funciona assim:
- O utilizador cria uma análise com dados de uma empresa
- Introduz dados financeiros quantitativos (liquidez, rentabilidade, estrutura financeira, qualidade operacional)
- Introduz sinais qualitativos críticos (litígios, perda de clientes, etc.)
- O sistema calcula um score de 0 a 100 em 5 blocos
- Claude gera um dossier narrativo completo com diagnóstico, cenários e recomendações
- Score 75-100: Risco Baixo (verde) | 50-74: Atenção (amarelo) | 25-49: Risco Elevado (laranja) | 0-24: Crítico (vermelho)

Responde sempre em português europeu, de forma concisa e profissional. Não inventes funcionalidades que não existem. Se não souberes, diz que podes contactar a DUO International em www.duointernational.pt.`

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação — evita consumo de créditos por chamadas não autorizadas
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { message, history } = body as {
      message: string
      history: { role: 'user' | 'assistant'; content: string }[]
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 })
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const messages: Anthropic.MessageParam[] = [
      ...(history ?? []).map((h) => ({
        role: h.role,
        content: h.content,
      })),
      { role: 'user', content: message },
    ]

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages,
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ reply: text }, { status: 200 })
  } catch (error) {
    console.error('[POST /api/help-chat]', error)
    return NextResponse.json(
      { error: 'Erro ao processar mensagem' },
      { status: 500 }
    )
  }
}
