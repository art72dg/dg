'use client'
// app/analysis/[id]/status-poller.tsx
// Recarrega a página automaticamente enquanto o status for 'scoring' ou 'generating'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface StatusPollerProps {
  status: string
  intervalMs?: number
}

export function StatusPoller({ status, intervalMs = 4000 }: StatusPollerProps) {
  const router = useRouter()

  useEffect(() => {
    if (status !== 'scoring' && status !== 'generating') return

    const timer = setInterval(() => {
      router.refresh()
    }, intervalMs)

    return () => clearInterval(timer)
  }, [status, intervalMs, router])

  return null
}
