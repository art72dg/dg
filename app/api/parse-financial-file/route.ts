// app/api/parse-financial-file/route.ts
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

const ACCEPTED_TYPES: Record<string, string> = {
  'application/pdf': 'document',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'text/csv': 'text',
  'text/plain': 'text',
  // Excel — handled as base64 document or text fallback
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
  'application/vnd.ms-excel': 'document',
}

const EXTRACTION_PROMPT = `Analisa o documento/imagem e extrai os dados financeiros. Devolve APENAS um objecto JSON válido, sem markdown, sem explicações.

O JSON deve ter exactamente esta estrutura (omite campos que não encontres no documento):

{
  "period": "YYYY",
  "currency": "EUR",
  "unit": "thousands",
  "balanceSheet": {
    "totalAssets": 0,
    "currentAssets": 0,
    "cash": 0,
    "accountsReceivable": 0,
    "inventory": 0,
    "totalLiabilities": 0,
    "currentLiabilities": 0,
    "shortTermDebt": 0,
    "accountsPayable": 0,
    "longTermDebt": 0,
    "equity": 0
  },
  "incomeStatement": {
    "revenue": 0,
    "grossProfit": 0,
    "ebitda": 0,
    "ebit": 0,
    "interestExpense": 0,
    "netIncome": 0
  },
  "cashFlow": {
    "operatingCashFlow": 0,
    "capitalExpenditure": 0,
    "freeCashFlow": 0
  },
  "agingData": {
    "receivablesUnder30": 0,
    "receivables30to60": 0,
    "receivables60to90": 0,
    "receivablesOver90": 0,
    "receivablesDisputed": 0,
    "payablesUnder30": 0,
    "payables30to60": 0,
    "payables60to90": 0,
    "payablesOver90": 0
  },
  "treasuryData": {
    "availableCreditLines": 0,
    "projectedInflows30d": 0,
    "projectedOutflows30d": 0,
    "daysUntilCashOut": 0
  },
  "previousYear": {
    "period": "YYYY",
    "balanceSheet": { "totalAssets": 0, "currentAssets": 0, "cash": 0, "totalLiabilities": 0, "currentLiabilities": 0, "longTermDebt": 0, "equity": 0 },
    "incomeStatement": { "revenue": 0, "ebitda": 0, "netIncome": 0, "interestExpense": 0 }
  }
}

Regras:
- "unit": usa "units" para valores em euros, "thousands" para k€, "millions" para M€
- Se o documento tiver dois anos, o mais recente vai em balanceSheet/incomeStatement e o anterior em previousYear
- Se há antiguidade de saldos (aging), preenche agingData
- Se há mapa de tesouraria ou projecções, preenche treasuryData
- Omite completamente secções que não existam no documento (não inventes zeros)
- Devolve APENAS o JSON, nenhum texto adicional`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum ficheiro enviado' }, { status: 400 })
    }

    // Size limit: 20 MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ficheiro demasiado grande (máx. 20 MB)' }, { status: 400 })
    }

    const mimeType = file.type || 'application/octet-stream'
    const fileCategory = ACCEPTED_TYPES[mimeType]

    if (!fileCategory) {
      return NextResponse.json({
        error: `Tipo de ficheiro não suportado. Aceites: PDF, Excel (.xlsx), CSV, imagens (JPG, PNG, WEBP)`,
      }, { status: 400 })
    }

    const anthropic = getAnthropic()
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let messageContent: Anthropic.MessageParam['content']

    if (fileCategory === 'text') {
      // CSV / plain text — send as text
      const text = buffer.toString('utf-8')
      messageContent = [
        {
          type: 'text',
          text: `${EXTRACTION_PROMPT}\n\nConteúdo do ficheiro:\n\`\`\`\n${text.slice(0, 50000)}\n\`\`\``,
        },
      ]
    } else if (fileCategory === 'image') {
      // Image — send as base64 vision
      const base64 = buffer.toString('base64')
      const imageMediaType = mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
      messageContent = [
        { type: 'text', text: EXTRACTION_PROMPT },
        {
          type: 'image',
          source: { type: 'base64', media_type: imageMediaType, data: base64 },
        },
      ]
    } else {
      // PDF / Excel — send as base64 document
      const base64 = buffer.toString('base64')
      // Claude supports PDF documents natively; for Excel we fall back to treating as document
      const docMediaType: 'application/pdf' = 'application/pdf'
      messageContent = [
        { type: 'text', text: EXTRACTION_PROMPT },
        {
          type: 'document',
          source: { type: 'base64', media_type: docMediaType, data: base64 },
        },
      ]
    }

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: messageContent }],
    })

    const rawText = response.content
      .filter((c): c is Anthropic.TextBlock => c.type === 'text')
      .map(c => c.text)
      .join('')
      .trim()

    // Extract JSON — strip any markdown code fences if present
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[parse-financial-file] No JSON in response:', rawText.slice(0, 300))
      return NextResponse.json({ error: 'Não foi possível extrair dados financeiros do ficheiro.' }, { status: 422 })
    }

    let extracted: Record<string, unknown>
    try {
      extracted = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: 'Resposta inválida do modelo. Tenta novamente.' }, { status: 422 })
    }

    return NextResponse.json({ data: extracted })

  } catch (error) {
    console.error('[POST /api/parse-financial-file]', error)
    return NextResponse.json({ error: 'Erro ao processar ficheiro' }, { status: 500 })
  }
}
