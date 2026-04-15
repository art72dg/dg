// app/api/analysis/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const CreateAnalysisSchema = z.object({
  companyId: z.string().uuid(),
  title: z.string().min(1).max(200),
  period: z.string().min(4).max(20),
})

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('analyses')
      .select(`
        *,
        companies (id, name, sector, size),
        scoring_results (score, risk_level, calculated_at)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/analysis]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = CreateAnalysisSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Verificar que a empresa pertence ao utilizador
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('id', parsed.data.companyId)
      .eq('user_id', user.id)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        company_id: parsed.data.companyId,
        title: parsed.data.title,
        period: parsed.data.period,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/analysis]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
