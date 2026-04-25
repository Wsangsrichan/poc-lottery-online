# Phase 1 Research — v1 Lottery Checker

**Phase:** 1 — v1 Lottery Checker (full build)
**Compiled:** 2026-04-25
**Source:** .planning/research/{STACK,FEATURES,ARCHITECTURE,PITFALLS}.md
**Confidence:** MEDIUM-HIGH

---

## Critical Findings (Read First)

### ⚠ API CRISIS: No Working Free Thai Lottery API Exists

Live tests on 2026-04-25 show ALL documented free APIs are broken:

| API | Status | Issue |
|-----|--------|-------|
| `lotto.api.rayriffy.com/latest` | 200 OK | Returns ElysiaJS type schema (`"date: string"`) NOT real data |
| `api.lottery.hunsa.com` | N/A | Domain does not exist |
| `glo.or.th/api/lottery` | 5xx | Server error |
| `lottery.co.th/api/results` | 404 | No API |
| `lottery-thai-api.vercel.app` | NOT_FOUND | Removed |

**Consequence:** Cannot ship with external API as primary source.

**Recommended strategy for POC v1 (3-layer):**
1. **Static fallback data** (MUST): Commit current draw results as `src/data/lottery-fallback.json`. App always works even with zero API.
2. **Scraper route** (SHOULD): `app/api/lottery/route.ts` — Next.js API route that scrapes sanook.com/lotto (`https://lotto.sanook.com/`) using cheerio. Run on demand + ISR revalidation. Sanook is stable, used by millions of Thai users.
3. **LotteryDataSource abstraction** (MUST): TypeScript interface so any source can be swapped via `LOTTERY_DATA_SOURCE=static|scraper` env var.

```typescript
interface LotteryDataSource {
  getLatest(): Promise<LotteryResult>
}
```

---

## Recommended Stack

| Tech | Version | Notes |
|------|---------|-------|
| Next.js | 15.5.x | App Router, stable, largest ecosystem support |
| React | 19.x | Required peer dep of Next.js 15.x |
| TypeScript | 5.x | Use whatever create-next-app scaffolds |
| Tailwind CSS | 4.x | CSS-first config (`@import "tailwindcss"` in CSS, no tailwind.config.js) |
| cheerio | 1.0.x | HTML scraping for sanook.com |
| zod | 3.x | Runtime validation of scraped/API data |
| Vercel | latest | Native Next.js platform, free tier sufficient |

**No component library** for v1 — only ~8 components, custom Tailwind is faster.

**Font:** `next/font/google` with Sarabun (Thai government standard font). Self-hosted via next/font.

---

## Thai Lottery Domain Knowledge

### Prize Tiers (use these hardcoded amounts — API amounts are unreliable)

| ID | Thai Name | Matching Rule | Prize (THB, per ticket TGL) |
|----|-----------|--------------|----------------------------|
| `first` | รางวัลที่ 1 | All 6 digits exact | 2,000,000 |
| `adjacent` | รางวัลข้างเคียงรางวัลที่ 1 | First prize ±1 (no wraparound) | 100,000 |
| `second` | รางวัลที่ 2 | 6 digits exact (5 numbers) | 200,000 |
| `third` | รางวัลที่ 3 | 6 digits exact (10 numbers) | 80,000 |
| `fourth` | รางวัลที่ 4 | 6 digits exact (50 numbers) | 40,000 |
| `fifth` | รางวัลที่ 5 | 6 digits exact (100 numbers) | 20,000 |
| `front3` | เลขหน้า 3 ตัว | First 3 digits match (2 numbers) | 4,000 |
| `back3` | เลขท้าย 3 ตัว | Last 3 digits match (2 numbers) | 4,000 |
| `back2` | เลขท้าย 2 ตัว | Last 2 digits match (1 number) | 2,000 |

**Important:**
- Display amounts as "per ticket" (ต่อใบ), label clearly — NOT per-pair (ชุดละ)
- Adjacent: no wraparound (999999 + 1 does NOT wrap to 000000)
- A single ticket can win MULTIPLE prizes simultaneously — show all matches
- **NO โต๊ด** — that's underground lottery (หวยใต้ดิน), out of scope for government lottery

### Checking Algorithm

```typescript
function matchPrizes(ticket: string, draw: LotteryResult): PrizeMatch[] {
  const matches: PrizeMatch[] = []
  // 1. First prize exact match
  // 2. Adjacent = (Number(firstPrize) ± 1).toString().padStart(6, '0') — no wraparound
  // 3. Prizes 2-5: exact 6-digit match against their arrays
  // 4. Front 3: ticket.slice(0, 3) in front3.numbers
  // 5. Back 3: ticket.slice(3) in back3.numbers
  // 6. Back 2: ticket.slice(4) === back2.number[0]
  return matches // all matches, not just highest
}
```

---

## Architecture

### File Tree

```
src/
├── app/
│   ├── layout.tsx           # Server: font (Sarabun), metadata, <html lang="th">
│   ├── page.tsx             # Server: fetches lottery data, passes to client boundary
│   ├── error.tsx            # Client (Next.js convention): error boundary
│   ├── loading.tsx          # Suspense fallback — skeleton UI
│   ├── not-found.tsx        # 404
│   └── api/
│       └── lottery/
│           └── route.ts    # GET — scrape sanook.com or return fallback
│
├── components/
│   ├── CheckForm.tsx        # 'use client' — 6-digit input, submit, validation
│   ├── CheckResult.tsx      # 'use client' — win/lose display, prize badges
│   ├── PrizeTable.tsx       # Server — full draw results (zero JS)
│   ├── HistoryPanel.tsx     # 'use client' — localStorage history
│   ├── HistoryItem.tsx      # pure display — ticket + badge + re-check
│   ├── ShareButton.tsx      # 'use client' — Web Share API / clipboard fallback
│   ├── PrizeBadge.tsx       # pure — prize label + amount chip
│   └── DrawDateHeader.tsx   # Server — "งวดประจำวันที่ X"
│
└── lib/
    ├── lottery.ts           # matchPrizes() — pure function, all prize logic
    ├── lottery-api.ts       # LotteryDataSource abstraction + implementations
    ├── lottery-schema.ts    # Zod schemas for data validation
    ├── history.ts           # localStorage helpers (hydration-safe)
    └── types.ts             # All TypeScript interfaces
```

### Server vs Client Boundaries

| File | Directive | Why |
|------|-----------|-----|
| `layout.tsx` | Server | Fonts, metadata, no state |
| `page.tsx` | Server | Fetches + validates data, SSR |
| `error.tsx` | `'use client'` | Next.js convention requires it |
| `CheckForm.tsx` | `'use client'` | useState for input + submit |
| `CheckResult.tsx` | `'use client'` | Conditional render on match state |
| `PrizeTable.tsx` | Server | Pure display, zero JS shipped |
| `HistoryPanel.tsx` | `'use client'` | localStorage is browser-only |
| `ShareButton.tsx` | `'use client'` | navigator.share is browser-only |

**Key:** Prize matching runs ENTIRELY CLIENT-SIDE (instant, no API call per check). Data already in browser via props from page.tsx.

### Data Fetching Strategy

```
page.tsx
  → fetchLotteryData() [lib/lottery-api.ts]
    → first: GET /api/lottery (Next.js route = scraper)
    → if scraper fails: serve lottery-fallback.json
    → validate with Zod
    → return LotteryResult
  → ISR: revalidate = 43200 (12 hours)
```

URL parameter support: `/?ticket=123456` → auto-populate input on page load (for share URLs).

---

## Pitfalls to Avoid

1. **API returns schema not data** — solved by static fallback + scraper abstraction
2. **No working free API** — solved by sanook.com scraper as primary source
3. **Prize amounts per-pair vs per-ticket** — ALWAYS show per-ticket, label "ต่อใบ"
4. **โต๊ด confusion** — NOT in v1; official lottery is exact-match only
5. **input type="number" strips leading zeros** — use `type="tel"` + `inputMode="numeric"`
6. **localStorage SSR hydration mismatch** — use `useEffect` for history reads, never read in render
7. **Ticket can win multiple prizes** — matchPrizes() must return ALL matches, not just first
8. **Adjacent prize wraparound** — 000000 - 1 stays at 000000 (no wrap to 999999)

---

## Vercel Deployment

- `vercel.json` or `vercel.ts` not needed — Next.js auto-detected
- ISR caching: `revalidate: 43200` on the lottery fetch
- Environment variables: `LOTTERY_DATA_SOURCE=scraper` (or `static` for fallback-only)
- Free tier: 100GB bandwidth, 100K invocations — sufficient for POC

---

## Sanook.com Scraping Notes

**Target:** `https://lotto.sanook.com/` — major Thai portal, stable, used by millions
**Method:** fetch + cheerio (HTML parse) in Next.js API route
**Pattern:**
```typescript
import * as cheerio from 'cheerio'
const res = await fetch('https://lotto.sanook.com/', { next: { revalidate: 43200 } })
const html = await res.text()
const $ = cheerio.load(html)
// parse prize tables — inspect actual DOM structure first
```
**Risk:** Site redesign breaks scraper — mitigated by static fallback always being available.
**Alternative sources:** mthai.com/lotto, kapook.com/lotto (similar HTML structure)
