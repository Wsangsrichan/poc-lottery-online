---
phase: 01-v1-lottery-checker
plan: D
type: execute
wave: 2
depends_on:
  - 01-PLAN-A
  - 01-PLAN-B
  - 01-PLAN-C
files_modified:
  - src/app/page.tsx
  - src/app/error.tsx
  - src/app/not-found.tsx
  - .env.local
  - .env.example
autonomous: false
requirements:
  - REQ-06
  - REQ-09
  - REQ-10

must_haves:
  truths:
    - "Page loads latest draw data via ISR (revalidate: 43200) on page.tsx server component"
    - "?ticket=123456 URL param auto-populates CheckForm and auto-runs the check on mount"
    - "error.tsx shows Thai error message + 'ลองอีกครั้ง' button that calls router.refresh()"
    - "App is deployed to Vercel and reachable at a public URL"
    - "LOTTERY_DATA_SOURCE env var is set in Vercel project settings"
  artifacts:
    - path: "src/app/page.tsx"
      provides: "Server component: fetches draw, passes to client, two-column desktop layout"
      contains: "revalidate"
    - path: "src/app/error.tsx"
      provides: "Error boundary with Thai copy + refresh"
      contains: "router.refresh"
    - path: "src/app/not-found.tsx"
      provides: "404 page"
      contains: "ไม่พบหน้า"
  key_links:
    - from: "src/app/page.tsx"
      to: "src/lib/lottery-api.ts"
      via: "fetchLotteryData() called at server render time"
      pattern: "fetchLotteryData"
    - from: "src/app/page.tsx"
      to: "src/components/CheckForm.tsx"
      via: "passes draw + initialTicket + onResult callback as props"
      pattern: "CheckForm"
    - from: "Vercel dashboard"
      to: "src/app/api/lottery/route.ts"
      via: "LOTTERY_DATA_SOURCE=scraper env var controls ScraperDataSource vs StaticDataSource"
      pattern: "LOTTERY_DATA_SOURCE"

user_setup:
  - service: vercel
    why: "Deploy the Next.js app to Vercel for public access (REQ-10)"
    env_vars:
      - name: LOTTERY_DATA_SOURCE
        source: "Set to 'scraper' in Vercel Dashboard → Project → Settings → Environment Variables"
      - name: NEXT_PUBLIC_BASE_URL
        source: "Set to your Vercel deployment URL, e.g. https://poc-lottery-online.vercel.app — needed so ScraperDataSource can call /api/lottery from the server"
    dashboard_config:
      - task: "Link project to Vercel"
        location: "Run: vercel link (or vercel --prod from project root)"
      - task: "Set environment variables"
        location: "Vercel Dashboard → poc-lottery-online → Settings → Environment Variables"
---

<objective>
Wire all components into the final page.tsx server component, build the page client shell for state management, handle error and 404 pages, and deploy to Vercel.

Purpose: Complete the user-facing application. page.tsx is the composition root — it fetches draw data server-side, passes to client, and orchestrates the two-column desktop layout. Vercel deployment makes it publicly reachable.

Output:
- src/app/page.tsx: Server component with ISR + client shell for check state
- src/app/error.tsx: Thai error boundary
- src/app/not-found.tsx: Thai 404
- App deployed at Vercel production URL
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
<!-- From Plan A + Plan B + Plan C — executor uses these directly -->

```typescript
// src/lib/lottery-api.ts
export async function fetchLotteryData(): Promise<LotteryResult>

// src/lib/lottery.ts
export function matchPrizes(ticket: string, draw: LotteryResult): PrizeMatch[]

// src/components/DrawDateHeader.tsx  — Server Component
export default function DrawDateHeader(props: { drawDateThai: string })

// src/components/CheckForm.tsx       — 'use client'
export default function CheckForm(props: {
  draw: LotteryResult
  initialTicket?: string
  onResult: (ticket: string, matches: PrizeMatch[]) => void
})

// src/components/CheckResult.tsx     — 'use client'
export default function CheckResult(props: { ticket: string; matches: PrizeMatch[] })

// src/components/PrizeTable.tsx      — Server Component
export default function PrizeTable(props: { draw: LotteryResult })

// src/components/HistoryPanel.tsx    — 'use client'
export default function HistoryPanel(props: { onRecheck: (ticket: string) => void })
```

<!-- Layout from UI-SPEC.md -->
Mobile (default):
  DrawDateHeader → CheckForm → CheckResult (conditional) → PrizeTable → HistoryPanel

Desktop (md:):
  DrawDateHeader → CheckForm → CheckResult (conditional)
  Two-column: PrizeTable (60%) | HistoryPanel (40%)

<!-- ISR from RESEARCH.md -->
export const revalidate = 43200  // 12 hours — on page.tsx
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task D1: Page assembly — server fetch + client shell</name>
  <files>
    src/app/page.tsx, src/app/error.tsx, src/app/not-found.tsx, .env.local, .env.example
  </files>
  <read_first>
    - /home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-RESEARCH.md (Data Fetching Strategy, ISR revalidate, URL parameter support, pitfalls)
    - /home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-UI-SPEC.md (Layout Contract — mobile single-column, desktop two-column; Interaction Contracts — Check Flow steps 1-7, URL Share Flow, Error Boundary)
    - src/app/page.tsx (current placeholder from Plan A — will be fully replaced)
    - src/app/layout.tsx (to understand existing html/body wrapper)
    - src/components/CheckForm.tsx (onResult callback signature)
    - src/components/CheckResult.tsx (props: ticket, matches)
    - src/lib/lottery-api.ts (fetchLotteryData signature)
  </read_first>
  <action>
The page architecture uses a pattern common in Next.js 15: a Server Component (page.tsx) that fetches data, then renders a Client Component "shell" (LotteryPageClient) that manages check state locally. This avoids making the whole page a client component while still enabling reactive state for check results.

Create `src/app/page.tsx` (Server Component — fetches draw data, passes to client shell):

```tsx
import { fetchLotteryData } from '@/lib/lottery-api'
import DrawDateHeader from '@/components/DrawDateHeader'
import PrizeTable from '@/components/PrizeTable'
import LotteryPageClient from './LotteryPageClient'

// ISR: cache for 12 hours, revalidate in background
export const revalidate = 43200

interface PageProps {
  searchParams: Promise<{ ticket?: string }>
}

export default async function Page({ searchParams }: PageProps) {
  // Next.js 15: searchParams is async — must be awaited
  const params = await searchParams
  const initialTicket = params.ticket?.replace(/\D/g, '').slice(0, 6) ?? ''

  const draw = await fetchLotteryData()

  return (
    <main className="max-w-2xl mx-auto py-lg pb-3xl">
      <DrawDateHeader drawDateThai={draw.drawDateThai} />

      {/*
        LotteryPageClient manages check state (ticket + matches).
        It receives draw data as a prop (already fetched server-side)
        so matchPrizes() runs client-side with zero additional API calls.
      */}
      <LotteryPageClient draw={draw} initialTicket={initialTicket} />

      {/* PrizeTable is a Server Component — zero JS shipped to client */}
      <section className="mt-2xl">
        <PrizeTable draw={draw} />
      </section>
    </main>
  )
}
```

Create `src/app/LotteryPageClient.tsx` ('use client' — manages check state, HistoryPanel re-check wiring):

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LotteryResult, PrizeMatch } from '@/lib/types'
import { matchPrizes } from '@/lib/lottery'
import CheckForm from '@/components/CheckForm'
import CheckResult from '@/components/CheckResult'
import HistoryPanel from '@/components/HistoryPanel'

interface LotteryPageClientProps {
  draw: LotteryResult
  initialTicket: string  // from ?ticket= URL param (already sanitized server-side)
}

export default function LotteryPageClient({ draw, initialTicket }: LotteryPageClientProps) {
  const [checkedTicket, setCheckedTicket] = useState<string | null>(null)
  const [matches, setMatches] = useState<PrizeMatch[]>([])

  // Auto-run check if ?ticket= was in URL (REQ share flow)
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

  // When history item is tapped, re-run check for that ticket
  const handleRecheck = useCallback((ticket: string) => {
    const reMatches = matchPrizes(ticket, draw)
    setCheckedTicket(ticket)
    setMatches(reMatches)
    // Update URL for sharing
    const url = new URL(window.location.href)
    url.searchParams.set('ticket', ticket)
    window.history.replaceState({}, '', url.toString())
    // Scroll to top to show result
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
        <div className="px-md">
          <CheckResult ticket={checkedTicket} matches={matches} />
        </div>
      )}

      <div className="mt-sm">
        <HistoryPanel onRecheck={handleRecheck} />
      </div>
    </div>
  )
}
```

Note: LotteryPageClient is co-located in src/app/ (not src/components/) because it is page-specific orchestration, not a reusable component.

Create `src/app/error.tsx` ('use client' — Next.js App Router convention requires client directive):

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    console.error('[error.tsx]', error)
  }, [error])

  return (
    <main className="max-w-2xl mx-auto px-md py-2xl text-center">
      <h1 className="text-xl font-semibold text-error mb-sm">ไม่สามารถโหลดข้อมูลได้</h1>
      <p className="text-base text-gray-600 mb-lg">
        ข้อมูลผลรางวัลอาจล่าช้า กรุณาลองอีกครั้งในอีกสักครู่
      </p>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="h-12 px-xl rounded-lg bg-gold text-white text-base font-semibold
          hover:brightness-95 active:brightness-90 transition-all duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      >
        ลองอีกครั้ง
      </button>
    </main>
  )
}
```

Create `src/app/not-found.tsx`:

```tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="max-w-2xl mx-auto px-md py-2xl text-center">
      <h1 className="text-xl font-semibold text-text mb-sm">ไม่พบหน้าที่ต้องการ</h1>
      <p className="text-base text-text-muted mb-lg">หน้านี้ไม่มีในระบบ</p>
      <Link
        href="/"
        className="inline-flex items-center h-12 px-xl rounded-lg bg-gold text-white
          text-base font-semibold hover:brightness-95 transition-all duration-150"
      >
        กลับหน้าหลัก
      </Link>
    </main>
  )
}
```

Create `.env.local` (local development — NEVER commit real secrets):

```
LOTTERY_DATA_SOURCE=static
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Create `.env.example` (committed to repo — documents required vars):

```
# Which data source to use: "static" (fallback JSON) or "scraper" (sanook.com)
LOTTERY_DATA_SOURCE=scraper

# Full URL of the deployment (needed so server-side fetch to /api/lottery resolves)
# Local: http://localhost:3000
# Vercel: https://your-project.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-project.vercel.app
```

Ensure `.gitignore` contains `.env.local` (create-next-app adds this by default — verify only):

```bash
grep -q '.env.local' .gitignore || echo '.env.local' >> .gitignore
```
  </action>
  <verify>
    <automated>cd /home/deploy-app/poc-lottery-online && npx tsc --noEmit 2>&1 | head -20 && npm run build 2>&1 | tail -15</automated>
  </verify>
  <acceptance_criteria>
    - src/app/page.tsx contains `export const revalidate = 43200`
    - src/app/page.tsx contains `await fetchLotteryData()`
    - src/app/page.tsx contains `await searchParams` (Next.js 15 async searchParams)
    - src/app/page.tsx does NOT contain `'use client'` (is a Server Component)
    - src/app/LotteryPageClient.tsx contains `'use client'`
    - src/app/LotteryPageClient.tsx contains `useEffect` (auto-check on initialTicket)
    - src/app/LotteryPageClient.tsx contains `matchPrizes(`
    - src/app/error.tsx contains `'use client'`
    - src/app/error.tsx contains `router.refresh()`
    - src/app/error.tsx contains `ไม่สามารถโหลดข้อมูลได้`
    - src/app/error.tsx contains `ลองอีกครั้ง`
    - src/app/not-found.tsx contains `ไม่พบหน้า`
    - .env.local exists and contains `LOTTERY_DATA_SOURCE=static`
    - .env.example exists and is committed (not in .gitignore)
    - .gitignore contains `.env.local`
    - `npx tsc --noEmit` exits 0
    - `npm run build` exits 0
  </acceptance_criteria>
  <done>Page is fully assembled. Server component fetches draw data with ISR. Client shell manages check state. URL ?ticket= auto-runs check on mount. Error and 404 pages have Thai copy. Build passes clean.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Full Next.js application is built and ready to deploy. Before deploying to Vercel:
    1. Run `npm run dev` locally
    2. Open http://localhost:3000 in browser
    3. Verify the complete user flow works
  </what-built>
  <how-to-verify>
    Run locally:
    ```bash
    cd /home/deploy-app/poc-lottery-online
    LOTTERY_DATA_SOURCE=static npm run dev
    ```

    Check each item:

    1. **Page loads** — http://localhost:3000 shows DrawDateHeader ("งวดประจำวันที่ 1 พฤษภาคม 2568") + CheckForm input + PrizeTable with all 9 prize tiers

    2. **CheckForm** — Input is centered, 48px tall, placeholder "เช่น 123456". Submit button "ตรวจสลาก" is gold and starts disabled.

    3. **Type a non-winning ticket** (e.g. "999998") → button activates → tap "ตรวจสลาก" → see "ไม่ถูกรางวัล" card appear

    4. **Type the first-prize number** "123456" (from fallback JSON) → tap "ตรวจสลาก" → see "ถูกรางวัล!" in gold + "รางวัลที่ 1" gold badge + "แชร์ผลลัพธ์" button

    5. **URL sharing** — After winning check, URL should be `?ticket=123456`. Copy URL, open in new tab → should auto-show the win result (auto-run check)

    6. **History panel** — After 2+ checks, "ประวัติการตรวจ" section appears (collapsed). Tap to expand — shows previous tickets with results grouped by draw date. Tap a history row → re-runs that check.

    7. **Share button** — Tap "แชร์ผลลัพธ์". If browser supports Web Share API: native share sheet opens. If not: URL copies to clipboard + toast "คัดลอกลิงก์แล้ว" appears for 2 seconds.

    8. **Loading skeleton** — Can be briefly seen on first load (or simulate by adding `await new Promise(r => setTimeout(r, 2000))` in fetchLotteryData temporarily). Should show gray shimmer blocks.

    9. **Mobile** — Resize browser to 375px width. All elements should be readable, buttons at least 44px tall, no horizontal scrollbar.

    10. **PrizeTable** — Adjacent numbers should be 123455 and 123457 (123456 ± 1, no wraparound). Back2 should show "56". Front3 "123" and "456".
  </how-to-verify>
  <resume-signal>Type "approved" if all items pass. Or describe any issues found and Claude will fix them before deploying.</resume-signal>
</task>

<task type="checkpoint:human-action" gate="blocking">
  <what-built>
    App passes local verification. Now deploy to Vercel.
  </what-built>
  <how-to-verify>
    Run these commands from /home/deploy-app/poc-lottery-online:

    ```bash
    # 1. Link project to Vercel (if not already linked)
    vercel link

    # 2. Deploy to production
    vercel --prod
    ```

    After deployment completes, Vercel will print the production URL (e.g. https://poc-lottery-online.vercel.app).

    Then set environment variables in Vercel Dashboard:
    - Go to: Vercel Dashboard → poc-lottery-online → Settings → Environment Variables
    - Add: `LOTTERY_DATA_SOURCE` = `scraper`
    - Add: `NEXT_PUBLIC_BASE_URL` = `https://your-production-url.vercel.app` (use the URL Vercel printed)

    After adding env vars:
    ```bash
    # Redeploy to pick up new env vars
    vercel --prod
    ```

    Verify the live deployment:
    - Open the Vercel URL in browser
    - The app should load with real lottery data (or static fallback if scraper fails)
    - Test a ticket check on mobile (use your phone)
  </how-to-verify>
  <resume-signal>Paste the Vercel production URL when deployment is complete, e.g.: "deployed: https://poc-lottery-online.vercel.app"</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser → page.tsx (Server) | No user input reaches page.tsx directly — searchParams.ticket is sanitized to /\d{6}/ before use |
| page.tsx → fetchLotteryData() | Server-side only — no user-controlled data reaches the fetch URL |
| LotteryPageClient → matchPrizes() | Ticket from history re-check passes through existing matchPrizes() which only reads draw data |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-D-01 | Tampering | page.tsx searchParams | mitigate | `params.ticket?.replace(/\D/g, '').slice(0, 6)` — strips all non-digits server-side before initialTicket reaches client. Malformed URL params silently become empty string. |
| T-01-D-02 | Information Disclosure | .env.local | mitigate | .env.local is in .gitignore (create-next-app default). .env.example documents var names only, no values. LOTTERY_DATA_SOURCE is not a secret (just a feature flag). |
| T-01-D-03 | Denial of Service | page.tsx ISR | mitigate | revalidate=43200 ensures fetchLotteryData() is called at most once per 12h at Vercel edge — not per user request. Each region caches independently. |
| T-01-D-04 | Spoofing | error.tsx reset | accept | reset() re-fetches from server — same data validation chain applies. No state is persisted across reset. |
  | T-01-D-05 | Elevation of Privilege | Vercel env vars | accept | LOTTERY_DATA_SOURCE controls only which data source is used (static vs scraper). No auth, no privileged operations available regardless of value. |
</threat_model>

<verification>
```bash
cd /home/deploy-app/poc-lottery-online

# 1. TypeScript clean
npx tsc --noEmit

# 2. Build passes
npm run build

# 3. Page structure
grep -q 'revalidate = 43200' src/app/page.tsx && echo "OK: ISR"
grep -q 'await searchParams' src/app/page.tsx && echo "OK: async searchParams"
grep -q 'fetchLotteryData' src/app/page.tsx && echo "OK: data fetch"
grep -q "'use client'" src/app/page.tsx && echo "FAIL: page.tsx must be server component" || echo "OK: page.tsx is server"
grep -q "'use client'" src/app/LotteryPageClient.tsx && echo "OK: client shell is client"
grep -q 'router.refresh' src/app/error.tsx && echo "OK: error refresh"

# 4. Env setup
test -f .env.local && echo "OK: .env.local exists"
test -f .env.example && echo "OK: .env.example committed"
grep -q '.env.local' .gitignore && echo "OK: .env.local gitignored"

# 5. Full build output
npm run build 2>&1 | grep -E 'Route|Page|Error' | head -20
```
</verification>

<success_criteria>
- page.tsx is a Server Component with revalidate=43200 + async searchParams (Next.js 15)
- LotteryPageClient is 'use client', manages check state, auto-runs check from initialTicket
- error.tsx is 'use client', shows Thai error copy, router.refresh() on "ลองอีกครั้ง"
- .env.local is gitignored, .env.example is committed with documented vars
- Full local flow works: load → check → win/no-win → share → history → re-check from history
- App deployed to Vercel production URL
- LOTTERY_DATA_SOURCE=scraper set in Vercel env vars
- Mobile check works on real device
</success_criteria>

<output>
After completion, create `/home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-D-SUMMARY.md`
</output>
