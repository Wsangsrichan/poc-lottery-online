---
phase: 01-v1-lottery-checker
plan: A
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - tsconfig.json
  - next.config.ts
  - src/app/globals.css
  - src/app/layout.tsx
  - src/lib/types.ts
  - src/lib/lottery-schema.ts
autonomous: true
requirements:
  - REQ-01
  - REQ-07
  - REQ-10

must_haves:
  truths:
    - "Next.js 15 App Router project compiles with zero TypeScript errors"
    - "Tailwind CSS 4.x CSS-first config is active — @import 'tailwindcss' in globals.css, no tailwind.config.js"
    - "Sarabun font loads via next/font/google (self-hosted by Vercel CDN)"
    - "All custom color tokens (--color-gold, --color-win, etc.) are defined in @theme block in globals.css"
    - "Core TypeScript interfaces (LotteryResult, PrizeMatch, HistoryEntry) are exported from src/lib/types.ts"
    - "Zod schemas validate lottery draw data from any source (scraper or static)"
  artifacts:
    - path: "src/app/globals.css"
      provides: "Tailwind 4.x import + @theme block with all color/spacing tokens"
      contains: "@import \"tailwindcss\""
    - path: "src/lib/types.ts"
      provides: "All TypeScript interfaces used across the app"
      exports:
        - LotteryResult
        - PrizeMatch
        - PrizeTier
        - HistoryEntry
        - LotteryDataSource
    - path: "src/lib/lottery-schema.ts"
      provides: "Zod schemas for runtime validation"
      exports:
        - LotteryResultSchema
        - lotteryResultSchema
  key_links:
    - from: "src/lib/lottery-schema.ts"
      to: "src/lib/types.ts"
      via: "z.infer<typeof lotteryResultSchema> = LotteryResult"
      pattern: "z\\.infer"
    - from: "src/app/layout.tsx"
      to: "next/font/google"
      via: "Sarabun import + className on <html>"
      pattern: "Sarabun"
---

<objective>
Scaffold the Next.js 15 project, configure Tailwind CSS 4.x CSS-first, set up Sarabun font, define all TypeScript types, and create Zod validation schemas.

Purpose: Establish the type-safe foundation that ALL other plans depend on. Plan B (data layer), Plan C (components), and Plan D (assembly) all import from src/lib/types.ts and src/lib/lottery-schema.ts — these must exist first.

Output:
- Working Next.js 15 + React 19 project (compilable, `npm run build` passes)
- globals.css with Tailwind 4.x CSS-first config and full @theme token block
- layout.tsx with Sarabun font + HTML lang="th"
- src/lib/types.ts with all interfaces
- src/lib/lottery-schema.ts with Zod schemas
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
</context>

<tasks>

<task type="auto">
  <name>Task A1: Scaffold Next.js 15 project + Tailwind 4.x CSS-first config</name>
  <files>
    package.json, tsconfig.json, next.config.ts, src/app/globals.css, src/app/layout.tsx
  </files>
  <read_first>
    - /home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-RESEARCH.md (stack table, pitfalls section, Tailwind 4.x CSS-first requirement)
    - /home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-UI-SPEC.md (design system section, Tailwind CSS Tokens section at bottom)
  </read_first>
  <action>
Run `npx create-next-app@latest . --typescript --app --no-tailwind --no-src-dir --no-eslint --no-import-alias` to scaffold the base project in /home/deploy-app/poc-lottery-online/. Then manually wire Tailwind CSS 4.x (CSS-first, NOT v3):

1. Install dependencies:
```bash
npm install tailwindcss@4 @tailwindcss/postcss@4
npm install next/font  # already in next.js, but ensure version
npm install cheerio zod
```

2. Create `postcss.config.mjs` (Tailwind 4 uses @tailwindcss/postcss):
```js
const config = { plugins: { '@tailwindcss/postcss': {} } }
export default config
```

3. CRITICAL: Do NOT create tailwind.config.js — Tailwind 4.x is CSS-first.

4. Replace `src/app/globals.css` with the EXACT content below (this is the design system foundation):
```css
@import "tailwindcss";

@theme {
  --font-sans: "Sarabun", sans-serif;

  /* Spacing scale (from UI-SPEC.md) */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;

  /* Brand colors */
  --color-gold: #D4A017;
  --color-gold-light: #F5E6B3;

  /* Semantic aliases */
  --color-win: #16A34A;
  --color-error: #DC2626;
  --color-surface: #FFFFFF;
  --color-surface-2: #F5F5F5;
  --color-border: #E5E7EB;
  --color-text: #111827;
  --color-text-muted: #6B7280;
}

* {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
}
```

5. Replace `src/app/layout.tsx` with:
```tsx
import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'
import './globals.css'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-sarabun',
})

export const metadata: Metadata = {
  title: 'ตรวจหวย — สลากกินแบ่งรัฐบาล',
  description: 'ตรวจผลสลากกินแบ่งรัฐบาล ป้อนหมายเลขสลาก 6 หลัก ทราบผลทันที',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body className="font-sans bg-surface text-text antialiased">
        {children}
      </body>
    </html>
  )
}
```

6. Create a minimal `src/app/page.tsx` placeholder so the build works (will be replaced in Plan D):
```tsx
export default function Page() {
  return <main className="p-4"><p className="text-text-muted">Loading...</p></main>
}
```

7. Verify `next.config.ts` has no Tailwind references (it should not — Tailwind 4 only needs postcss.config.mjs).
  </action>
  <verify>
    <automated>cd /home/deploy-app/poc-lottery-online && npm run build 2>&1 | tail -20</automated>
  </verify>
  <acceptance_criteria>
    - src/app/globals.css contains `@import "tailwindcss"` on line 1
    - src/app/globals.css contains `--color-gold: #D4A017` inside @theme block
    - src/app/globals.css contains `--color-win: #16A34A`
    - src/app/globals.css contains `--font-sans: "Sarabun", sans-serif`
    - src/app/layout.tsx contains `lang="th"`
    - src/app/layout.tsx contains `Sarabun` import from `next/font/google`
    - NO file named `tailwind.config.js` or `tailwind.config.ts` exists in the project root
    - `postcss.config.mjs` exists and contains `@tailwindcss/postcss`
    - `npm run build` exits 0 (zero TypeScript errors, zero build errors)
  </acceptance_criteria>
  <done>Project scaffolds cleanly. `npm run build` passes. Tailwind 4.x CSS-first is configured with all design tokens. Sarabun font is wired into layout.</done>
</task>

<task type="auto">
  <name>Task A2: TypeScript interfaces + Zod schemas</name>
  <files>
    src/lib/types.ts, src/lib/lottery-schema.ts
  </files>
  <read_first>
    - /home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-RESEARCH.md (Domain Knowledge section — prize tiers table, checking algorithm, LotteryDataSource interface)
    - /home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-UI-SPEC.md (Copywriting Contract — prize tier IDs and Thai display names)
  </read_first>
  <action>
Create `src/lib/types.ts` with the EXACT content below:

```typescript
// ============================================================
// Prize tier IDs — matches RESEARCH.md domain knowledge table
// ============================================================
export type PrizeTierId =
  | 'first'
  | 'adjacent'
  | 'second'
  | 'third'
  | 'fourth'
  | 'fifth'
  | 'front3'
  | 'back3'
  | 'back2'

// Thai display names (hardcoded per UI-SPEC.md — do NOT use API strings)
export const PRIZE_NAMES: Record<PrizeTierId, string> = {
  first: 'รางวัลที่ 1',
  adjacent: 'รางวัลข้างเคียงรางวัลที่ 1',
  second: 'รางวัลที่ 2',
  third: 'รางวัลที่ 3',
  fourth: 'รางวัลที่ 4',
  fifth: 'รางวัลที่ 5',
  front3: 'เลขหน้า 3 ตัว',
  back3: 'เลขท้าย 3 ตัว',
  back2: 'เลขท้าย 2 ตัว',
}

// Prize amounts per ticket (THB) — hardcoded per RESEARCH.md (API amounts unreliable)
export const PRIZE_AMOUNTS: Record<PrizeTierId, number> = {
  first: 2_000_000,
  adjacent: 100_000,
  second: 200_000,
  third: 80_000,
  fourth: 40_000,
  fifth: 20_000,
  front3: 4_000,
  back3: 4_000,
  back2: 2_000,
}

// ============================================================
// Lottery draw result (validated draw data from any source)
// ============================================================
export interface LotteryResult {
  /** Draw date as ISO string, e.g. "2025-05-01" */
  drawDate: string
  /** "1 พฤษภาคม 2568" — pre-formatted Thai date string */
  drawDateThai: string
  /** รางวัลที่ 1 — single 6-digit number */
  first: string
  /** รางวัลที่ 2 — 5 numbers */
  second: string[]
  /** รางวัลที่ 3 — 10 numbers */
  third: string[]
  /** รางวัลที่ 4 — 50 numbers */
  fourth: string[]
  /** รางวัลที่ 5 — 100 numbers */
  fifth: string[]
  /** เลขหน้า 3 ตัว — 2 numbers (first 3 digits) */
  front3: string[]
  /** เลขท้าย 3 ตัว — 2 numbers (last 3 digits) */
  back3: string[]
  /** เลขท้าย 2 ตัว — 1 number (last 2 digits) */
  back2: string[]
}

// ============================================================
// Prize match result (from matchPrizes())
// ============================================================
export interface PrizeMatch {
  id: PrizeTierId
  name: string      // Thai display name from PRIZE_NAMES
  amount: number    // Amount from PRIZE_AMOUNTS (per ticket, THB)
  matchedDigits: string  // Which part of ticket matched, for highlighting
}

// ============================================================
// Data source abstraction (RESEARCH.md critical finding)
// ============================================================
export interface LotteryDataSource {
  getLatest(): Promise<LotteryResult>
}

// ============================================================
// localStorage history
// ============================================================
export interface HistoryEntry {
  ticket: string        // 6-digit string
  drawDate: string      // ISO date string (which draw this was checked against)
  drawDateThai: string  // Thai formatted date
  matches: PrizeMatch[] // Empty array = did not win
  checkedAt: string     // ISO timestamp of when user ran the check
}
```

Create `src/lib/lottery-schema.ts` with the EXACT content below:

```typescript
import { z } from 'zod'
import type { LotteryResult } from './types'

// 6-digit string validator
const sixDigits = z.string().regex(/^\d{6}$/, 'must be 6 digits')
const threeDigits = z.string().regex(/^\d{3}$/, 'must be 3 digits')
const twoDigits = z.string().regex(/^\d{2}$/, 'must be 2 digits')

export const lotteryResultSchema = z.object({
  drawDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD'),
  drawDateThai: z.string().min(1),
  first: sixDigits,
  second: z.array(sixDigits).length(5),
  third: z.array(sixDigits).length(10),
  fourth: z.array(sixDigits).length(50),
  fifth: z.array(sixDigits).length(100),
  front3: z.array(threeDigits).length(2),
  back3: z.array(threeDigits).length(2),
  back2: z.array(twoDigits).length(1),
})

// Derive TypeScript type from schema — must match LotteryResult interface
export type LotteryResultSchema = z.infer<typeof lotteryResultSchema>

// Compile-time check: schema type must satisfy LotteryResult
// (TypeScript will error here if they diverge)
const _typeCheck: LotteryResultSchema extends LotteryResult ? true : never = true
void _typeCheck

// Lenient parser — for scraped data that may have wrong array lengths (returns null on failure)
export function parseLotteryResult(raw: unknown): LotteryResult | null {
  const result = lotteryResultSchema.safeParse(raw)
  if (!result.success) {
    console.error('[lottery-schema] validation failed:', result.error.flatten())
    return null
  }
  return result.data
}
```
  </action>
  <verify>
    <automated>cd /home/deploy-app/poc-lottery-online && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <acceptance_criteria>
    - src/lib/types.ts contains `export type PrizeTierId`
    - src/lib/types.ts contains `export const PRIZE_NAMES`
    - src/lib/types.ts contains `export const PRIZE_AMOUNTS`
    - src/lib/types.ts contains `export interface LotteryResult`
    - src/lib/types.ts contains `export interface PrizeMatch`
    - src/lib/types.ts contains `export interface LotteryDataSource`
    - src/lib/types.ts contains `export interface HistoryEntry`
    - src/lib/lottery-schema.ts contains `export const lotteryResultSchema`
    - src/lib/lottery-schema.ts contains `export function parseLotteryResult`
    - src/lib/lottery-schema.ts contains `lotteryResultSchema.safeParse`
    - `npx tsc --noEmit` exits 0 (no TypeScript errors)
  </acceptance_criteria>
  <done>All interfaces and Zod schemas are defined, type-safe, and mutually consistent. Plan B and Plan C can now import from these files without errors.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Scraper → LotteryResult | Untrusted HTML from sanook.com enters the data layer — must be sanitized via cheerio and validated by Zod schema before use |
| URL params → CheckForm | Untrusted ticket number from URL query string enters client-side code — must be validated to /^\d{6}$/ before auto-run |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-A-01 | Spoofing | Zod schema (lottery-schema.ts) | mitigate | Strict regex validators on all fields: 6-digit, 3-digit, 2-digit strings. Invalid data returns null, never reaches UI. |
| T-01-A-02 | Tampering | LotteryResult (types.ts) | mitigate | PRIZE_AMOUNTS and PRIZE_NAMES are hardcoded constants — cannot be overridden by API/scraper data. |
| T-01-A-03 | Information Disclosure | layout.tsx | accept | No secrets in layout. Font loads from next/font (self-hosted on Vercel CDN) — no third-party JS injection risk. |
| T-01-A-04 | Elevation of Privilege | next.config.ts | accept | POC with no auth, no privileged operations. Config has no elevated surface. |
</threat_model>

<verification>
```bash
cd /home/deploy-app/poc-lottery-online

# 1. TypeScript clean
npx tsc --noEmit

# 2. Build passes
npm run build

# 3. CSS-first Tailwind confirmed (no tailwind.config.js)
test ! -f tailwind.config.js && test ! -f tailwind.config.ts && echo "OK: no v3 config"

# 4. Color tokens present
grep -q -- '--color-gold: #D4A017' src/app/globals.css && echo "OK: gold token"
grep -q -- '--color-win: #16A34A' src/app/globals.css && echo "OK: win token"

# 5. Types complete
grep -q 'LotteryDataSource' src/lib/types.ts && echo "OK: LotteryDataSource interface"
grep -q 'parseLotteryResult' src/lib/lottery-schema.ts && echo "OK: parser exported"

# 6. Lang attribute
grep -q 'lang="th"' src/app/layout.tsx && echo "OK: html lang=th"
```
</verification>

<success_criteria>
- `npm run build` exits 0 with zero errors
- All 7 TypeScript exports in types.ts are present (PrizeTierId, PRIZE_NAMES, PRIZE_AMOUNTS, LotteryResult, PrizeMatch, LotteryDataSource, HistoryEntry)
- globals.css has `@import "tailwindcss"` + complete @theme block with 15 tokens
- No tailwind.config.js or tailwind.config.ts in project root
- Sarabun font wired in layout.tsx with `lang="th"` on html element
</success_criteria>

<output>
After completion, create `/home/deploy-app/poc-lottery-online/.planning/phases/01-v1-lottery-checker/01-A-SUMMARY.md`
</output>
