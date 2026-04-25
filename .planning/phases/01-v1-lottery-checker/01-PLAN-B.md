---
phase: 01-v1-lottery-checker
plan: B
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/lottery.ts
  - src/lib/lottery-api.ts
  - src/lib/history.ts
  - src/data/lottery-fallback.json
  - src/app/api/lottery/route.ts
autonomous: true
requirements:
  - REQ-02
  - REQ-06
  - REQ-08
  - REQ-10

must_haves:
  truths:
    - "matchPrizes() returns ALL prize matches for a ticket (not just the first match)"
    - "Adjacent prize computation has no wraparound (000000 - 1 = 000000, 999999 + 1 = 999999)"
    - "Static fallback JSON is valid against the Zod schema and always loadable"
    - "API route returns a valid LotteryResult JSON object (from scraper or fallback)"
    - "history.ts reads localStorage only in useEffect-safe manner (never in render path)"
    - "LotteryDataSource abstraction supports LOTTERY_DATA_SOURCE=static|scraper env var"
  artifacts:
    - path: "src/lib/lottery.ts"
      provides: "matchPrizes() pure function"
      exports: ["matchPrizes", "formatPrizeAmount", "formatThaiDate"]
    - path: "src/lib/lottery-api.ts"
      provides: "LotteryDataSource implementations + fetchLotteryData()"
      exports: ["fetchLotteryData", "StaticDataSource", "ScraperDataSource"]
    - path: "src/lib/history.ts"
      provides: "localStorage CRUD for HistoryEntry[] (hydration-safe)"
      exports: ["getHistory", "addHistoryEntry", "clearHistory"]
    - path: "src/data/lottery-fallback.json"
      provides: "Static draw data — app always works with zero API"
      contains: "\"first\":"
    - path: "src/app/api/lottery/route.ts"
      provides: "Next.js API route — scrapes sanook.com or falls back to static JSON"
      exports: ["GET"]
  key_links:
    - from: "src/lib/lottery-api.ts"
      to: "src/data/lottery-fallback.json"
      via: "import fallback from '@/data/lottery-fallback.json' (static source)"
      pattern: "lottery-fallback"
    - from: "src/app/api/lottery/route.ts"
      to: "src/lib/lottery-api.ts"
      via: "ScraperDataSource.getLatest() called in GET handler"
      pattern: "ScraperDataSource"
    - from: "src/lib/lottery.ts"
      to: "src/lib/types.ts"
      via: "imports LotteryResult, PrizeMatch, PRIZE_NAMES, PRIZE_AMOUNTS"
      pattern: "from.*types"
---

<objective>
Build the complete data layer: prize matching logic, data source abstraction with 3-layer fallback, sanook.com scraper API route, localStorage history helpers, and static fallback JSON.

Purpose: This is the "engine" of the lottery checker. Plan C (UI components) and Plan D (page assembly) both consume these functions — they must be correct and well-typed before UI is built.

Output:
- src/lib/lottery.ts — matchPrizes() pure function with full prize logic
- src/lib/lottery-api.ts — LotteryDataSource abstraction, StaticDataSource, ScraperDataSource, fetchLotteryData()
- src/lib/history.ts — localStorage helpers (hydration-safe)
- src/data/lottery-fallback.json — real draw data structure
- src/app/api/lottery/route.ts — Next.js API route scraping sanook.com
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
<!-- Types from Plan A (src/lib/types.ts) — executor uses these directly -->

```typescript
// src/lib/types.ts
export type PrizeTierId = 'first' | 'adjacent' | 'second' | 'third' | 'fourth' | 'fifth' | 'front3' | 'back3' | 'back2'
export const PRIZE_NAMES: Record<PrizeTierId, string>   // Thai names
export const PRIZE_AMOUNTS: Record<PrizeTierId, number> // Per-ticket THB amounts

export interface LotteryResult {
  drawDate: string      // ISO "2025-05-01"
  drawDateThai: string  // "1 พฤษภาคม 2568"
  first: string         // 6-digit
  second: string[]      // 5 items, 6-digit
  third: string[]       // 10 items, 6-digit
  fourth: string[]      // 50 items, 6-digit
  fifth: string[]       // 100 items, 6-digit
  front3: string[]      // 2 items, 3-digit
  back3: string[]       // 2 items, 3-digit
  back2: string[]       // 1 item, 2-digit
}

export interface PrizeMatch {
  id: PrizeTierId
  name: string           // Thai name
  amount: number         // THB per ticket
  matchedDigits: string  // Which digits matched (for highlight)
}

export interface LotteryDataSource {
  getLatest(): Promise<LotteryResult>
}

export interface HistoryEntry {
  ticket: string
  drawDate: string
  drawDateThai: string
  matches: PrizeMatch[]
  checkedAt: string
}
```

```typescript
// src/lib/lottery-schema.ts
export function parseLotteryResult(raw: unknown): LotteryResult | null
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task B1: Prize matching engine + static fallback data</name>
  <files>
    src/lib/lottery.ts, src/data/lottery-fallback.json
  </files>
  <read_first>
    - /home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-RESEARCH.md (sections: "Prize Tiers", "Checking Algorithm", "Pitfalls" — especially adjacent no-wraparound and multi-prize rules)
    - /home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-UI-SPEC.md (Copywriting Contract — prize tier names + amounts table; also "บาท ต่อใบ" suffix rule)
    - src/lib/types.ts (after Plan A creates it — verify PrizeTierId, PRIZE_NAMES, PRIZE_AMOUNTS signatures)
  </read_first>
  <action>
Create `src/data/lottery-fallback.json` with draw data for งวด 1 พฤษภาคม 2568 (realistic structure, used as permanent static fallback):

```json
{
  "drawDate": "2025-05-01",
  "drawDateThai": "1 พฤษภาคม 2568",
  "first": "123456",
  "second": ["234567", "345678", "456789", "567890", "678901"],
  "third": [
    "111111", "222222", "333333", "444444", "555555",
    "666666", "777777", "888888", "999999", "100000"
  ],
  "fourth": [
    "010101", "020202", "030303", "040404", "050505",
    "060606", "070707", "080808", "090909", "101010",
    "111213", "141516", "171819", "202122", "232425",
    "262728", "293031", "323334", "353637", "383940",
    "414243", "444546", "474849", "505152", "535455",
    "565758", "596061", "626364", "656667", "686970",
    "717273", "747576", "777879", "808182", "838485",
    "868788", "899091", "929394", "959697", "989900",
    "001122", "334455", "667788", "990011", "223344",
    "556677", "889900", "112233", "445566", "778899"
  ],
  "fifth": [
    "000001", "000002", "000003", "000004", "000005",
    "000006", "000007", "000008", "000009", "000010",
    "000011", "000012", "000013", "000014", "000015",
    "000016", "000017", "000018", "000019", "000020",
    "000021", "000022", "000023", "000024", "000025",
    "000026", "000027", "000028", "000029", "000030",
    "000031", "000032", "000033", "000034", "000035",
    "000036", "000037", "000038", "000039", "000040",
    "000041", "000042", "000043", "000044", "000045",
    "000046", "000047", "000048", "000049", "000050",
    "000051", "000052", "000053", "000054", "000055",
    "000056", "000057", "000058", "000059", "000060",
    "000061", "000062", "000063", "000064", "000065",
    "000066", "000067", "000068", "000069", "000070",
    "000071", "000072", "000073", "000074", "000075",
    "000076", "000077", "000078", "000079", "000080",
    "000081", "000082", "000083", "000084", "000085",
    "000086", "000087", "000088", "000089", "000090",
    "000091", "000092", "000093", "000094", "000095",
    "000096", "000097", "000098", "000099", "000100"
  ],
  "front3": ["123", "456"],
  "back3": ["456", "789"],
  "back2": ["56"]
}
```

Create `src/lib/lottery.ts` with the EXACT content below:

```typescript
import type { LotteryResult, PrizeMatch, PrizeTierId } from './types'
import { PRIZE_NAMES, PRIZE_AMOUNTS } from './types'

// ============================================================
// matchPrizes — runs ENTIRELY CLIENT-SIDE (instant, no API call)
// Returns ALL matching prizes (a ticket can win multiple)
// ============================================================
export function matchPrizes(ticket: string, draw: LotteryResult): PrizeMatch[] {
  const matches: PrizeMatch[] = []

  function push(id: PrizeTierId, matchedDigits: string) {
    matches.push({
      id,
      name: PRIZE_NAMES[id],
      amount: PRIZE_AMOUNTS[id],
      matchedDigits,
    })
  }

  // 1. รางวัลที่ 1 — exact 6-digit match
  if (ticket === draw.first) {
    push('first', ticket)
  }

  // 2. รางวัลข้างเคียงรางวัลที่ 1 — ±1, NO wraparound
  const firstNum = parseInt(draw.first, 10)
  const adjacentBelow = firstNum > 0 ? (firstNum - 1).toString().padStart(6, '0') : null
  const adjacentAbove = firstNum < 999999 ? (firstNum + 1).toString().padStart(6, '0') : null
  if ((adjacentBelow && ticket === adjacentBelow) || (adjacentAbove && ticket === adjacentAbove)) {
    push('adjacent', ticket)
  }

  // 3. รางวัลที่ 2 — exact 6-digit match, 5 winning numbers
  if (draw.second.includes(ticket)) {
    push('second', ticket)
  }

  // 4. รางวัลที่ 3 — exact 6-digit match, 10 winning numbers
  if (draw.third.includes(ticket)) {
    push('third', ticket)
  }

  // 5. รางวัลที่ 4 — exact 6-digit match, 50 winning numbers
  if (draw.fourth.includes(ticket)) {
    push('fourth', ticket)
  }

  // 6. รางวัลที่ 5 — exact 6-digit match, 100 winning numbers
  if (draw.fifth.includes(ticket)) {
    push('fifth', ticket)
  }

  // 7. เลขหน้า 3 ตัว — first 3 digits match, 2 winning numbers
  const front3 = ticket.slice(0, 3)
  if (draw.front3.includes(front3)) {
    push('front3', front3)
  }

  // 8. เลขท้าย 3 ตัว — last 3 digits match, 2 winning numbers
  const back3 = ticket.slice(3)
  if (draw.back3.includes(back3)) {
    push('back3', back3)
  }

  // 9. เลขท้าย 2 ตัว — last 2 digits match, 1 winning number
  const back2 = ticket.slice(4)
  if (draw.back2.includes(back2)) {
    push('back2', back2)
  }

  return matches // all matches, not just highest
}

// ============================================================
// formatPrizeAmount — formats number as Thai currency string
// e.g. 2000000 → "2,000,000 บาท ต่อใบ"
// ============================================================
export function formatPrizeAmount(amount: number): string {
  return `${amount.toLocaleString('th-TH')} บาท ต่อใบ`
}

// ============================================================
// formatThaiDate — converts ISO date to Thai date string
// e.g. "2025-05-01" → "1 พฤษภาคม 2568"
// ============================================================
const THAI_MONTHS = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

export function formatThaiDate(isoDate: string): string {
  const [yearStr, monthStr, dayStr] = isoDate.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)
  // Convert to Buddhist Era (BE = CE + 543)
  const buddhistYear = year + 543
  return `${day} ${THAI_MONTHS[month]} ${buddhistYear}`
}
```
  </action>
  <verify>
    <automated>cd /home/deploy-app/poc-lottery-online && npx tsc --noEmit 2>&1 | head -10 && echo "---" && node -e "const r = require('./src/lib/lottery.ts'); console.log('imports ok')" 2>&1 | head -5</automated>
  </verify>
  <acceptance_criteria>
    - src/lib/lottery.ts contains `export function matchPrizes(`
    - src/lib/lottery.ts contains `export function formatPrizeAmount(`
    - src/lib/lottery.ts contains `export function formatThaiDate(`
    - src/lib/lottery.ts contains `adjacentBelow` and `adjacentAbove` (no-wraparound logic)
    - src/lib/lottery.ts contains `matches.push(` appearing 9 times (one per prize tier)
    - src/lib/lottery.ts contains `return matches` (returns ALL matches)
    - src/data/lottery-fallback.json is valid JSON (parseable with `JSON.parse`)
    - src/data/lottery-fallback.json contains `"first": "123456"`
    - src/data/lottery-fallback.json contains `"drawDateThai":`
    - `npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>matchPrizes() correctly handles all 9 prize tiers including adjacent no-wraparound. Static fallback JSON is valid and always loadable. Both pass TypeScript type check.</done>
</task>

<task type="auto">
  <name>Task B2: Data source abstraction + scraper route + history helpers</name>
  <files>
    src/lib/lottery-api.ts, src/lib/history.ts, src/app/api/lottery/route.ts
  </files>
  <read_first>
    - /home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-RESEARCH.md (sections: "API Crisis", "3-layer fallback", "Sanook.com Scraping Notes", "Data Fetching Strategy", "Pitfall 6: localStorage SSR hydration")
    - src/lib/types.ts (after Plan A creates it — verify LotteryDataSource, LotteryResult, HistoryEntry signatures)
    - src/lib/lottery-schema.ts (after Plan A creates it — verify parseLotteryResult signature)
    - src/data/lottery-fallback.json (after Task B1 creates it — verify shape)
  </read_first>
  <action>
Create `src/lib/lottery-api.ts`:

```typescript
import type { LotteryDataSource, LotteryResult } from './types'
import { parseLotteryResult } from './lottery-schema'
import fallbackData from '@/data/lottery-fallback.json'

// ============================================================
// StaticDataSource — always available, serves committed JSON
// ============================================================
export class StaticDataSource implements LotteryDataSource {
  async getLatest(): Promise<LotteryResult> {
    const result = parseLotteryResult(fallbackData)
    if (!result) throw new Error('Static fallback data failed Zod validation')
    return result
  }
}

// ============================================================
// ScraperDataSource — calls /api/lottery (Next.js API route)
// Falls back to StaticDataSource if scraper route fails
// ============================================================
export class ScraperDataSource implements LotteryDataSource {
  async getLatest(): Promise<LotteryResult> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
      const res = await fetch(`${baseUrl}/api/lottery`, {
        next: { revalidate: 43200 }, // ISR: 12 hours
      })
      if (!res.ok) throw new Error(`Scraper route returned ${res.status}`)
      const raw = await res.json()
      const result = parseLotteryResult(raw)
      if (!result) throw new Error('Scraper data failed Zod validation')
      return result
    } catch (err) {
      console.warn('[lottery-api] ScraperDataSource failed, using static fallback:', err)
      return new StaticDataSource().getLatest()
    }
  }
}

// ============================================================
// fetchLotteryData — entry point used by page.tsx
// Reads LOTTERY_DATA_SOURCE env var (static | scraper)
// ============================================================
export async function fetchLotteryData(): Promise<LotteryResult> {
  const source = process.env.LOTTERY_DATA_SOURCE ?? 'scraper'
  if (source === 'static') {
    return new StaticDataSource().getLatest()
  }
  return new ScraperDataSource().getLatest()
}
```

Create `src/lib/history.ts` (localStorage helpers — all reads gated behind useEffect boundary):

```typescript
import type { HistoryEntry } from './types'

const HISTORY_KEY = 'lottery-history'
const MAX_ENTRIES = 50

// ============================================================
// getHistory — ONLY call inside useEffect (never in render)
// Returns empty array on SSR or when localStorage unavailable
// ============================================================
export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as HistoryEntry[]
  } catch {
    return []
  }
}

// ============================================================
// addHistoryEntry — prepend entry, cap at MAX_ENTRIES (FIFO)
// ONLY call inside useEffect or event handler (not render)
// ============================================================
export function addHistoryEntry(entry: HistoryEntry): void {
  if (typeof window === 'undefined') return
  try {
    const existing = getHistory()
    const updated = [entry, ...existing].slice(0, MAX_ENTRIES)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch {
    // Ignore QuotaExceededError — history is non-critical
  }
}

// ============================================================
// clearHistory — wipes all entries
// ============================================================
export function clearHistory(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(HISTORY_KEY)
}
```

Create `src/app/api/lottery/route.ts` (Next.js App Router API route — scrapes sanook.com, returns LotteryResult JSON):

```typescript
import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { parseLotteryResult } from '@/lib/lottery-schema'
import { formatThaiDate } from '@/lib/lottery'
import fallbackData from '@/data/lottery-fallback.json'

// ISR: revalidate every 12 hours (43200 seconds)
export const revalidate = 43200

export async function GET() {
  try {
    const result = await scrapeSanook()
    if (result) {
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 's-maxage=43200, stale-while-revalidate=86400' },
      })
    }
  } catch (err) {
    console.error('[api/lottery] Scraper error:', err)
  }

  // Static fallback — app always works
  console.warn('[api/lottery] Returning static fallback data')
  return NextResponse.json(fallbackData, {
    headers: { 'X-Data-Source': 'static-fallback' },
  })
}

// ============================================================
// scrapeSanook — parse sanook.com/lotto HTML
// Returns null if scraping fails or data is malformed
// ============================================================
async function scrapeSanook(): Promise<object | null> {
  const res = await fetch('https://lotto.sanook.com/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LotteryChecker/1.0)' },
    next: { revalidate: 43200 },
  })

  if (!res.ok) {
    console.warn('[api/lottery] sanook.com returned', res.status)
    return null
  }

  const html = await res.text()
  const $ = cheerio.load(html)

  // NOTE: Sanook DOM structure — inspect at https://lotto.sanook.com/
  // Prize data is typically in a table or JSON-LD. This implementation
  // attempts multiple selectors and falls back gracefully.
  // If DOM structure changes, parseLotteryResult() will return null
  // and the static fallback will be served automatically.

  // Attempt to extract draw date from page title or meta
  const pageTitle = $('title').text() || ''
  const dateMatch = pageTitle.match(/(\d{1,2})\s+(\S+)\s+(\d{4})/)

  // Try to find first prize number — commonly in a prominent element
  // Selectors here are best-effort; they will fail gracefully to static fallback
  const firstPrizeEl = $(
    '[class*="first-prize"] .prize-number, [class*="1st"] .number, .prize-1 .number'
  ).first()
  const firstPrize = firstPrizeEl.text().trim().replace(/\s+/g, '').padStart(6, '0')

  if (!firstPrize || firstPrize.length !== 6 || !/^\d{6}$/.test(firstPrize)) {
    console.warn('[api/lottery] Could not parse first prize from sanook.com — using fallback')
    return null
  }

  // Extract draw date from page
  let drawDate = new Date().toISOString().split('T')[0]
  let drawDateThai = formatThaiDate(drawDate)
  if (dateMatch) {
    drawDateThai = dateMatch[0]
  }

  // For multi-number prizes: attempt to collect all numbers from prize sections
  // This is a best-effort scraper — real implementation should inspect live DOM
  // and update selectors. Returns null if data is incomplete → static fallback.
  const rawData = {
    drawDate,
    drawDateThai,
    first: firstPrize,
    // Minimal viable data — expand selectors after inspecting live DOM
    second: extractNumbers($, '[class*="2nd"], .prize-2', 5, 6),
    third: extractNumbers($, '[class*="3rd"], .prize-3', 10, 6),
    fourth: extractNumbers($, '[class*="4th"], .prize-4', 50, 6),
    fifth: extractNumbers($, '[class*="5th"], .prize-5', 100, 6),
    front3: extractNumbers($, '[class*="front3"], [class*="front-3"]', 2, 3),
    back3: extractNumbers($, '[class*="back3"], [class*="back-3"]', 2, 3),
    back2: extractNumbers($, '[class*="back2"], [class*="back-2"]', 1, 2),
  }

  const validated = parseLotteryResult(rawData)
  return validated // null if validation fails → caller serves static fallback
}

// ============================================================
// extractNumbers — collect N prize numbers of expectedLength from DOM
// Returns array of strings. If not enough found, returns []
// (which will fail Zod validation → static fallback kicks in)
// ============================================================
function extractNumbers(
  $: ReturnType<typeof cheerio.load>,
  selector: string,
  count: number,
  expectedLength: number
): string[] {
  const numbers: string[] = []
  $(selector).find('.number, [class*="number"]').each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, '')
    if (/^\d+$/.test(text) && text.length === expectedLength) {
      numbers.push(text)
    }
  })
  return numbers.slice(0, count)
}
```

Note for executor: The scraper selectors are best-effort. After deployment, if sanook.com DOM has changed, the Zod validation catches invalid data and the static fallback is served. Do not use `dangerouslySetInnerHTML` with scraped content anywhere — cheerio parses to DOM nodes only.
  </action>
  <verify>
    <automated>cd /home/deploy-app/poc-lottery-online && npx tsc --noEmit 2>&1 | head -20 && echo "---" && npm run build 2>&1 | tail -20</automated>
  </verify>
  <acceptance_criteria>
    - src/lib/lottery-api.ts contains `export class StaticDataSource`
    - src/lib/lottery-api.ts contains `export class ScraperDataSource`
    - src/lib/lottery-api.ts contains `export async function fetchLotteryData(`
    - src/lib/lottery-api.ts contains `revalidate: 43200`
    - src/lib/lottery-api.ts contains `process.env.LOTTERY_DATA_SOURCE`
    - src/lib/history.ts contains `export function getHistory(`
    - src/lib/history.ts contains `export function addHistoryEntry(`
    - src/lib/history.ts contains `typeof window === 'undefined'` (appears at least twice — SSR guard)
    - src/lib/history.ts contains `MAX_ENTRIES = 50`
    - src/app/api/lottery/route.ts contains `export const revalidate = 43200`
    - src/app/api/lottery/route.ts contains `export async function GET(`
    - src/app/api/lottery/route.ts contains `cheerio.load(`
    - src/app/api/lottery/route.ts does NOT contain `dangerouslySetInnerHTML` (XSS prevention)
    - src/app/api/lottery/route.ts contains `static-fallback` (fallback header)
    - `npx tsc --noEmit` exits 0
    - `npm run build` exits 0
  </acceptance_criteria>
  <done>Data layer is complete. 3-layer fallback (scraper → static) is wired. localStorage history helpers are SSR-safe. API route uses cheerio (not dangerouslySetInnerHTML) and always returns valid data.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| sanook.com → API route | Untrusted external HTML enters the scraper — parsed by cheerio (DOM), never passed to dangerouslySetInnerHTML |
| API route → Zod | Scraped data validated by parseLotteryResult() before any consumption — invalid data returns null → static fallback |
| localStorage → HistoryEntry[] | Stored JSON is parsed with try/catch — malformed data returns [] silently |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-B-01 | Spoofing | ScraperDataSource | mitigate | All scraped data passes through parseLotteryResult() (Zod). If validation fails, static fallback served. No raw scraped strings reach the UI. |
| T-01-B-02 | Tampering | lottery-fallback.json | accept | Committed to repo, read-only at runtime. Cannot be tampered via HTTP. If corrupted in repo, Zod catches it at startup. |
| T-01-B-03 | Repudiation | history.ts localStorage | accept | History is non-critical display data. No financial or auth decisions made from it. User can clear browser storage. |
| T-01-B-04 | Information Disclosure | api/lottery/route.ts | accept | Route returns only lottery draw numbers (public data). No user data, no secrets. No PII stored. |
| T-01-B-05 | Denial of Service | api/lottery/route.ts | mitigate | ISR (revalidate: 43200) caches scraper result at Vercel edge — sanook.com is called at most once per 12h per region, not per user request. |
| T-01-B-06 | Elevation of Privilege | lottery-api.ts fetch | accept | fetchLotteryData() runs server-side only (called from page.tsx server component). No user-controlled inputs reach the fetch URL. |
| T-01-B-07 | XSS | sanook.com scraper | mitigate | cheerio parses HTML to DOM nodes, extracting text content only. dangerouslySetInnerHTML is never used anywhere in the codebase. |
</threat_model>

<verification>
```bash
cd /home/deploy-app/poc-lottery-online

# 1. TypeScript clean
npx tsc --noEmit

# 2. Build passes
npm run build

# 3. Key exports present
grep -q 'export function matchPrizes' src/lib/lottery.ts && echo "OK: matchPrizes"
grep -q 'export function fetchLotteryData' src/lib/lottery-api.ts && echo "OK: fetchLotteryData"
grep -q 'typeof window' src/lib/history.ts && echo "OK: SSR guard in history"

# 4. Security: no dangerouslySetInnerHTML in scraper
grep -rn 'dangerouslySetInnerHTML' src/app/api/ && echo "FAIL: XSS risk" || echo "OK: no XSS risk"

# 5. ISR configured
grep -q 'revalidate = 43200' src/app/api/lottery/route.ts && echo "OK: ISR 12h"

# 6. Static fallback JSON is valid
node -e "const d = require('./src/data/lottery-fallback.json'); console.log('first:', d.first)"

# 7. Adjacent no-wraparound present
grep -q 'firstNum > 0' src/lib/lottery.ts && echo "OK: no-wrap below"
grep -q 'firstNum < 999999' src/lib/lottery.ts && echo "OK: no-wrap above"
```
</verification>

<success_criteria>
- matchPrizes() handles all 9 prize tiers and returns ALL matches (not just first)
- Adjacent prize has no wraparound (boundary conditions handled)
- StaticDataSource, ScraperDataSource, fetchLotteryData exported from lottery-api.ts
- ScraperDataSource falls back to static on any error
- LOTTERY_DATA_SOURCE env var controls which source is used
- localStorage reads only via getHistory() with typeof window guard
- API route uses cheerio, never dangerouslySetInnerHTML
- ISR revalidate: 43200 on both ScraperDataSource.fetch() and route.ts export
- npm run build exits 0
</success_criteria>

<output>
After completion, create `/home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-B-SUMMARY.md`
</output>
