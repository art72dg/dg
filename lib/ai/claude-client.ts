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
  const results: Record<string, string> = {}

  // Gerar secções em série para manter contexto
  const messages: Anthropic.MessageParam[] = []

  for (const section of sections) {
    messages.push({ role: 'user', content: section.prompt })

    const response = await client.messages.create({
      model: MODELS.analysis,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    })

    const block = response.content[0]
    if (block.type !== 'text') throw new Error(`Erro ao gerar secção ${section.key}`)

    results[section.key] = block.text
    messages.push({ role: 'assistant', content: block.text })
  }

  return results
}
