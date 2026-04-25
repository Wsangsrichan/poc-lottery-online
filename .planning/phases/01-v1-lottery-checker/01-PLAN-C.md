---
phase: 01-v1-lottery-checker
plan: C
type: execute
wave: 2
depends_on:
  - 01-PLAN-A
  - 01-PLAN-B
files_modified:
  - src/components/CheckForm.tsx
  - src/components/CheckResult.tsx
  - src/components/PrizeBadge.tsx
  - src/components/PrizeTable.tsx
  - src/components/DrawDateHeader.tsx
  - src/components/HistoryPanel.tsx
  - src/components/HistoryItem.tsx
  - src/components/ShareButton.tsx
  - src/app/loading.tsx
autonomous: true
requirements:
  - REQ-01
  - REQ-02
  - REQ-03
  - REQ-04
  - REQ-05
  - REQ-07
  - REQ-08
  - REQ-09

must_haves:
  truths:
    - "CheckForm renders a type='tel' inputMode='numeric' input with 44px+ touch target submit button"
    - "CheckResult shows all matched PrizeBadges in win state, or no-win verdict with ticket number"
    - "PrizeTable renders a proper HTML table with Thai headers and all draw numbers"
    - "DrawDateHeader shows 'งวดประจำวันที่ {Thai date}' centered"
    - "HistoryPanel reads localStorage only inside useEffect (never in render)"
    - "ShareButton calls navigator.share() with clipboard fallback + toast"
    - "Loading skeleton uses animate-pulse Tailwind class"
    - "All copy is in Thai per UI-SPEC.md Copywriting Contract"
  artifacts:
    - path: "src/components/CheckForm.tsx"
      provides: "6-digit input + submit with validation"
      contains: "type=\"tel\""
    - path: "src/components/CheckResult.tsx"
      provides: "Win/no-win display with prize badges"
      contains: "aria-live=\"polite\""
    - path: "src/components/PrizeBadge.tsx"
      provides: "Prize chip component (gold background)"
      contains: "bg-gold"
    - path: "src/components/PrizeTable.tsx"
      provides: "Full draw results table (Server Component)"
      contains: "<table"
    - path: "src/components/DrawDateHeader.tsx"
      provides: "งวดประจำวันที่ header"
      contains: "งวดประจำวันที่"
    - path: "src/components/HistoryPanel.tsx"
      provides: "localStorage history, SSR-safe"
      contains: "useEffect"
    - path: "src/components/HistoryItem.tsx"
      provides: "Single history row with re-check"
      contains: "min-h-\\[44px\\]"
    - path: "src/components/ShareButton.tsx"
      provides: "Web Share API + clipboard fallback + toast"
      contains: "navigator.share"
    - path: "src/app/loading.tsx"
      provides: "Suspense skeleton with animate-pulse"
      contains: "animate-pulse"
  key_links:
    - from: "src/components/CheckForm.tsx"
      to: "src/lib/lottery.ts"
      via: "matchPrizes() called on submit, draws from passed LotteryResult prop"
      pattern: "matchPrizes"
    - from: "src/components/HistoryPanel.tsx"
      to: "src/lib/history.ts"
      via: "getHistory() inside useEffect, addHistoryEntry() in check callback"
      pattern: "getHistory|addHistoryEntry"
    - from: "src/components/CheckResult.tsx"
      to: "src/components/PrizeBadge.tsx"
      via: "maps matches array to PrizeBadge components"
      pattern: "PrizeBadge"
    - from: "src/components/ShareButton.tsx"
      to: "navigator.share"
      via: "Web Share API call with clipboard fallback"
      pattern: "navigator\\.share"
---

<objective>
Build all 8 UI components per UI-SPEC.md visual and interaction contracts, plus the loading skeleton.

Purpose: Complete the visible layer. CheckForm, CheckResult, PrizeBadge, PrizeTable, DrawDateHeader, HistoryPanel, HistoryItem, ShareButton — all hand-written Tailwind, no component library, mobile-first.

Output:
- All 8 components in src/components/
- src/app/loading.tsx (Suspense fallback skeleton)
- All components type-safe, importing from src/lib/types.ts
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/home/deploy-app/poc-lottery-online/.planning/PROJECT.md
@/home/deploy-app/poc-lottery-online/.planning/ROADMAP.md
@/home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-RESEARCH.md
@/home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-UI-SPEC.md

<interfaces>
<!-- Types from Plan A src/lib/types.ts -->

```typescript
export type PrizeTierId = 'first' | 'adjacent' | 'second' | 'third' | 'fourth' | 'fifth' | 'front3' | 'back3' | 'back2'
export const PRIZE_NAMES: Record<PrizeTierId, string>
export const PRIZE_AMOUNTS: Record<PrizeTierId, number>

export interface LotteryResult {
  drawDate: string; drawDateThai: string
  first: string; second: string[]; third: string[]; fourth: string[]
  fifth: string[]; front3: string[]; back3: string[]; back2: string[]
}

export interface PrizeMatch {
  id: PrizeTierId; name: string; amount: number; matchedDigits: string
}

export interface HistoryEntry {
  ticket: string; drawDate: string; drawDateThai: string
  matches: PrizeMatch[]; checkedAt: string
}
```

<!-- Functions from Plan B src/lib/lottery.ts -->

```typescript
export function matchPrizes(ticket: string, draw: LotteryResult): PrizeMatch[]
export function formatPrizeAmount(amount: number): string  // "2,000,000 บาท ต่อใบ"
export function formatThaiDate(isoDate: string): string    // "1 พฤษภาคม 2568"
```

<!-- Functions from Plan B src/lib/history.ts -->

```typescript
export function getHistory(): HistoryEntry[]           // ONLY call in useEffect
export function addHistoryEntry(entry: HistoryEntry): void
export function clearHistory(): void
```

<!-- Tailwind tokens from Plan A globals.css @theme -->

```
--color-gold: #D4A017     → bg-gold, text-gold, border-gold
--color-gold-light: #F5E6B3
--color-win: #16A34A      → border-win (for win-state card)
--color-error: #DC2626    → text-error
--color-surface: #FFFFFF  → bg-surface
--color-surface-2: #F5F5F5 → bg-surface-2
--color-border: #E5E7EB   → border-border
--color-text: #111827     → text-text
--color-text-muted: #6B7280 → text-text-muted
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task C1: CheckForm, PrizeBadge, CheckResult, DrawDateHeader</name>
  <files>
    src/components/CheckForm.tsx,
    src/components/PrizeBadge.tsx,
    src/components/CheckResult.tsx,
    src/components/DrawDateHeader.tsx
  </files>
  <read_first>
    - /home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-UI-SPEC.md (Component Inventory sections 1-5, Color section, Typography section, Interaction Contracts section, Copywriting Contract table)
    - /home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-RESEARCH.md (Pitfall 5: type="tel" not type="number")
    - src/lib/types.ts (LotteryResult, PrizeMatch)
    - src/lib/lottery.ts (matchPrizes, formatPrizeAmount)
  </read_first>
  <action>
Create `src/components/DrawDateHeader.tsx` (Server Component — no 'use client'):

```tsx
// Server Component — no 'use client' directive
interface DrawDateHeaderProps {
  drawDateThai: string  // pre-formatted Thai date, e.g. "1 พฤษภาคม 2568"
}

export default function DrawDateHeader({ drawDateThai }: DrawDateHeaderProps) {
  return (
    <div className="text-center py-3">
      <p className="text-base text-text-muted font-sans">
        งวดประจำวันที่ <span className="font-semibold text-text">{drawDateThai}</span>
      </p>
    </div>
  )
}
```

Create `src/components/PrizeBadge.tsx` (pure display — no 'use client'):

```tsx
import { formatPrizeAmount } from '@/lib/lottery'
import type { PrizeMatch } from '@/lib/types'

interface PrizeBadgeProps {
  match: PrizeMatch
}

export default function PrizeBadge({ match }: PrizeBadgeProps) {
  return (
    <span
      className="inline-flex flex-col items-center gap-0.5 bg-gold text-white text-sm font-semibold rounded-full px-3 py-2 leading-tight"
      aria-label={`${match.name} ${formatPrizeAmount(match.amount)}`}
    >
      <span>{match.name}</span>
      <span className="text-xs font-normal opacity-90">{formatPrizeAmount(match.amount)}</span>
    </span>
  )
}
```

Create `src/components/CheckForm.tsx` ('use client' — useState for input + validation):

```tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import type { LotteryResult, PrizeMatch } from '@/lib/types'
import { matchPrizes } from '@/lib/lottery'
import { addHistoryEntry } from '@/lib/history'

interface CheckFormProps {
  draw: LotteryResult
  initialTicket?: string          // from URL ?ticket= param
  onResult: (ticket: string, matches: PrizeMatch[]) => void
}

export default function CheckForm({ draw, initialTicket = '', onResult }: CheckFormProps) {
  const [ticket, setTicket] = useState(initialTicket)
  const [shaking, setShaking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip non-digits, cap at 6 characters
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
    setTicket(digits)
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (ticket.length !== 6) {
      // Visual shake feedback — no text error (per UI-SPEC.md interaction contract)
      setShaking(true)
      inputRef.current?.focus()
      setTimeout(() => setShaking(false), 400)
      return
    }
    const matches = matchPrizes(ticket, draw)
    // Update URL for sharing (shallow — no reload)
    const url = new URL(window.location.href)
    url.searchParams.set('ticket', ticket)
    window.history.replaceState({}, '', url.toString())
    // Write to history (localStorage — safe in event handler)
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
```

Add shake keyframes to `src/app/globals.css` — append after the closing brace of @theme block:

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-4px); }
  40%       { transform: translateX(4px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}
```

Create `src/components/CheckResult.tsx` ('use client' — conditional win/no-win render):

```tsx
'use client'

import type { PrizeMatch } from '@/lib/types'
import PrizeBadge from './PrizeBadge'
import ShareButton from './ShareButton'

interface CheckResultProps {
  ticket: string
  matches: PrizeMatch[]
}

export default function CheckResult({ ticket, matches }: CheckResultProps) {
  const won = matches.length > 0

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="ผลการตรวจ"
      className={[
        'w-full rounded-lg p-md shadow-sm',
        won
          ? 'bg-surface border-l-4 border-win'
          : 'bg-surface border border-border',
      ].join(' ')}
    >
      {won ? (
        <div className="flex flex-col gap-sm">
          <p className="text-2xl font-semibold text-gold leading-tight">ถูกรางวัล!</p>
          <div className="flex flex-wrap gap-2">
            {matches.map((match) => (
              <PrizeBadge key={match.id} match={match} />
            ))}
          </div>
          <ShareButton ticket={ticket} won={true} />
        </div>
      ) : (
        <div className="flex flex-col gap-xs">
          <p className="text-2xl font-semibold text-text-muted leading-tight">ไม่ถูกรางวัล</p>
          <p className="text-base text-text-muted">
            หมายเลข {ticket} ไม่ตรงกับรางวัลใดๆ ในงวดนี้
          </p>
        </div>
      )}
    </div>
  )
}
```

Note: CheckResult imports ShareButton — create ShareButton before (or alongside) CheckResult. The executor should create all four files in this task together.
  </action>
  <verify>
    <automated>cd /home/deploy-app/poc-lottery-online && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <acceptance_criteria>
    - src/components/CheckForm.tsx contains `type="tel"`
    - src/components/CheckForm.tsx contains `inputMode="numeric"`
    - src/components/CheckForm.tsx contains `aria-label="หมายเลขสลาก"`
    - src/components/CheckForm.tsx contains `aria-required="true"`
    - src/components/CheckForm.tsx contains `matchPrizes(`
    - src/components/CheckForm.tsx contains `addHistoryEntry(`
    - src/components/CheckResult.tsx contains `aria-live="polite"`
    - src/components/CheckResult.tsx contains `border-l-4 border-win`
    - src/components/CheckResult.tsx contains `ถูกรางวัล!`
    - src/components/CheckResult.tsx contains `ไม่ถูกรางวัล`
    - src/components/PrizeBadge.tsx contains `bg-gold`
    - src/components/DrawDateHeader.tsx contains `งวดประจำวันที่`
    - src/app/globals.css contains `@keyframes shake`
    - `npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>Core interaction components are complete. CheckForm handles input validation, client-side check, history write, and URL update. CheckResult renders win/no-win with badges. PrizeBadge and DrawDateHeader are pure display components.</done>
</task>

<task type="auto">
  <name>Task C2: PrizeTable, HistoryPanel, HistoryItem, ShareButton, loading skeleton</name>
  <files>
    src/components/PrizeTable.tsx,
    src/components/HistoryPanel.tsx,
    src/components/HistoryItem.tsx,
    src/components/ShareButton.tsx,
    src/app/loading.tsx
  </files>
  <read_first>
    - /home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-UI-SPEC.md (Component Inventory sections 4, 6, 7, 8; Loading Skeleton section; Toast notification section; Interaction Contracts — History Panel and URL Share Flow)
    - /home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-RESEARCH.md (Pitfall 6: localStorage SSR hydration; REQ-08 cap at 50 entries)
    - src/lib/types.ts (LotteryResult, HistoryEntry, PrizeMatch)
    - src/lib/history.ts (getHistory, addHistoryEntry)
    - src/lib/lottery.ts (formatPrizeAmount)
  </read_first>
  <action>
Create `src/components/PrizeTable.tsx` (Server Component — no 'use client', zero JS shipped):

```tsx
// Server Component — no 'use client' directive
import type { LotteryResult } from '@/lib/types'
import { formatPrizeAmount } from '@/lib/lottery'

interface PrizeTableProps {
  draw: LotteryResult
}

const PRIZE_ROWS = [
  { label: 'รางวัลที่ 1', key: 'first' as const, amount: 2_000_000 },
  { label: 'รางวัลข้างเคียงรางวัลที่ 1', key: null, amount: 100_000, special: 'adjacent' },
  { label: 'รางวัลที่ 2', key: 'second' as const, amount: 200_000 },
  { label: 'รางวัลที่ 3', key: 'third' as const, amount: 80_000 },
  { label: 'รางวัลที่ 4', key: 'fourth' as const, amount: 40_000 },
  { label: 'รางวัลที่ 5', key: 'fifth' as const, amount: 20_000 },
  { label: 'เลขหน้า 3 ตัว', key: 'front3' as const, amount: 4_000 },
  { label: 'เลขท้าย 3 ตัว', key: 'back3' as const, amount: 4_000 },
  { label: 'เลขท้าย 2 ตัว', key: 'back2' as const, amount: 2_000 },
] as const

function getAdjacentNumbers(first: string): string[] {
  const n = parseInt(first, 10)
  const below = n > 0 ? (n - 1).toString().padStart(6, '0') : null
  const above = n < 999999 ? (n + 1).toString().padStart(6, '0') : null
  return [below, above].filter(Boolean) as string[]
}

export default function PrizeTable({ draw }: PrizeTableProps) {
  return (
    <section className="w-full">
      <h2 className="text-xl font-semibold text-text px-md pb-sm">ผลรางวัลงวดนี้</h2>
      <table className="w-full border-collapse">
        <caption className="sr-only">ผลรางวัลสลากกินแบ่งรัฐบาล</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="text-left text-sm font-semibold uppercase text-text-muted px-md py-2">รางวัล</th>
            <th scope="col" className="text-left text-sm font-semibold uppercase text-text-muted px-sm py-2">หมายเลข</th>
            <th scope="col" className="text-right text-sm font-semibold uppercase text-text-muted px-md py-2">รางวัล (บาท)</th>
          </tr>
        </thead>
        <tbody>
          {PRIZE_ROWS.map((row, idx) => {
            let numbers: string[] = []
            if (row.special === 'adjacent') {
              numbers = getAdjacentNumbers(draw.first)
            } else if (row.key) {
              const val = draw[row.key]
              numbers = Array.isArray(val) ? val : [val]
            }

            return (
              <tr
                key={row.label}
                className={idx % 2 === 0 ? 'bg-surface' : 'bg-surface-2'}
              >
                <td className="text-sm font-semibold text-gray-700 px-md py-2 align-top whitespace-nowrap">
                  {row.label}
                </td>
                <td className="text-sm px-sm py-2 align-top font-mono tracking-wider text-text">
                  {numbers.join(', ')}
                </td>
                <td className="text-sm text-right px-md py-2 align-top text-text tabular-nums">
                  {formatPrizeAmount(row.amount)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
```

Create `src/components/HistoryItem.tsx` (pure display — no 'use client'):

```tsx
import type { HistoryEntry } from '@/lib/types'
import PrizeBadge from './PrizeBadge'

interface HistoryItemProps {
  entry: HistoryEntry
  onRecheck: (ticket: string) => void
}

export default function HistoryItem({ entry, onRecheck }: HistoryItemProps) {
  const won = entry.matches.length > 0

  return (
    <button
      type="button"
      onClick={() => onRecheck(entry.ticket)}
      className="flex items-center justify-between w-full min-h-[44px] px-md border-b border-gray-100
        hover:bg-surface-2 transition-colors duration-100 text-left cursor-pointer"
      aria-label={`ตรวจหมายเลข ${entry.ticket} อีกครั้ง`}
    >
      <span className="text-base font-mono tracking-widest text-text">{entry.ticket}</span>
      {won ? (
        <div className="flex flex-wrap gap-1 justify-end">
          {entry.matches.map((m) => (
            <PrizeBadge key={m.id} match={m} />
          ))}
        </div>
      ) : (
        <span className="text-sm text-text-muted">ไม่ถูก</span>
      )}
    </button>
  )
}
```

Create `src/components/ShareButton.tsx` ('use client' — navigator.share + clipboard fallback + toast):

```tsx
'use client'

import { useState, useCallback } from 'react'

interface ShareButtonProps {
  ticket: string
  won: boolean
}

export default function ShareButton({ ticket, won }: ShareButtonProps) {
  const [toastVisible, setToastVisible] = useState(false)

  const handleShare = useCallback(async () => {
    const url = window.location.href
    const resultText = won ? `ถูกรางวัล!` : 'ไม่ถูกรางวัล'
    const shareData = {
      title: 'ผลตรวจสลาก',
      text: `หมายเลข ${ticket} — ${resultText}`,
      url,
    }

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // User cancelled — fall through to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(url)
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 2000)
    } catch {
      // Clipboard also unavailable — silent fail
    }
  }, [ticket, won])

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        className="h-11 w-full rounded-lg border border-border bg-surface text-gray-700
          text-base font-normal px-md
          hover:bg-surface-2 active:brightness-95
          transition-colors duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        aria-label="แชร์ผลลัพธ์"
      >
        แชร์ผลลัพธ์
      </button>

      {/* Toast — fixed bottom-center above safe area */}
      {toastVisible && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50
            bg-gray-900 text-white text-sm rounded-full px-4 py-2
            pointer-events-none animate-fade-in"
        >
          คัดลอกลิงก์แล้ว
        </div>
      )}
    </>
  )
}
```

Create `src/components/HistoryPanel.tsx` ('use client' — localStorage reads inside useEffect):

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { HistoryEntry } from '@/lib/types'
import { getHistory } from '@/lib/history'
import HistoryItem from './HistoryItem'

interface HistoryPanelProps {
  onRecheck: (ticket: string) => void
}

// Group entries by drawDateThai
function groupByDraw(entries: HistoryEntry[]): Map<string, HistoryEntry[]> {
  const groups = new Map<string, HistoryEntry[]>()
  for (const entry of entries) {
    const key = entry.drawDateThai
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(entry)
  }
  return groups
}

export default function HistoryPanel({ onRecheck }: HistoryPanelProps) {
  // CRITICAL: history state starts null (server-safe), loaded in useEffect only
  const [history, setHistory] = useState<HistoryEntry[] | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Load from localStorage — only in useEffect (never in render — SSR hydration rule)
  useEffect(() => {
    const entries = getHistory()
    setHistory(entries)
    // Default: collapsed on mobile if entries exist
    setIsOpen(entries.length === 0)
  }, [])

  const refresh = useCallback(() => {
    setHistory(getHistory())
  }, [])

  // Re-check passes control up, then refreshes history display
  const handleRecheck = useCallback((ticket: string) => {
    onRecheck(ticket)
    // Small delay so the parent can process the check first
    setTimeout(refresh, 50)
  }, [onRecheck, refresh])

  if (history === null) {
    // SSR / before hydration — render nothing (prevents hydration mismatch)
    return null
  }

  const grouped = groupByDraw(history)

  return (
    <section className="w-full px-md">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center justify-between w-full text-left py-sm min-h-[44px]"
        aria-expanded={isOpen}
      >
        <h2 className="text-xl font-semibold text-text">ประวัติการตรวจ</h2>
        <span className="text-text-muted text-sm">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="mt-sm">
          {history.length === 0 ? (
            <div className="text-center py-lg">
              <p className="text-base font-semibold text-text">ยังไม่มีประวัติการตรวจ</p>
              <p className="text-sm text-text-muted mt-xs">ตรวจสลากแล้ว ประวัติจะปรากฏที่นี่</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              {Array.from(grouped.entries()).map(([drawDate, entries]) => (
                <div key={drawDate}>
                  <p className="text-sm text-text-muted px-md py-xs bg-surface-2 border-b border-border">
                    งวด {drawDate}
                  </p>
                  {entries.map((entry) => (
                    <HistoryItem
                      key={`${entry.ticket}-${entry.checkedAt}`}
                      entry={entry}
                      onRecheck={handleRecheck}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
```

Create `src/app/loading.tsx` (Suspense fallback — skeleton with animate-pulse):

```tsx
export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-md py-lg animate-pulse" aria-label="กำลังโหลดผลรางวัล...">
      {/* DrawDateHeader skeleton */}
      <div className="h-5 w-48 bg-gray-200 rounded mx-auto mb-lg" />

      {/* CheckForm skeleton */}
      <div className="max-w-sm mx-auto px-md flex flex-col gap-sm mb-2xl">
        <div className="h-12 bg-gray-200 rounded-lg w-full" />
        <div className="h-12 bg-gray-200 rounded-lg w-full" />
      </div>

      {/* PrizeTable skeleton */}
      <div className="w-full mb-2xl">
        <div className="h-5 w-32 bg-gray-200 rounded mx-4 mb-sm" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={`flex justify-between px-md py-2 ${i % 2 === 0 ? 'bg-white' : 'bg-surface-2'}`}
          >
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        ))}
      </div>

      <p className="text-sm text-text-muted text-center">กำลังโหลดผลรางวัล...</p>
    </div>
  )
}
```
  </action>
  <verify>
    <automated>cd /home/deploy-app/poc-lottery-online && npx tsc --noEmit 2>&1 | head -20 && npm run build 2>&1 | tail -10</automated>
  </verify>
  <acceptance_criteria>
    - src/components/PrizeTable.tsx contains `<table` (proper semantic table element)
    - src/components/PrizeTable.tsx contains `<caption` (accessibility)
    - src/components/PrizeTable.tsx contains `scope="col"` (accessible table headers)
    - src/components/PrizeTable.tsx does NOT contain `'use client'` (Server Component)
    - src/components/HistoryPanel.tsx contains `'use client'`
    - src/components/HistoryPanel.tsx contains `useEffect` (localStorage gated)
    - src/components/HistoryPanel.tsx contains `useState<HistoryEntry[] | null>(null)` (SSR-safe initial state)
    - src/components/HistoryItem.tsx contains `min-h-[44px]` (touch target requirement)
    - src/components/ShareButton.tsx contains `navigator.share`
    - src/components/ShareButton.tsx contains `navigator.clipboard.writeText`
    - src/components/ShareButton.tsx contains `คัดลอกลิงก์แล้ว` (toast copy)
    - src/app/loading.tsx contains `animate-pulse`
    - src/app/loading.tsx contains `กำลังโหลดผลรางวัล...`
    - `npx tsc --noEmit` exits 0
    - `npm run build` exits 0
  </acceptance_criteria>
  <done>All 8 components are complete per UI-SPEC.md contracts. PrizeTable is a Server Component with zero JS. HistoryPanel reads localStorage only in useEffect. ShareButton has Web Share API + clipboard fallback + toast. Loading skeleton uses animate-pulse.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| URL ?ticket= param → CheckForm | Untrusted query string value enters client component — must be validated to /^\d{6}$/ before auto-check |
| navigator.share / clipboard → browser | Browser APIs — no secrets involved, URLs are public |
| localStorage → HistoryEntry[] | Stored data re-parsed each time — type assertions safe because addHistoryEntry always writes typed data |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-C-01 | Spoofing | CheckForm URL param | mitigate | initialTicket prop is filtered through `replace(/\D/g, '').slice(0, 6)` in handleChange before any check runs. Even if malicious URL param passes 6 non-digit chars, the regex strips them. |
| T-01-C-02 | Information Disclosure | ShareButton | accept | Shares only the current page URL (which contains only the ticket number — a non-secret). No auth tokens, no PII in URL. |
| T-01-C-03 | Tampering | HistoryPanel localStorage | accept | History is display-only, non-financial. A malicious user can tamper their own localStorage — no server impact. |
| T-01-C-04 | XSS | CheckResult / PrizeBadge | mitigate | Prize names come from PRIZE_NAMES constant (hardcoded, not from API). Ticket number is digits-only (stripped by regex in CheckForm). No dangerouslySetInnerHTML anywhere. |
| T-01-C-05 | Denial of Service | HistoryPanel | mitigate | History capped at MAX_ENTRIES=50 in addHistoryEntry. localStorage.setItem wrapped in try/catch for QuotaExceededError — panel degrades gracefully. |
</threat_model>

<verification>
```bash
cd /home/deploy-app/poc-lottery-online

# 1. TypeScript clean
npx tsc --noEmit

# 2. Build passes
npm run build

# 3. Component structure checks
grep -q 'type="tel"' src/components/CheckForm.tsx && echo "OK: type=tel"
grep -q 'aria-live="polite"' src/components/CheckResult.tsx && echo "OK: aria-live"
grep -q "'use client'" src/components/HistoryPanel.tsx && echo "OK: HistoryPanel is client"
grep -q "'use client'" src/components/PrizeTable.tsx && echo "FAIL: PrizeTable should be server" || echo "OK: PrizeTable is server"
grep -q 'useEffect' src/components/HistoryPanel.tsx && echo "OK: localStorage in useEffect"
grep -q 'navigator.share' src/components/ShareButton.tsx && echo "OK: Web Share API"
grep -q 'navigator.clipboard' src/components/ShareButton.tsx && echo "OK: clipboard fallback"
grep -q 'animate-pulse' src/app/loading.tsx && echo "OK: skeleton animation"

# 4. No dangerouslySetInnerHTML in any component
grep -rn 'dangerouslySetInnerHTML' src/components/ && echo "FAIL: XSS risk" || echo "OK: no XSS risk"

# 5. Touch targets
grep -q 'min-h-\[44px\]' src/components/HistoryItem.tsx && echo "OK: 44px touch target"
```
</verification>

<success_criteria>
- All 8 components exist in src/components/ with correct file names
- CheckForm: type="tel", inputMode="numeric", 6-digit validation, matchPrizes() call, localStorage write, URL update
- CheckResult: aria-live="polite", win state with border-l-4 border-win + gold verdict, no-win with gray verdict
- PrizeBadge: bg-gold, renders name + formatted amount with "บาท ต่อใบ"
- PrizeTable: Server Component, proper semantic table with caption + th scope
- DrawDateHeader: "งวดประจำวันที่" prefix, centered
- HistoryPanel: useEffect gated localStorage, collapsible, grouped by draw, null initial state
- HistoryItem: min-h-[44px] touch target, re-check on click
- ShareButton: navigator.share + clipboard fallback + "คัดลอกลิงก์แล้ว" toast
- loading.tsx: animate-pulse skeleton + "กำลังโหลดผลรางวัล..." text
- npm run build exits 0
</success_criteria>

<output>
After completion, create `/home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-C-SUMMARY.md`
</output>
