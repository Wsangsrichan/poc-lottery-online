# Technology Stack

**Project:** poc-lottery-online (Thai Government Lottery Checker)
**Researched:** 2026-04-25
**Overall confidence:** HIGH

---

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.5.x (latest stable 15.x) | Framework | App Router is mature since 14.x; 15.x adds `async` params/searchParams, `useOptimistic`, `after()`, React 19 support. Next.js 16.x exists (16.2.4 is latest) but is too new for a POC where stability matters more than bleeding edge. 15.x has the largest community knowledge base. |
| React | 19.x | UI runtime | Required peer dep of Next.js 15.x and 16.x. React 19 is stable (19.2.5 latest). |
| TypeScript | 5.x (6.0.3 latest) | Type safety | Type-safe API response shapes prevent runtime surprises with the lottery data. 5.x is proven; 6.0.3 exists but 5.x has widest ecosystem support. Use whatever `create-next-app` scaffolds. |

### Styling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Styling | v4 (4.2.4 latest) is the current major. CSS-first config (`@import "tailwindcss"` in CSS, not `tailwind.config.js`). New `@theme` directive replaces JS config. Faster build via Lightning CSS engine. `@tailwindcss/postcss` is the PostCSS plugin (4.2.4). Mobile-first utility classes, no CSS files to maintain. |
| -- | -- | UI Components | No component library (shadcn/ui, MUI, etc.) for v1 POC. The app has ~5 components (input, result card, prize list, history). Custom Tailwind is faster to iterate and lighter. Add shadcn/ui in v2 if complexity grows. |

### Data & State
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Native `fetch` | built-in | API data fetching | Server Components fetch lottery results with ISR revalidation. No SWR or TanStack Query needed -- this is server-fetched, not client-polled. |
| localStorage | built-in | User history | POC scope, no auth. Custom `useLotteryHistory` hook with hydration guard. |
| React `useState` + `useEffect` | built-in | Client state | The app has minimal client state: input value, check result, history list. No need for Zustand/Redux/Jotai. |

### Fonts & Typography
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `next/font/google` | built-in | Thai font loading | Zero-layout-shift font loading. Use **Sarabun** (Thai government standard font) or **Noto Sans Thai**. Self-hosted via `next/font` (no Google CDN request at runtime). |
| `@fontsource/noto-sans-thai` | 5.2.8 (fallback option) | Local Thai font | If `next/font/google` is blocked in target region. 5.2.8 latest. Not needed unless googleapis.com is unreliable for Thai users. |

### Infrastructure
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | latest | Deployment | Native Next.js platform. ISR caching on global CDN. Zero-config for App Router. Free tier sufficient (100GB bandwidth, 100K function invocations). |
| Node.js | 18+ | Runtime | Vercel default. Full `fetch` API. No edge runtime needed for this use case. |
| npm | latest | Package manager | Standard choice. pnpm works too if preferred locally -- Vercel respects lockfiles. |

---

## Why Next.js 15.x Instead of 14.x or 16.x

### 14.x -- Do NOT use
Next.js 14 reached end-of-life. Latest stable is 14.2.35. No more security patches. App Router works but you miss 15 months of fixes and features.

**Confidence: HIGH** -- verified via npm (14.2.35 is last 14.x release, no new releases since 15.0.0 launched).

### 15.x -- RECOMMENDED
- **Latest stable:** 15.5.15 (as of 2026-04-25)
- **React 19 support** with full Server Components maturity
- **Async `params` and `searchParams`** in page/layout components (avoids the `use()` wrapper hack from 14.x)
- **`useOptimistic`** built-in hook (useful if adding real-time check feedback in v2)
- **`after()`** API for running work after response streams (useful for analytics/logging)
- Largest community knowledge base among currently-supported versions
- All major shadcn/ui and Tailwind v4 docs target 15.x

**Confidence: HIGH** -- verified via npm registry (15.5.15 is latest 15.x stable).

### 16.x -- Too new for POC
- **Latest stable:** 16.2.4 (as of 2026-04-25)
- Introduces `proxy.ts` (renamed from `middleware.ts`), breaking change
- New `React Compiler` integration (`babel-plugin-react-compiler` is now an optional peer dep)
- Major version means ecosystem docs, shadcn/ui compatibility, and troubleshooting resources are still catching up
- For a POC lottery checker, 16.x features (proxy rename, compiler) provide zero practical benefit

**Recommendation:** Start with 15.5.x. Upgrade to 16.x after it has 6+ months of ecosystem maturity (likely late 2026). The migration path from 15.x to 16.x is straightforward (middleware rename, optional compiler).

**Confidence: MEDIUM** -- npm data confirms versions, but could not fetch Next.js 16 changelog (web search rate-limited). The middleware-to-proxy rename and React Compiler integration are based on training data and should be verified against official docs before migration.

---

## Why Tailwind CSS 4.x Instead of 3.x

### Key changes in v4
- **CSS-first config:** No more `tailwind.config.js`. Configuration lives in CSS with `@theme { }` blocks.
- **Lightning CSS engine:** 10x faster builds vs v3's PostCSS-based pipeline.
- **`@tailwindcss/postcss`:** The new PostCSS plugin (replaces `tailwindcss` PostCSS plugin). Version 4.2.4.
- **Automatic content detection:** No more `content: ['./src/**/*.{ts,tsx}']` -- v4 auto-detects source files.
- **New `@import "tailwindcss"` syntax:** Replaces `@tailwind base/components/utilities` directives.

### Setup for Next.js 15.x with Tailwind v4
```bash
npm install tailwindcss @tailwindcss/postcss
```

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-gold: #FFD700;
  --color-gold-dark: #B8860B;
  --font-sarabun: "Sarabun", sans-serif;
}
```

```javascript
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

**Confidence: MEDIUM-HIGH** -- npm confirms 4.2.4 is latest. Tailwind v4 CSS-first config pattern is well-established. Could not verify exact `@tailwindcss/postcss` setup against latest official docs (web search rate-limited).

---

## External Lottery API

### Recommended: rayriffy Thai Lotto API

| Property | Value |
|----------|-------|
| Base URL | `https://lotto.api.rayriffy.com` |
| Auth | None (open, no API key) |
| Status | Community-maintained, active GitHub repo |

**Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/latest` | GET | Most recent draw -- all prizes |
| `/list/:page?` | GET | Paginated list of past draw dates + IDs |
| `/lotto/:id` | GET | Specific draw by ID |

**Response structure (`/latest`):**
```json
{
  "status": "success",
  "response": {
    "date": "16/04/2568",
    "endpoint": "https://sanook.com/...",
    "prizes": [
      {
        "id": "first",
        "name": "รางวัลที่ 1",
        "reward": 6000000,
        "count": 1,
        "number": ["XXXXXX"]
      }
    ],
    "runningNumbers": [
      { "id": "front3", "name": "เลขหน้า 3 ตัว", "number": ["XXX", "XXX"] },
      { "id": "back3",  "name": "เลขท้าย 3 ตัว", "number": ["XXX", "XXX"] },
      { "id": "back2",  "name": "เลขท้าย 2 ตัว", "number": ["XX"] }
    ]
  }
}
```

**Reliability risk:** Source crawls sanook.com. If sanook.com changes HTML structure, the API breaks. Mitigation: implement graceful fallback in UI, consider RapidAPI alternative for v2.

**Confidence: MEDIUM** -- GitHub repo confirmed active (104 stars). Response structure from README. Not live-tested at research time.

### API Fallback Strategy (important for POC reliability)
1. **Primary:** rayriffy API with `revalidate: 3600` (1 hour ISR)
2. **Failure mode:** Show "ยังไม่มีผลรางวัล" or cached last-known results from client localStorage
3. **v2 fallback:** Switch to RapidAPI Thailand National Lottery if rayriffy proves unreliable

---

## Data Fetching Architecture

### Server Component + ISR (for lottery results)

```typescript
// app/page.tsx -- Server Component (no 'use client')
async function getLotteryResults() {
  const res = await fetch('https://lotto.api.rayriffy.com/latest', {
    next: { revalidate: 3600 }, // ISR: stale-while-revalidate, cached on CDN
  })
  if (!res.ok) throw new Error('Failed to fetch lottery results')
  return res.json()
}

export default async function HomePage() {
  const data = await getLotteryResults()
  return <LotteryResultDisplay data={data} />
}
```

### Client Component (for number checking)

The actual prize-matching is pure client logic -- no fetch needed. Server Component passes result data as props.

```typescript
// components/NumberChecker.tsx
'use client'
function checkPrize(userNumber: string, results: LotteryResult): PrizeMatch | null {
  // Compare 6 digits against prizes array
  // Compare last 2/3 digits for running number prizes
  // Compare adjacent numbers for near-prize
}
```

### No data-fetching library needed
Do NOT install SWR, TanStack Query, or axios. The pattern is:
- Server Components fetch with native `fetch` + ISR
- Client components only read props + localStorage

These libraries solve client-side polling/caching problems that this app does not have.

**Confidence: HIGH** -- this is the canonical Next.js App Router pattern.

---

## localStorage Patterns

### The hydration problem

`localStorage` does not exist during SSR. Accessing it directly causes hydration mismatch. Fix: always read inside `useEffect` after hydration.

```typescript
// hooks/useLotteryHistory.ts
'use client'
import { useState, useEffect } from 'react'

const HISTORY_KEY = 'lottery-check-history'

export interface HistoryEntry {
  number: string
  drawDate: string
  result: 'win' | 'lose'
  prizeName?: string
  checkedAt: number
}

export function useLotteryHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      if (stored) setHistory(JSON.parse(stored))
    } catch {
      // localStorage throws in Safari private mode
    }
  }, [])

  function addEntry(entry: Omit<HistoryEntry, 'checkedAt'>) {
    const next = [{ ...entry, checkedAt: Date.now() }, ...history].slice(0, 50)
    setHistory(next)
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)) } catch { /* quota */ }
  }

  function clearHistory() {
    setHistory([])
    localStorage.removeItem(HISTORY_KEY)
  }

  return { history, addEntry, clearHistory, mounted }
}
```

**Key rules:**
- Initialize `useState` with empty value (SSR-safe)
- Read localStorage only inside `useEffect`
- Gate UI on `mounted` to prevent flash: `if (!mounted) return null`
- Wrap in try/catch -- localStorage throws in private browsing
- Cap history at 50 entries to avoid quota issues

**Confidence: HIGH** -- standard Next.js pattern, widely documented.

---

## Mobile-First UI Patterns (Tailwind)

### Input field -- mobile-optimized

```tsx
<input
  type="tel"          // numeric keyboard on mobile, preserves leading zeros
  inputMode="numeric"
  maxLength={6}
  pattern="[0-9]{6}"
  className="w-full rounded-xl border-2 border-gray-300 px-4 py-4 text-center
             text-3xl font-bold tracking-[0.3em] focus:border-blue-500
             focus:outline-none"
/>
```

Use `type="tel"` not `type="number"` -- number inputs strip leading zeros ("012345" becomes 12345).

### Prize result card

```tsx
<div className="rounded-2xl bg-yellow-400 p-6 text-center shadow-lg">
  <p className="text-sm font-semibold uppercase tracking-widest text-yellow-900">
    รางวัลที่ 1
  </p>
  <p className="mt-2 text-5xl font-bold tracking-[0.2em] text-yellow-900">
    123456
  </p>
  <p className="mt-1 text-lg text-yellow-800">6,000,000 บาท</p>
</div>
```

### Breakpoints

```
mobile (default): single column, large tap targets
md (768px+):      2-column prize grid
lg (1024px+):     sidebar layout or wider card
```

### Thai font setup

```typescript
// app/layout.tsx
import { Sarabun } from 'next/font/google'
const sarabun = Sarabun({ subsets: ['thai', 'latin'], weight: ['400', '600', '700'] })
// Apply: className={sarabun.className} on <body>
```

Sarabun is the Thai government/formal standard font. Appropriate for lottery context. Noto Sans Thai is an alternative with broader weight range.

---

## Vercel Deployment

### Zero-config
Vercel detects Next.js automatically. No `vercel.json` required. Connect GitHub repo, auto-build on push to `main`.

### Build settings (Vercel defaults)
```
Build command:   next build
Output dir:      .next (auto-detected)
Install command: npm install
Framework:       Next.js (auto-detected)
```

### Environment variables
| Variable | Scope | Purpose |
|----------|-------|---------|
| `LOTTERY_API_BASE_URL` | Server-only | API base URL (no `NEXT_PUBLIC_` prefix) |

For v1 with rayriffy (no key needed), you can hardcode the URL or use the env var. The env var is better practice for swapping APIs without code changes.

### ISR on Vercel
ISR (`revalidate`) works natively on Vercel -- pages cached on global CDN with durable storage persistence. This is the killer feature for a lottery checker: results cached at the edge, revalidated hourly.

### Free tier limits
- 100GB bandwidth/month
- 100,000 serverless function invocations/month
- ISR/CDN: included

More than sufficient for a POC lottery checker.

**Confidence: HIGH** -- standard Vercel + Next.js setup.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 15.x | Next.js 16.x | 16.x too new, breaking changes (middleware->proxy), no practical benefit for this app |
| Framework | Next.js 15.x | Next.js 14.x | 14.x is EOL, no more security patches |
| Styling | Tailwind 4.x | Tailwind 3.x | 3.x is legacy, slower builds, JS config is deprecated pattern |
| Styling | Custom Tailwind | shadcn/ui | POC has ~5 components; component library adds setup overhead for no gain |
| State | React useState | Zustand / Redux | App has 3 pieces of state; global state library is overkill |
| Data fetch | Native fetch + ISR | SWR / TanStack Query | Server-fetched data with ISR; client libraries solve a different problem |
| API | rayriffy | RapidAPI | Free vs paid; POC should start free |
| Font | next/font Sarabun | Google Fonts `<link>` | `next/font` eliminates layout shift and external DNS request |
| Package mgr | npm | pnpm | Either works; Vercel respects lockfiles. npm is default. |

---

## Installation

```bash
# Create project (Next.js 15 with App Router + TypeScript + Tailwind + ESLint)
npx create-next-app@latest poc-lottery-online \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --no-import-alias \
  --use-npm

cd poc-lottery-online

# Tailwind v4 PostCSS plugin (create-next-app may scaffold this already)
npm install tailwindcss @tailwindcss/postcss

# Dev dependencies
npm install -D @types/node

# No additional runtime dependencies needed for v1
```

**Expected dependency tree (v1):**
```json
{
  "dependencies": {
    "next": "^15.5.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwindcss": "^4.2.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.2.0",
    "@types/node": "^22.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## What NOT to Use (and Why)

| Library | Why Avoid |
|---------|-----------|
| `axios` | Native `fetch` is built into Node.js 18+ and browsers. Axios adds 30KB for zero benefit. |
| `swr` / `@tanstack/react-query` | Solves client-side cache/stale/revalidate. Our data is server-fetched with ISR. Wrong layer. |
| `zustand` / `redux` / `jotai` | 3 pieces of client state do not need a state management library. |
| `shadcn/ui` (for v1) | Setup overhead (components.json, radix primitives, path aliases) for 5 components. Add in v2 if UI grows. |
| `next-auth` / `clerk` | No auth needed for POC. localStorage is sufficient. |
| `prisma` / `drizzle` / any ORM | No database. External API + localStorage only. |
| `tailwindcss` v3 config format | `tailwind.config.js` is deprecated in v4. Use CSS-first `@theme` blocks. |
| `@next/font` | Renamed to `next/font` since Next.js 13.2. Use `next/font/google`. |
| `autoprefixer` | Not needed with Tailwind v4 -- Lightning CSS handles prefixing. |

---

## Confidence Assessment

| Area | Confidence | Source | Notes |
|------|-----------|--------|-------|
| Next.js versions (14/15/16 latest) | HIGH | npm registry | Directly verified: 14.2.35, 15.5.15, 16.2.4 |
| Tailwind CSS v4 latest | HIGH | npm registry | 4.2.4 verified. `@tailwindcss/postcss` 4.2.4 confirmed. |
| React 19 latest | HIGH | npm registry | 19.2.5 verified |
| TypeScript latest | HIGH | npm registry | 6.0.3 latest, 5.x stable |
| Next.js 15 ISR/fetch patterns | HIGH | Official docs (training data) | Canonical App Router pattern |
| Vercel deployment config | HIGH | Official docs (training data) | Zero-config confirmed |
| localStorage/hydration pattern | HIGH | Official docs + community | Standard pattern |
| Tailwind v4 CSS-first config | MEDIUM-HIGH | npm + training data | Pattern confirmed but exact `@import` syntax should be verified against tailwindcss.com when web search available |
| rayriffy API structure | MEDIUM | GitHub README | Active repo, no live endpoint test |
| Next.js 16 breaking changes | MEDIUM | Training data + npm | middleware->proxy rename, React Compiler; could not verify against official changelog |
| shadcn/ui v1 unnecessary | HIGH | Architectural assessment | ~5 components, POC scope |

---

## Sources

- npm registry: `next`, `tailwindcss`, `@tailwindcss/postcss`, `react`, `react-dom`, `typescript`, `shadcn`, `@fontsource/noto-sans-thai` (all queried 2026-04-25)
- [Next.js official docs](https://nextjs.org/docs) (training data, not live-verified for 15.x/16.x specifics due to web search rate limit)
- [Tailwind CSS v4 docs](https://tailwindcss.com/docs) (training data, not live-verified for v4 specifics)
- [Vercel Next.js docs](https://vercel.com/docs/frameworks/full-stack/nextjs) (training data)
- [rayriffy/thai-lotto-api on GitHub](https://github.com/rayriffy/thai-lotto-api) (training data)
- [Next.js 14 Data Fetching docs](https://nextjs.org/docs/14/app/building-your-application/data-fetching/fetching-caching-and-revalidating) (training data, pattern applicable to 15.x)

**Note:** Web search tools were rate-limited during this research session. All version numbers are verified via npm registry. Architectural patterns and API details are based on official documentation (training data) and should be spot-checked against live docs when web search is available.
