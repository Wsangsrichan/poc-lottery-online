'use client'

import { useState, useRef, useCallback } from 'react'
import type { LotteryResult, PrizeMatch } from '@/lib/types'
import { matchPrizes } from '@/lib/lottery'
import { addHistoryEntry } from '@/lib/history'

interface CheckFormProps {
  draw: LotteryResult
  initialTicket?: string
  onResult: (ticket: string, matches: PrizeMatch[]) => void
}

export default function CheckForm({ draw, initialTicket = '', onResult }: CheckFormProps) {
  const [ticket, setTicket] = useState(initialTicket)
  const [shaking, setShaking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
    setTicket(digits)
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (ticket.length !== 6) {
      setShaking(true)
      inputRef.current?.focus()
      setTimeout(() => setShaking(false), 400)
      return
    }
    const matches = matchPrizes(ticket, draw)
    const url = new URL(window.location.href)
    url.searchParams.set('ticket', ticket)
    window.history.replaceState({}, '', url.toString())
    addHistoryEntry({
      ticket,
      drawDate: draw.drawDate,
      drawDateThai: draw.drawDateThai,
      matches,
      checkedAt: new Date().toISOString(),
    })
    onResult(ticket, matches)
  }, [ticket, draw, onResult])

  const isReady = ticket.length === 6

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-sm w-full max-w-sm mx-auto px-md"
      noValidate
    >
      <div className="flex flex-col gap-xs">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          name="ticket"
          autoComplete="off"
          enterKeyHint="search"
          maxLength={6}
          value={ticket}
          onChange={handleChange}
          placeholder="กรอกหมายเลข 6 หลัก"
          aria-label="หมายเลขสลาก"
          aria-required="true"
          className={[
            'h-14 w-full rounded-xl border-2 bg-white px-md text-center text-2xl tracking-[0.3em]',
            'font-sans text-text placeholder:text-text-muted/60 placeholder:tracking-normal placeholder:text-base',
            'transition-all duration-200',
            isReady || ticket.length === 0
              ? 'border-border focus:border-lottery-green focus-visible:ring-2 focus-visible:ring-lottery-green/30 shadow-card'
              : 'border-error/60',
            shaking ? 'animate-[shake_0.3s_ease-in-out]' : '',
          ].join(' ')}
        />
      </div>
      <button
        type="submit"
        disabled={!isReady}
        className={[
          'h-13 w-full rounded-xl text-white text-lg font-semibold',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lottery-green/50',
          isReady
            ? 'bg-lottery-green hover:bg-lottery-green-dark shadow-card-lg hover:shadow-lg'
            : 'bg-lottery-green opacity-40 cursor-not-allowed',
        ].join(' ')}
      >
        ตรวจสลาก
      </button>
    </form>
  )
}
