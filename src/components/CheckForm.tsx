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
          type="tel"
          inputMode="numeric"
          maxLength={6}
          value={ticket}
          onChange={handleChange}
          placeholder="เช่น 123456"
          aria-label="หมายเลขสลาก"
          aria-required="true"
          className={[
            'h-12 w-full rounded-lg border-2 bg-surface-2 px-md text-center text-base tracking-widest',
            'font-sans text-text placeholder:text-text-muted',
            'transition-colors duration-150',
            isReady || ticket.length === 0
              ? 'border-border focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/20'
              : 'border-error',
            shaking ? 'animate-[shake_0.3s_ease-in-out]' : '',
          ].join(' ')}
        />
        <p className="text-sm text-text-muted text-center">กรอกตัวเลข 6 หลัก</p>
      </div>
      <button
        type="submit"
        disabled={!isReady}
        className="h-12 w-full rounded-lg bg-gold text-white text-base font-semibold
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:enabled:brightness-95 active:enabled:brightness-90
          transition-all duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      >
        ตรวจสลาก
      </button>
    </form>
  )
}
