'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LotteryResult, PrizeMatch } from '@/lib/types'
import { matchPrizes } from '@/lib/lottery'
import CheckForm from '@/components/CheckForm'
import CheckResult from '@/components/CheckResult'
import HistoryPanel from '@/components/HistoryPanel'

interface LotteryPageClientProps {
  draw: LotteryResult
  initialTicket: string
}

export default function LotteryPageClient({ draw, initialTicket }: LotteryPageClientProps) {
  const [checkedTicket, setCheckedTicket] = useState<string | null>(null)
  const [matches, setMatches] = useState<PrizeMatch[]>([])

  useEffect(() => {
    if (initialTicket.length === 6) {
      const autoMatches = matchPrizes(initialTicket, draw)
      setCheckedTicket(initialTicket)
      setMatches(autoMatches)
    }
  }, [initialTicket, draw])

  const handleResult = useCallback((ticket: string, prizeMatches: PrizeMatch[]) => {
    setCheckedTicket(ticket)
    setMatches(prizeMatches)
  }, [])

  const handleRecheck = useCallback((ticket: string) => {
    const reMatches = matchPrizes(ticket, draw)
    setCheckedTicket(ticket)
    setMatches(reMatches)
    const url = new URL(window.location.href)
    url.searchParams.set('ticket', ticket)
    window.history.replaceState({}, '', url.toString())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [draw])

  return (
    <div className="flex flex-col gap-lg">
      <CheckForm
        draw={draw}
        initialTicket={initialTicket}
        onResult={handleResult}
      />

      {checkedTicket !== null && (
        <CheckResult ticket={checkedTicket} matches={matches} />
      )}

      <div className="mt-sm">
        <HistoryPanel onRecheck={handleRecheck} />
      </div>
    </div>
  )
}
