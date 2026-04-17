// app/api/auth/signout/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // Usar request.url para construir redirect relativo — funciona em qualquer ambiente
  return NextResponse.redirect(new URL('/login', request.url))
}
