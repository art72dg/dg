// lib/ai/claude-client.ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const MODELS = {
  analysis: 'claude-sonnet-4-20250514',
  helper:   'claude-haiku-4-5-20251001',
} as const

interface GenerateOptions {
  model?: keyof typeof MODELS
  maxTokens?: number
  temperature?: number
}

export async function generateText(
  systemPrompt: string,
  userMessage: string,
  options: GenerateOptions = {}
): Promise<string> {
  const { model = 'analysis', maxTokens = 4096 } = options

  const response = await client.messages.create({
    model: MODELS[model],
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Resposta inesperada da API Claude')
  return block.text
}

export async function generateReport(
  systemPrompt: string,
  sections: Array<{ key: string; prompt: string }>
): Promise<Record<string, string>> {
  // Gera todas as secções numa única chamada para evitar timeout
  const sectionList = sections.map((s, i) =>
    `### SECÇÃO ${i + 1}: ${s.key.toUpperCase()}\n${s.prompt}`
  ).join('\n\n---\n\n')

  const userMessage = `Gera o relatório completo de diagnóstico financeiro com as seguintes secções. Para cada secção, começa exactamente com o marcador ===SECÇÃO:${'{key}'}=== onde {key} é o identificador indicado, seguido do conteúdo.\n\nFormato obrigatório para cada secção:\n===SECÇÃO:executive_summary===\n[conteúdo]\n===SECÇÃO:liquidity_analysis===\n[conteúdo]\netc.\n\nSecções a gerar:\n\n${sectionList}`

  const userMessageFinal = `Gera o relatório completo de diagnóstico financeiro. Para cada secção usa exactamente este formato de marcador no início: ===SECÇÃO:{key}=== (substituindo {key} pelo identificador da secção).\n\n${sectionList}`

  // Usa Haiku: 5-10x mais rápido que Sonnet, cabe dentro do limite de 60s do Vercel
  const response = await client.messages.create({
    model: MODELS.helper,
    max_tokens: 3000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessageFinal }],
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Resposta inesperada da API Claude')

  const fullText = block.text
  const results: Record<string, string> = {}

  // Extrair cada secção pelo marcador ===SECÇÃO:{key}===
  for (let i = 0; i < sections.length; i++) {
    const current = sections[i]
    const next = sections[i + 1]
    const startMarker = `===SECÇÃO:${current.key}===`
    const endMarker = next ? `===SECÇÃO:${next.key}===` : null

    const startIdx = fullText.indexOf(startMarker)
    if (startIdx === -1) {
      results[current.key] = ''
      continue
    }

    const contentStart = startIdx + startMarker.length
    const contentEnd = endMarker ? fullText.indexOf(endMarker) : fullText.length
    results[current.key] = fullText.slice(contentStart, contentEnd !== -1 ? contentEnd : undefined).trim()
  }

  return results
}
