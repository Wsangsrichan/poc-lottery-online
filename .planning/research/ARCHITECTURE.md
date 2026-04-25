# Architecture Research -- Thai Lottery Checker

**Project:** poc-lottery-online
**Researched:** 2026-04-25
**Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Vercel
**Confidence:** MEDIUM (Next.js patterns HIGH; Thai lottery API contract LOW -- see API Risk section)

---

## 1. Component Architecture

### File Tree

```
app/
├── layout.tsx                    # Root layout: font (Sarabun), metadata, <html lang="th">
├── page.tsx                      # Home: server shell, fetches lottery data, renders client boundary
├── error.tsx                     # Error boundary -- catches API fetch failures in page.tsx
├── not-found.tsx                 # 404 page
├── loading.tsx                   # Suspense fallback -- skeleton UI while data loads
│
├── api/
│   └── lottery/
│       └── route.ts              # GET /api/lottery -- NOT used for v1 (see section 4)
│
├── components/
│   ├── checker/
│   │   ├── CheckForm.tsx         # 'use client' -- 6-digit input, validation, submit
│   │   ├── CheckResult.tsx       # 'use client' -- win/lose display, prize badges
│   │   └── PrizeTable.tsx        # Server Component -- full draw results table
│   │
│   ├── history/
│   │   ├── HistoryPanel.tsx      # 'use client' -- reads/writes localStorage, group by draw date
│   │   └── HistoryItem.tsx       # Pure display -- ticket + result badge + re-check button
│   │
│   └── shared/
│       ├── ShareButton.tsx       # 'use client' -- Web Share API / clipboard fallback
│       ├── LoadingSpinner.tsx    # Pure UI
│       ├── PrizeBadge.tsx        # Pure UI -- prize label + amount chip
│       └── DrawDateHeader.tsx    # Pure display -- "งวดประจำวันที่ X มกราคม 2569"
│
└── lib/
    ├── lottery.ts                # matchPrizes() -- pure function, all prize tier logic
    ├── lottery-api.ts            # fetchLotteryData() -- fetches external API with caching
    ├── validate.ts               # Response validation -- Zod schema for API response
    ├── history.ts                # localStorage read/write helpers
    └── types.ts                  # All TypeScript interfaces
```

### Component Boundary Rules

| Component | Directive | Why |
|-----------|-----------|-----|
| `app/layout.tsx` | Server Component | Root layout: fonts, metadata, providers. Never needs client state. |
| `app/page.tsx` | Server Component | Fetches lottery data server-side. Passes serializable data as props to client boundary. |
| `app/error.tsx` | Client Component (Next.js convention) | Must be 'use client' to use hooks; catches errors in Server Components. |
| `CheckForm.tsx` | `'use client'` | useState for input value, form submission handler. |
| `CheckResult.tsx` | `'use client'` | Animated result reveal, conditional rendering based on match state. |
| `PrizeTable.tsx` | Server Component | Pure display of static prize data. No interactivity. Renders as HTML, zero JS shipped. |
| `HistoryPanel.tsx` | `'use client'` | localStorage access requires browser runtime. |
| `ShareButton.tsx` | `'use client'` | navigator.share and navigator.clipboard are browser-only APIs. |
| `DrawDateHeader.tsx` | Server Component | Receives date string as prop, no state. Can be server-rendered. |

**Critical rule:** The boundary between Server and Client is at `CheckForm.tsx`. The Server Component `page.tsx` fetches data, serializes it, and passes it as props. The Client Component tree (`CheckForm` -> `CheckResult` -> `HistoryPanel` -> `ShareButton`) handles all interactivity. `PrizeTable.tsx` and `DrawDateHeader.tsx` stay on the server side and ship zero JavaScript.

### Component Dependency Graph

```
layout.tsx
└── page.tsx (Server) ──fetches──> lottery-api.ts ──calls──> External API
    ├── DrawDateHeader.tsx (Server)         ← draw date string prop
    ├── PrizeTable.tsx (Server)             ← prizes[] prop
    └── CheckForm.tsx (Client boundary)     ← initialTicket + lotteryData props
        ├── CheckResult.tsx                 ← matchResult prop
        ├── HistoryPanel.tsx                ← (self-contained localStorage)
        │   └── HistoryItem.tsx             ← entry prop
        └── ShareButton.tsx                 ← ticket + result props
```

---

## 2. Data Flow

### Primary Flow: User Checks a Ticket

```
1. Page Load (Server-side)
   page.tsx ──calls──> lottery-api.ts
       └── fetch(LOTTERY_API_URL, { next: { revalidate: 43200 } })
           └── (Next.js Data Cache hit?) ──YES──> return cached response
           └── NO ──> call external API ──> cache response ──> return
       └── validate.ts ──Zod parse──> LotteryResult | throws ValidationError
   page.tsx renders with data (SSR HTML sent to browser)

2. User Enters Ticket Number (Client-side, zero network)
   CheckForm ──onSubmit──> matchPrizes(ticket, lotteryData)
       [lib/lottery.ts -- pure function, runs in browser]
   matchPrizes returns PrizeMatch[]
   CheckResult renders win/lose UI

3. Save to History (Client-side)
   HistoryPanel.addEntry(ticket, result, drawDate)
       └── localStorage.setItem('lottery-check-history', JSON.stringify(entries))

4. Share (Client-side)
   ShareButton ──onClick──> builds URL: /?ticket=123456
       └── navigator.share() OR navigator.clipboard.writeText()
```

**Key architectural decision:** The prize-matching computation runs entirely client-side. No API call needed per check. The lottery data for the current draw is already in the browser (passed as props from the Server Component). This means checking is instant and works offline if the page was previously loaded.

### Data Flow Diagram

```
EXTERNAL API (lotto.api.rayriffy.com/latest)
       │
       │ fetch() with next: { revalidate: 43200 }
       │
       ▼
┌──────────────────────────┐
│  Next.js Data Cache      │  12-hour TTL, stale-while-revalidate
│  (Vercel Edge)           │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  app/page.tsx            │  Server Component
│  - fetches data          │
│  - validates response    │
│  - renders HTML          │
└──────────┬───────────────┘
           │ serializable props
           ▼
┌──────────────────────────┐
│  CheckForm.tsx           │  Client Component (boundary)
│  - receives lotteryData  │
│  - user enters ticket    │
│  - calls matchPrizes()   │──────> lib/lottery.ts (pure function)
│  - displays CheckResult  │
└──────────┬───────────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐ ┌──────────┐
│ History │ │  Share   │
│ (localS │ │  (URL +  │
│  torage)│ │  Web API)│
└─────────┘ └──────────┘
```

---

## 3. External API Integration Pattern

### Primary API: rayriffy Thai Lotto API

**Base URL:** `https://lotto.api.rayriffy.com`
**Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/latest` | GET | Latest draw -- all prizes + running numbers |

**Expected response shape (from STACK.md research):**
```json
{
  "status": "success",
  "response": {
    "date": "16/04/2568",
    "prizes": [
      { "id": "first", "name": "รางวัลที่ 1", "reward": "6000000", "amount": 1, "number": ["123456"] },
      { "id": "second", "name": "รางวัลที่ 2", "reward": "200000", "amount": 5, "number": ["111111", ...] },
      { "id": "third", "name": "รางวัลที่ 3", "reward": "80000", "amount": 10, "number": [...] },
      { "id": "fourth", "name": "รางวัลที่ 4", "reward": "40000", "amount": 50, "number": [...] },
      { "id": "fifth", "name": "รางวัลที่ 5", "reward": "20000", "amount": 100, "number": [...] }
    ],
    "runningNumbers": [
      { "id": "front3", "name": "เลขหน้า 3 ตัว", "number": ["123", "456"], "reward": "4000" },
      { "id": "back3", "name": "เลขท้าย 3 ตัว", "number": ["789", "012"], "reward": "4000" },
      { "id": "back2", "name": "เลขท้าย 2 ตัว", "number": ["45"], "reward": "2000" }
    ]
  }
}
```

**Confidence: MEDIUM.** The API exists and the endpoint is documented. However, during research the `/latest` endpoint returned an Elysia type schema instead of live data (possible downtime or data source failure). The response shape above is inferred from the STACK.md research and GitHub README.

### API Risk Mitigation (Three-Layer Defense)

The external API is a community-maintained service with no SLA. The architecture must survive it going down.

**Layer 1: Next.js Data Cache (automatic)**
- `revalidate: 43200` (12 hours) means once data is fetched, it persists in cache for 12 hours
- If the API goes down after a successful fetch, cached data continues serving users
- Stale-while-revalidate: first request after TTL triggers background refresh; users never wait

**Layer 2: Response Validation**
- Use Zod to validate the API response shape on every fetch
- If validation fails, throw a structured error that `error.tsx` catches
- This prevents corrupted or unexpected data from reaching the UI

**Layer 3: Error Boundary UI**
- `app/error.tsx` catches fetch failures and validation errors
- Shows a user-friendly "ไม่สามารถดึงข้อมูลผลรางวัลได้" message
- Provides a retry button (re-triggers the Server Component fetch)
- Optionally: embed the last known good draw date as a static fallback message

### Fetch Function with Validation

```typescript
// lib/lottery-api.ts
import { lotteryResultSchema, type LotteryResult } from './types'

const LOTTERY_API_URL = process.env.LOTTERY_API_URL
  ?? 'https://lotto.api.rayriffy.com/latest'

export async function fetchLotteryData(): Promise<LotteryResult> {
  const res = await fetch(LOTTERY_API_URL, {
    next: { revalidate: 43200, tags: ['lottery-result'] },
  })

  if (!res.ok) {
    throw new Error(`Lottery API returned ${res.status}: ${res.statusText}`)
  }

  const raw = await res.json()

  // Validate response shape -- prevent silent data corruption
  const parsed = lotteryResultSchema.safeParse(raw)
  if (!parsed.success) {
    console.error('Lottery API response validation failed:', parsed.error)
    throw new Error('Lottery API response format changed')
  }

  return parsed.data.response
}
```

### Why NOT a Route Handler for v1

The STACK.md research considered a Route Handler (`/api/lottery/route.ts`) as an API proxy. For v1 with the rayriffy API (no API key, open access), the Route Handler adds an unnecessary network hop:

```
WITHOUT Route Handler:  External API --> Next.js Data Cache --> Server Component --> Client
WITH Route Handler:     External API --> Route Handler --> Next.js Data Cache --> Server Component --> Client
                                                                                             (extra hop)
```

**Decision: Fetch directly in the Server Component for v1.** The Route Handler file (`app/api/lottery/route.ts`) should be created but only used if:
- Switching to a paid API that requires a server-side key
- Adding rate limiting at the proxy layer
- Implementing on-demand revalidation webhook

The Route Handler code should be ready but commented out or behind a feature flag.

---

## 4. Routing Structure

### Minimal Routes (v1)

```
/                    Home page -- the entire app lives here
                     - Checker form (CheckForm)
                     - Result display (CheckResult)
                     - Full prize table (PrizeTable)
                     - History panel (HistoryPanel)
                     - Share button (ShareButton)

?ticket=123456       Query param on / for shared links
                     - Pre-fills the ticket input
                     - Auto-triggers the check on mount
```

**Why a single page?** The POC has a single workflow: enter number -> see result. Adding `/check`, `/results`, `/history` routes creates navigation complexity with no user benefit. Everything fits on one scrollable page.

### Future Routes (v2, NOT build now)

```
/history             Dedicated history page (if history grows beyond panel)
/archive/:drawId     Past draw results (requires /list endpoint + pagination)
/api/revalidate      On-demand cache purge webhook (admin-only)
```

### searchParams Handling (Next.js 14)

In Next.js 14 App Router, `searchParams` is passed as a plain object to Server Components:

```typescript
// app/page.tsx
export default async function Page({
  searchParams,
}: {
  searchParams: { ticket?: string }
}) {
  const prefilledTicket = searchParams.ticket ?? ''
  const lotteryData = await fetchLotteryData()

  return (
    <main>
      <DrawDateHeader date={lotteryData.date} />
      <PrizeTable prizes={lotteryData.prizes} runningNumbers={lotteryData.runningNumbers} />
      <CheckForm initialTicket={prefilledTicket} lotteryData={lotteryData} />
    </main>
  )
}
```

**Migration note for Next.js 15:** In Next.js 15, `searchParams` becomes a Promise (`{ searchParams: Promise<{ ticket?: string }> }`). Since this project targets Next.js 14, use the synchronous form above. If upgrading to 15 later, this is a one-line change.

---

## 5. Core Check Logic: matchPrizes()

This is the most critical piece of the application. It must handle all 8 prize match types correctly.

### Complete Prize Match Function

```typescript
// lib/lottery.ts
import type { LotteryResult, PrizeMatch } from './types'

/**
 * Check a 6-digit ticket against lottery results.
 * Returns ALL matching prizes (a ticket can win multiple prizes simultaneously).
 *
 * Prize check order:
 * 1. รางวัลที่ 1 (First Prize) -- exact 6-digit match
 * 2. รางวัลข้างเคียง (Adjacent to First Prize) -- first prize +/- 1
 * 3. รางวัลที่ 2-5 (Prize 2-5) -- exact 6-digit match against pre-drawn lists
 * 4. เลขหน้า 3 ตัว (Front 3 digits) -- first 3 digits match
 * 5. เลขท้าย 3 ตัว (Last 3 digits) -- last 3 digits match
 * 6. เลขท้าย 2 ตัว (Last 2 digits) -- last 2 digits match
 */
export function matchPrizes(ticket: string, result: LotteryResult): PrizeMatch[] {
  const matches: PrizeMatch[] = []
  const t = ticket.trim()

  if (t.length !== 6 || !/^\d{6}$/.test(t)) {
    return matches
  }

  const firstPrizeNumber = result.prizes.find(p => p.id === 'first')?.number[0]

  // 1. รางวัลที่ 1 -- exact 6-digit match
  if (firstPrizeNumber && t === firstPrizeNumber) {
    const firstPrize = result.prizes.find(p => p.id === 'first')!
    matches.push({
      prizeId: 'first',
      name: 'รางวัลที่ 1',
      reward: Number(firstPrize.reward),
    })
  }

  // 2. รางวัลข้างเคียง -- first prize +/- 1
  if (firstPrizeNumber) {
    const firstNum = parseInt(firstPrizeNumber, 10)
    const ticketNum = parseInt(t, 10)
    const adjacentNumbers: string[] = []

    // +1 (with wraparound: 999999 + 1 = 000000)
    adjacentNumbers.push(String((firstNum + 1) % 1000000).padStart(6, '0'))
    // -1 (with wraparound: 000000 - 1 = 999999)
    adjacentNumbers.push(String((firstNum - 1 + 1000000) % 1000000).padStart(6, '0'))

    if (adjacentNumbers.includes(t) && t !== firstPrizeNumber) {
      matches.push({
        prizeId: 'adjacent',
        name: 'รางวัลข้างเคียงรางวัลที่ 1',
        reward: 50000,
      })
    }
  }

  // 3. รางวัลที่ 2-5 -- exact 6-digit match against pre-drawn lists
  const lowerPrizes = result.prizes.filter(p =>
    ['second', 'third', 'fourth', 'fifth'].includes(p.id)
  )
  for (const prize of lowerPrizes) {
    if (prize.number.includes(t)) {
      matches.push({
        prizeId: prize.id,
        name: prize.name,
        reward: Number(prize.reward),
      })
    }
  }

  // 4. เลขหน้า 3 ตัว (Front 3 digits)
  const front3 = t.slice(0, 3)
  const front3Prize = result.runningNumbers.find(rn =>
    rn.id === 'front3' || rn.name.includes('หน้า')
  )
  if (front3Prize && front3Prize.number.includes(front3)) {
    matches.push({
      prizeId: 'runningFront3',
      name: 'รางวัลเลขหน้า 3 ตัว',
      reward: Number(front3Prize.reward),
    })
  }

  // 5. เลขท้าย 3 ตัว (Last 3 digits)
  const back3 = t.slice(-3)
  const back3Prize = result.runningNumbers.find(rn =>
    rn.id === 'back3' || rn.name.includes('ท้าย 3')
  )
  if (back3Prize && back3Prize.number.includes(back3)) {
    matches.push({
      prizeId: 'runningBack3',
      name: 'รางวัลเลขท้าย 3 ตัว',
      reward: Number(back3Prize.reward),
    })
  }

  // 6. เลขท้าย 2 ตัว (Last 2 digits)
  const back2 = t.slice(-2)
  const back2Prize = result.runningNumbers.find(rn =>
    rn.id === 'back2' || rn.name.includes('ท้าย 2')
  )
  if (back2Prize && back2Prize.number.includes(back2)) {
    matches.push({
      prizeId: 'runningBack2',
      name: 'รางวัลเลขท้าย 2 ตัว',
      reward: Number(back2Prize.reward),
    })
  }

  return matches
}
```

**Design decisions:**
- Pure function: no React, no API calls, no side effects. Easily unit-tested.
- Checks ALL prize tiers: a ticket can win multiple prizes (e.g., เลขท้าย 2 ตัว + เลขท้าย 3 ตัว + รางวัลที่ 5).
- ข้างเคียง (adjacent) has explicit wraparound: 000000 - 1 = 999999, 999999 + 1 = 000000.
- Validates input (exactly 6 digits) before checking.
- Uses `Number()` on reward string because the rayriffy API returns rewards as strings (confirmed in type schema).

---

## 6. Caching Strategy

### Two-Layer Cache Architecture

| Layer | Mechanism | TTL | Scope |
|-------|-----------|-----|-------|
| Next.js Data Cache | `fetch()` with `next: { revalidate }` | 12 hours (43200s) | Per-deployment, shared across all users on Vercel CDN |
| Browser cache | N/A (not applicable) | N/A | No browser caching -- client components receive data as props, no fetch |

### Why 12 Hours?

Thai lottery draws happen on the 1st and 16th of each month, approximately 14-16 days apart. A 12-hour cache TTL means:
- At most 12 hours of stale data after a new draw
- New results appear ~15:00-16:00 on draw day; worst case, stale data persists until 03:00-04:00 the next day
- Between draws, revalidation is a no-op (same data), harmless overhead
- Prevents hammering the external API with requests from many users checking after a draw

### Stale-While-Revalidate Behavior

After TTL expires, the first request triggers a background revalidation. Subsequent users continue receiving the stale cached response while fresh data is fetched. No user experiences a cold fetch or timeout.

```
Time:     0h          12h (TTL expires)     12h + 1s
Request:  User A ──>  User B ──>             User C
          [fresh]      [stale + bg refresh]  [fresh]
```

### When to Use Different Cache Settings

| Scenario | Setting | When to Use |
|----------|---------|-------------|
| Normal operation | `revalidate: 43200` | Default for v1 |
| Immediately after a new draw | `cache: 'no-store'` | Manual override via env var `NEXT_PUBLIC_FORCE_REFRESH=true` |
| Development | `cache: 'no-store'` | `next dev` does not cache by default |
| Future: admin webhook purge | `revalidateTag('lottery-result')` | On-demand invalidation via `/api/revalidate` |

### What is NOT Cached

- `matchPrizes()` computation -- runs client-side in memory, takes <1ms
- localStorage history -- client-side only, no server involvement
- Share URL construction -- pure string operation in browser

---

## 7. localStorage Integration

### Storage Schema

```typescript
// lib/types.ts
export interface CheckHistoryEntry {
  id: string           // crypto.randomUUID() -- unique per entry
  ticket: string       // 6-digit string, e.g. "123456"
  drawDate: string     // Thai format from API, e.g. "16/04/2568"
  checkedAt: number    // Unix timestamp (ms) of when the check happened
  matches: PrizeMatch[] // All matching prizes (empty array = no win)
}
```

**Storage key:** `lottery-check-history`
**Format:** JSON array of `CheckHistoryEntry`
**Max entries:** 50 (prune oldest when exceeded)

### Why This Schema

- `id` field: enables React `key` prop and future delete/edit operations
- `drawDate` stored with entry: history entries are meaningful even when the current draw changes
- `matches` stored (not just `result: 'win'/'lose'`): displays exactly which prizes were won, even after the API changes
- `checkedAt` timestamp: enables sorting by recency and grouping by session

### Hydration-Safe Implementation

localStorage does not exist during SSR. Accessing it during render causes hydration mismatch. The fix: read localStorage only inside `useEffect`, after mount.

```typescript
// hooks/useLotteryHistory.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CheckHistoryEntry } from '@/lib/types'

const STORAGE_KEY = 'lottery-check-history'
const MAX_ENTRIES = 50

export function useLotteryHistory() {
  const [history, setHistory] = useState<CheckHistoryEntry[]>([])
  const [mounted, setMounted] = useState(false)

  // Read from localStorage after mount (never during SSR)
  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setHistory(parsed)
        }
      }
    } catch {
      // localStorage unavailable (private browsing, storage full, etc.)
      // History simply starts empty
    }
  }, [])

  const addEntry = useCallback((entry: Omit<CheckHistoryEntry, 'id' | 'checkedAt'>) => {
    const newEntry: CheckHistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      checkedAt: Date.now(),
    }
    setHistory(prev => {
      const updated = [newEntry, ...prev].slice(0, MAX_ENTRIES)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // Storage quota exceeded -- silently fail, in-memory state still works
      }
      return updated
    })
  }, [])

  const removeEntry = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(entry => entry.id !== id)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch { /* ignore */ }
      return updated
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch { /* ignore */ }
  }, [])

  return { history, addEntry, removeEntry, clearHistory, mounted }
}
```

**Rules:**
1. Always read inside `useEffect` -- never during render or initialization
2. Gate history UI on `mounted`: `if (!mounted) return null` or render skeleton
3. Wrap all localStorage calls in try/catch -- can throw in Safari private mode
4. Cap at 50 entries -- prevents unbounded growth (localStorage limit is ~5-10MB)
5. Use `crypto.randomUUID()` for IDs -- browser-native, no library needed

---

## 8. Sharing Feature

### Strategy: Query String Encoding

Share URL format: `https://your-app.vercel.app/?ticket=123456`

**Why query string over path segment:**
- `/check/123456` (path) requires a dynamic route (`[ticket]`), adds a route file
- `/?ticket=123456` (query) is handled in the existing root page, `searchParams` prop is available server-side
- Social preview (OG metadata) can use the ticket number in `generateMetadata()`

### Implementation

```typescript
// components/shared/ShareButton.tsx
'use client'

interface Props {
  ticket: string
  hasWon: boolean
  prizeName?: string
}

export default function ShareButton({ ticket, hasWon, prizeName }: Props) {
  const handleShare = async () => {
    const url = new URL(window.location.href)
    url.searchParams.set('ticket', ticket)

    const status = hasWon
      ? `ถูก${prizeName ?? 'รางวัล'}!`
      : 'ไม่ถูกรางวัล'

    const shareText = `ตรวจหวย ${ticket} ${status}`

    if (navigator.share) {
      // Native share sheet (iOS, Android)
      try {
        await navigator.share({
          title: 'ผลตรวจสลากกินแบ่ง',
          text: shareText,
          url: url.toString(),
        })
      } catch (err) {
        // User cancelled share -- do nothing
      }
    } else {
      // Desktop fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(url.toString())
        // Show brief "คัดลอกแล้ว!" feedback (toast)
      } catch {
        // Clipboard API blocked -- show URL in a text input for manual copy
      }
    }
  }

  return (
    <button onClick={handleShare} className="...">
      แชร์ผล
    </button>
  )
}
```

### Auto-Check on Shared Link Load

When a user opens `/?ticket=123456`, the form should pre-fill and auto-trigger the check:

```typescript
// In CheckForm.tsx
'use client'
import { useEffect } from 'react'

interface Props {
  initialTicket: string
  lotteryData: LotteryResult
}

export default function CheckForm({ initialTicket, lotteryData }: Props) {
  const [ticket, setTicket] = useState('')

  // Auto-check when arriving via share link
  useEffect(() => {
    if (initialTicket && /^\d{6}$/.test(initialTicket)) {
      setTicket(initialTicket)
      // Trigger matchPrizes and display result immediately
      const matches = matchPrizes(initialTicket, lotteryData)
      setResult(matches)
    }
  }, [initialTicket, lotteryData])

  // ... rest of component
}
```

### OG Metadata for Social Previews

```typescript
// app/page.tsx
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { ticket?: string }
}) {
  if (searchParams.ticket) {
    return {
      title: `ตรวจสลากกินแบ่ง ${searchParams.ticket}`,
      description: 'ตรวจผลรางวัลสลากกินแบ่งรัฐบาล งวดล่าสุด',
      openGraph: {
        title: `ตรวจหวย ${searchParams.ticket}`,
        description: 'ผลตรวจสลากกินแบ่งรัฐบาล งวดล่าสุด',
      },
    }
  }
  return {
    title: 'ตรวจหวยออนไลน์ | สลากกินแบ่งรัฐบาล',
    description: 'ตรวจผลรางวัลสลากกินแบ่งรัฐบาล งวดล่าสุด รวดเร็ว แม่นยำ',
  }
}
```

**Limitation:** OG metadata is generated at request time and cached. It cannot show whether the ticket won because the check runs client-side. The preview will always say "ตรวจผลรางวัล" without revealing the result -- this is actually good UX (creates curiosity, encourages the click).

---

## 9. Error Handling Architecture

### Error Boundaries

```
app/page.tsx (Server Component)
    │
    ├── fetchLotteryData() fails (network error, API down)
    │       └── throws Error
    │       └── caught by app/error.tsx
    │
    ├── fetchLotteryData() returns invalid data
    │       └── Zod validation fails
    │       └── throws Error
    │       └── caught by app/error.tsx
    │
    └── CheckForm renders (client boundary)
            │
            ├── matchPrizes() -- pure function, cannot throw (returns empty array on bad input)
            │
            └── localStorage operations
                    └── try/catch in useLotteryHistory, silent failure
```

### Error Boundary Component

```typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="rounded-2xl bg-red-50 p-8 text-center max-w-md">
        <p className="text-2xl font-bold text-red-800">ไม่สามารถดึงข้อมูลได้</p>
        <p className="mt-2 text-red-600">
          ไม่สามารถเชื่อมต่อกับแหล่งข้อมูลผลรางวัลได้ในขณะนี้
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-xl bg-red-600 px-6 py-3 text-white font-semibold
                     hover:bg-red-700 active:scale-95 transition-all"
        >
          ลองอีกครั้ง
        </button>
        <p className="mt-4 text-sm text-red-400">
          หากปัญหายังคงอยู่ กรุณาลองใหม่อีกครั้งในภายหลัง
        </p>
      </div>
    </main>
  )
}
```

### Loading State

```typescript
// app/loading.tsx
export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="animate-pulse space-y-6 w-full max-w-md">
        {/* Skeleton: draw date */}
        <div className="h-8 w-64 bg-gray-200 rounded mx-auto" />
        {/* Skeleton: checker form */}
        <div className="h-16 w-full bg-gray-200 rounded-2xl" />
        {/* Skeleton: prize table */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  )
}
```

---

## 10. TypeScript Types

```typescript
// lib/types.ts
import { z } from 'zod'

// --- Zod schemas (for API response validation) ---

const prizeSchema = z.object({
  id: z.string(),
  name: z.string(),
  reward: z.union([z.string(), z.number()]), // API returns string, handle both
  amount: z.number(),
  number: z.array(z.string()),
})

const runningNumberSchema = z.object({
  id: z.string(),
  name: z.string(),
  reward: z.union([z.string(), z.number()]),
  amount: z.number().optional(),
  number: z.array(z.string()),
})

const lotteryResultSchema = z.object({
  date: z.string(),
  endpoint: z.string().optional(),
  prizes: z.array(prizeSchema),
  runningNumbers: z.array(runningNumberSchema),
})

export const lotteryApiResponseSchema = z.object({
  status: z.string(),
  response: lotteryResultSchema,
})

// --- TypeScript interfaces (inferred from Zod schemas) ---

export type Prize = z.infer<typeof prizeSchema>
export type RunningNumber = z.infer<typeof runningNumberSchema>
export type LotteryResult = z.infer<typeof lotteryResultSchema>
export type LotteryApiResponse = z.infer<typeof lotteryApiResponseSchema>

// --- App-specific types ---

export interface PrizeMatch {
  prizeId: string    // e.g. 'first', 'adjacent', 'runningBack2'
  name: string       // Thai name, e.g. 'รางวัลที่ 1'
  reward: number     // Prize amount in THB
}

export interface CheckHistoryEntry {
  id: string
  ticket: string
  drawDate: string
  checkedAt: number  // Unix timestamp (ms)
  matches: PrizeMatch[]
}
```

---

## 11. Build Order

Build in this exact order. Each step unblocks the next and produces a testable deliverable.

### Step 1 -- Types + Validation Layer (no UI, ~30 min)
```
lib/types.ts          Zod schemas + TypeScript interfaces
```
**Deliverable:** Can validate any API response shape. Testable with unit tests.
**Blocks:** Everything else depends on correct types.

### Step 2 -- Core Logic (no UI, ~1 hr)
```
lib/lottery.ts        matchPrizes() pure function + unit tests
lib/lottery-api.ts    fetchLotteryData() + validation
```
**Deliverable:** `matchPrizes('123456', mockResult)` returns correct matches. Testable with fixtures.
**Blocks:** UI components need data shape and check logic.

### Step 3 -- Server Shell + Layout (~30 min)
```
app/layout.tsx        Root layout, Sarabun font, metadata, Tailwind base
app/page.tsx          Server Component fetch, renders children with data
app/error.tsx         Error boundary
app/loading.tsx       Skeleton loading
```
**Deliverable:** Page loads with real data from external API. Prize data visible in browser (via PrizeTable).
**Blocks:** Client components need the server shell to mount into.

### Step 4 -- Core UI (checker form + result) (~2 hr)
```
components/checker/CheckForm.tsx      Input, validation, submit
components/checker/CheckResult.tsx    Win/lose display
components/checker/PrizeTable.tsx     Full prize table (server component)
components/shared/PrizeBadge.tsx      Reusable prize chip
```
**Deliverable:** User can enter a ticket number and see if they won. Core app works.
**Blocks:** History and share need the check flow to exist first.

### Step 5 -- History (~1 hr)
```
lib/history.ts                      localStorage helpers
hooks/useLotteryHistory.ts          Custom hook with hydration guard
components/history/HistoryPanel.tsx  History display with grouped entries
components/history/HistoryItem.tsx   Individual entry component
```
**Deliverable:** Checked tickets persist across sessions. Re-check from history works.
**Blocks:** Share needs to know if history is being saved.

### Step 6 -- Share + OG Metadata (~30 min)
```
components/shared/ShareButton.tsx    Web Share API + clipboard fallback
app/page.tsx                         add generateMetadata()
CheckForm.tsx                        add auto-check on ?ticket= param
```
**Deliverable:** Users can share check results via LINE/Messages.

### Step 7 -- Polish (~1-2 hr)
```
app/not-found.tsx                    404 page
Mobile responsive audit              Tailwind breakpoints check
Performance pass                     Lighthouse check, bundle size review
Accessibility basics                 ARIA labels on interactive elements
```

**Total estimated build time:** ~6-8 hours for v1

### Dependency Graph

```
Step 1: Types
   │
   ▼
Step 2: Core Logic (matchPrizes + API fetch)
   │
   ▼
Step 3: Server Shell (layout + page + error/loading)
   │
   ▼
Step 4: Core UI (form + result + prize table)
   │
   ├──▶ Step 5: History
   │        │
   │        ▼
   │    Step 6: Share + OG
   │        │
   └───────▶│
            ▼
        Step 7: Polish
```

Steps 5 and 6 can be built in parallel once Step 4 is complete, but history should come first because sharing a result naturally triggers a history save.

---

## 12. Architecture Decisions Log

| Decision | Rationale | Confidence |
|----------|-----------|------------|
| Direct fetch in Server Component (no Route Handler for v1) | Removes unnecessary network hop; rayriffy API needs no key hiding | HIGH |
| `matchPrizes()` as pure function in `lib/` | Zero dependencies, unit-testable, runs client-side with no network | HIGH |
| Zod validation on API response | Prevents silent data corruption when API changes shape | HIGH |
| 12-hour cache TTL | Draws every ~14 days; 12h is conservative freshness without over-fetching | MEDIUM |
| Single-page architecture (no separate routes) | POC has one workflow; navigation adds complexity with no user benefit | HIGH |
| `?ticket=` query param for sharing | Server-side accessible, no extra route file, readable URL | HIGH |
| `mounted` guard for localStorage | Standard Next.js pattern, prevents hydration mismatch | HIGH |
| `crypto.randomUUID()` for history entry IDs | Browser-native, no library, unique enough for localStorage scope | HIGH |
| Sarabun font via next/font | Thai government/formal standard, appropriate for lottery context | MEDIUM |
| Cap history at 50 entries | Prevents unbounded localStorage growth; months of daily use | HIGH |

---

## 13. Scalability Considerations

| Concern | POC (v1) | If Popular (10K+ users) | If Very Popular (100K+ users) |
|---------|----------|------------------------|-------------------------------|
| API rate limits | Community API, no documented limit | Add Route Handler as caching proxy | Add self-hosted API (lottsanook-docker) |
| Cache hit rate | Vercel CDN, shared cache | Same -- CDN scales automatically | Consider multiple cache tags per draw |
| History storage | localStorage, 50 entries | Same (per-user, no server cost) | Add IndexedDB or server-side storage |
| External API reliability | Error boundary + retry | Add fallback API source | Run own scraper |
| Build time | Vercel free tier | Still fine -- Next.js builds are fast | Vercel Pro tier if needed |

---

## 14. Confidence Assessment

| Area | Confidence | Notes |
|------|-----------|-------|
| Next.js 14 App Router patterns | HIGH | Well-established framework, patterns verified against official docs in STACK.md |
| Component architecture | HIGH | Standard server/client boundary patterns, no novel patterns needed |
| matchPrizes() logic | HIGH | Pure function based on documented prize rules from FEATURES.md |
| External API integration | MEDIUM | API exists but returned type schema during research (possible downtime). Response shape inferred from docs, not verified with live data |
| Caching strategy | HIGH | Standard ISR pattern, TTL chosen based on draw schedule |
| localStorage patterns | HIGH | Well-documented Next.js hydration pattern, widely used |
| Sharing pattern | HIGH | Web Share API is standard, clipboard fallback is well-known |
| Build order | HIGH | Dependencies are clear, standard incremental build approach |

---

## 15. Open Questions / Research Flags

- **[API VERIFICATION]** The rayriffy API returned a type schema instead of live data during research. Before Step 2, verify the API is returning actual draw results (not just the schema). If down, need an alternative API immediately.
- **[RESPONSE FORMAT]** The API type schema shows `reward: string` but STACK.md documents it as a number. The Zod schema handles both via union type, but verify the actual format with a successful API call.
- **[HISTORICAL DATA]** The rayriffy API has a `/list` endpoint for past draws, but its response shape was not verifiable. If past-draw browsing is needed for v1.1, research this endpoint's shape.
- **[NO โต๊ด CHECKING]** โต๊ด is NOT an official GLO prize tier (confirmed in FEATURES.md). The matchPrizes function deliberately excludes it. If users expect โต๊ด checking, it needs to be explicitly scoped as a separate feature or v2 addition.

---

## Sources

- [Next.js 14 -- Data Fetching, Caching, Revalidating](https://nextjs.org/docs/14/app/building-your-application/data-fetching/fetching-caching-and-revalidating) -- HIGH confidence
- [Next.js -- Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) -- HIGH confidence
- [Next.js -- Error Handling](https://nextjs.org/docs/app/api-reference/file-conventions/error) -- HIGH confidence
- [Next.js -- generateMetadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) -- HIGH confidence
- [rayriffy/thai-lotto-api on GitHub](https://github.com/rayriffy/thai-lotto-api) -- MEDIUM confidence (API exists, response shape inferred)
- [Thai lottery prize structure -- Wikipedia](https://en.wikipedia.org/wiki/Thai_lottery) -- HIGH confidence
- [STACK.md research](./STACK.md) -- API response shape details, caching patterns
- [FEATURES.md research](./FEATURES.md) -- Prize tiers, mobile UX patterns, feature prioritization
