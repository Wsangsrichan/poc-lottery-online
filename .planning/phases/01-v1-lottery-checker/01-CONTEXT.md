# Phase 1: v1 Lottery Checker - Context

**Gathered:** 2026-04-25
**Status:** Ready for replanning

<domain>
## Phase Boundary

Build and deploy Thai government lottery checker. User enters 6-digit ticket → system fetches latest draw → checks all prize tiers → shows result with prize details. History stored in localStorage. Shareable via Web Share API. Deployed to Vercel.

**Note:** Existing code was built without user context. This context drives a replan to correct UI/UX decisions.

</domain>

<decisions>
## Implementation Decisions

### Page Layout & Proportions
- **D-01:** Single column centered — form → result → draw table, top-to-bottom flow. No side-by-side layout.
- **D-02:** Compact spacing — dense info, minimize scroll. Show as much above fold as possible.
- **D-03:** Max width 640px — balanced for mobile + desktop.
- **D-04:** Header = draw date only. No title text like "ตรวจสลากกินแบ่ง". Just: "งวดประจำวันที่ X" compact, not prominent.

### Visual Style & Colors
- **D-05:** Thai lottery feel — green/red/gold color palette. NOT modern minimal white. Characters that feel like a real lottery app.
- **D-06:** Flat layout — no card boxes with shadow/border around sections. Content-first, no visual chrome around containers.
- **D-07:** Accent colors: สีแดง (red) + สีเขียว (green) as primary accents. Green = brand/action, Red = highlight won/important.
- **D-08:** Font: Sarabun (keep as-is). Thai UI labels throughout.
- **D-09:** All UI text in Thai — buttons, labels, error messages, placeholders.

### Result Display
- **D-10:** Won → large green background section, large text. Prize name (e.g. "รางวัลที่ 1") + amount (e.g. "฿6,000,000") prominent and large.
- **D-11:** Not won → small, muted gray text. "ไม่ถูกรางวัล" not prominent — doesn't feel punishing.

### Draw Table Format
- **D-12:** Full table — columns: ชื่อรางวัล | หมายเลข | เงินรางวัล (บาท). All prize tiers shown. No collapse/accordion.
- **D-13:** รางวัลที่ 1 row highlighted: green text + larger font. Stands out visually from other tiers.

### Claude's Discretion
- Input field styling details (height, border radius, focus states)
- Animation on won result (subtle — not over the top)
- Share button placement and styling
- History panel collapse behavior
- Exact shade of green/red (Thai lottery palette reference welcome)
- Loading skeleton design

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` — Phase 1 requirements REQ-01..REQ-10
- `.planning/PROJECT.md` — Core value, target users, tech stack

### Existing Implementation (to understand what needs to change)
- `src/app/globals.css` — Current color tokens (@theme) — will need full replacement
- `src/app/page.tsx` — Page structure — needs layout adjustment
- `src/components/CheckResult.tsx` — Won/not-won display — needs green bg treatment
- `src/components/PrizeTable.tsx` — Draw table — needs รางวัลที่ 1 highlight
- `src/components/DrawDateHeader.tsx` — Header — needs to be compact date-only

### Phase 2 Context (pattern consistency)
- `.planning/phases/02-multi-ticket-batch/02-CONTEXT.md` — D-01/D-02: tab toggle, gold-highlight decisions that overlap with this phase's color decisions

No external specs — decisions fully captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CheckForm.tsx` — Input logic (type="tel", 6-digit filter, shake animation) — keep logic, restyle
- `matchPrizes()` in `src/lib/lottery.ts` — Prize matching engine — no changes needed
- `history.ts` in `src/lib/` — localStorage helpers — no changes needed
- `lottery-api.ts` — Data layer with static/scraper sources — no changes needed
- All 8 components exist: CheckForm, CheckResult, PrizeBadge, PrizeTable, DrawDateHeader, HistoryPanel, HistoryItem, ShareButton

### Established Patterns
- Tailwind CSS 4 with `@theme` block in globals.css — custom CSS variables for colors/spacing
- `'use client'` on interactive components (CheckForm, CheckResult, HistoryPanel, ShareButton)
- Server component page.tsx with ISR (revalidate: 43200) — keep pattern
- Sarabun font via next/font/google — keep

### Integration Points
- `page.tsx` → `LotteryPageClient.tsx` → `CheckForm + CheckResult + HistoryPanel`
- `page.tsx` → `DrawDateHeader + PrizeTable` (server-rendered directly)
- Color tokens in `globals.css` @theme block need full replacement to green/red palette

### Known Issues Found in UAT
- Cross-origin dev access blocked — fixed via `allowedDevOrigins: ['49.13.51.154']` in next.config.ts
- UI proportions not satisfactory — this context drives the replan

</code_context>

<specifics>
## Specific Ideas

- "Thai lottery feel" — think สำนักงานสลากกินแบ่งรัฐบาล color identity: เขียว (#006B3C or similar), แดง, ทอง
- รางวัลที่ 1 in draw table should visually pop — user specifically wants it prominent
- "ไม่ถูกรางวัล" state should be understated — don't make users feel bad
- Dense/compact = more like a real utility app, less like a marketing landing page

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-v1-lottery-checker*
*Context gathered: 2026-04-25*
