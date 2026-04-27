# Phase 2: Multi-Ticket Batch Check - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

ผู้ใช้กรอก/วางหมายเลขสลากหลายใบพร้อมกัน (textarea paste, separator-agnostic) → ระบบตรวจทีเดียว → แสดงสรุปผลรวม (จำนวน, มูลค่า, แยกตามรางวัล) + รายละเอียดแต่ละใบ (won first, gold highlight, all tickets visible). OCR ยังไม่รวม scope.

</domain>

<decisions>
## Implementation Decisions

### Input Method
- **D-01:** Textarea paste — one `<textarea>`, user pastes multiple numbers, system auto-extracts all 6-digit sequences. Separator-agnostic (newline, comma, space, tab).
- **D-02:** Tab toggle between single-check and batch-check. Keep existing CheckForm for single mode. New BatchCheckForm component for batch mode. Toggle UI (tab/pill switch) at the top of the check area.

### Results Layout
- **D-03:** Summary card at top + list below. Summary shows aggregate stats. List groups won tickets first (gold highlight + PrizeBadge), then losing tickets (muted styling).
- **D-04:** All tickets visible in result list. No "winners only" filter — full transparency.

### Summary Display
- **D-05:** Summary card shows: (1) ticket count — total/won/lost, (2) total prize amount in Thai baht, (3) per-tier breakdown (e.g. "รางวัลที่ 1 × 1, รางวัลที่ 3 × 2"), (4) big wins highlighted specially.

### Scope
- **D-06:** Camera/OCR deferred to future phase. Phase 2 is paste-based batch only. REQ-14 moved out of scope.

### Claude's Discretion
- Textarea parsing edge cases (duplicates, invalid lengths, non-numeric)
- Max batch size limit (reasonable cap for performance)
- Animation/transitions for batch results appearance
- Whether batch results persist to history (individual or as batch entry)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Code (existing implementation)
- `src/lib/lottery.ts` — matchPrizes() engine, formatPrizeAmount(), formatThaiDate()
- `src/lib/types.ts` — PrizeMatch, LotteryResult, HistoryEntry interfaces
- `src/lib/lottery-api.ts` — fetchLotteryData(), LotteryDataSource abstraction
- `src/components/CheckForm.tsx` — existing single-ticket form (keep, add tab toggle)
- `src/components/CheckResult.tsx` — existing single-ticket result display (reference for styling)
- `src/components/PrizeBadge.tsx` — reusable prize match display chip
- `src/app/page.tsx` — current page layout, card wrapper pattern
- `src/app/LotteryPageClient.tsx` — client shell managing check state
- `src/app/globals.css` — design tokens (@theme), animations (shake, fade-in-up, glow-pulse, prize-pop)

### Phase 1 Planning Artifacts
- `.planning/phases/01-v1-lottery-checker/01-UI-SPEC.md` — design contract (colors, typography, spacing, accessibility)
- `.planning/phases/01-v1-lottery-checker/01-RESEARCH.md` — technical research (domain knowledge, data sources)

### Roadmap & Project
- `.planning/ROADMAP.md` — Phase 2 requirements (REQ-11 through REQ-13)
- `.planning/PROJECT.md` — project vision, tech stack, target users

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `matchPrizes()` — core engine, already handles all prize tiers. Batch = map matchPrizes over array of ticket strings.
- `PrizeBadge` — displays individual prize match (gold gradient pill). Reuse directly in batch result items.
- `CheckForm` — existing single-ticket form with validation, shake animation. Keep as-is for single mode.
- `LotteryPageClient` — manages check state (useState for ticket/matches). Batch mode adds batchTickets/batchMatches state.
- Design tokens in globals.css — --color-gold, --color-gold-light, --color-win, --color-gold-dark, --color-cream, --color-warm-gray, shadows, animations.

### Established Patterns
- Card wrappers: `rounded-2xl bg-white/70 backdrop-blur-sm shadow-card-lg border border-white/50 p-lg`
- Glassmorphism theme throughout
- Server/Client boundary: page.tsx (server) → LotteryPageClient (client shell) → components
- Tab/pill toggle doesn't exist yet — new pattern needed
- Textarea input doesn't exist yet — new pattern needed

### Integration Points
- Tab toggle goes inside LotteryPageClient, wrapping CheckForm + new BatchCheckForm
- BatchCheckForm is a new client component (needs textarea + parsing + validation)
- BatchResultSummary is a new component (aggregate display)
- BatchResultList is a new component (per-ticket results)
- Page layout (page.tsx) may need wider max-w for batch results, or keep max-w-2xl

</code_context>

<specifics>
## Specific Ideas

- Separator-agnostic parsing: regex extract all 6-digit sequences from textarea value, deduplicate
- Tab toggle: gold-highlighted active tab pill, consistent with existing gold design system
- Summary card: same glassmorphism card as page wrapper, with big prize amount display
- Won tickets in result list: reuse gold-left-border pattern from CheckResult win state
- Big wins (รางวัลที่ 1, รางวัลข้างเคียง): extra glow or special icon

</specifics>

<deferred>
## Deferred Ideas

- **Camera/OCR** — native camera input + OCR for ticket number extraction. Significant scope, its own phase. Needs OCR library evaluation (Tesseract.js vs cloud API).
- **Batch history persistence** — save batch results to localStorage (individual entries vs batch group)
- **Export/share batch results** — share summary as image or text
- **Max batch size UI** — progress indicator for large batches

</deferred>

---

*Phase: 02-multi-ticket-batch*
*Context gathered: 2026-04-25*
