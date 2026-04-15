# Skill: Create API Route

## Usage
Criar uma API route Next.js com validação Zod, autenticação Supabase e tratamento de erros consistente.

## Template

```typescript
// app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ─── Schema de validação ───────────────────────────────────
const CreateSchema = z.object({
  // definir campos
})

type CreateInput = z.infer<typeof CreateSchema>

// ─── GET ───────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('[table]')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/resource]', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ─── POST ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = CreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('[table]')
      .insert({ ...parsed.data, user_id: user.id })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/resource]', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
```

## Regras
- Sempre verificar autenticação primeiro
- Sempre validar body com Zod antes de usar
- Sempre usar `user.id` nas queries (RLS enforça, mas defesa em profundidade)
- Log de erro com contexto (rota + método)
- Nunca expor stack trace para o cliente
- Status codes correctos: 200, 201, 400, 401, 403, 404, 500
