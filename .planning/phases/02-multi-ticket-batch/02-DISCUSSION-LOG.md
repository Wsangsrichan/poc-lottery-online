# Phase 2: Multi-Ticket Batch Check - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 02-multi-ticket-batch
**Areas discussed:** Input method, Results layout, Summary display, Camera/OCR

---

## Input Method

| Option | Description | Selected |
|--------|-------------|----------|
| Textarea paste | One big textarea, auto-extract 6-digit sequences, separator-agnostic | ✓ |
| Multi-input grid | Multiple individual input boxes, add/remove rows | |
| Hybrid | Textarea + 'add one' button | |

**User's choice:** Textarea paste
**Notes:** Separator-agnostic — newline, comma, space, tab all work.

### Single/Batch Coexistence

| Option | Description | Selected |
|--------|-------------|----------|
| Tab toggle: single/batch | Keep CheckForm, add toggle to switch modes | ✓ |
| Batch only (replace single) | Remove single-check, batch-only | |
| Auto-detect mode | Single input detects batch if >6 digits | |

**User's choice:** Tab toggle

---

## Results Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Summary + grouped list | Summary card at top + won-first grouped list | ✓ |
| Flat list | All tickets in flat list, no summary | |
| Grouped by prize tier | Tickets grouped by which prize they won | |

**User's choice:** Summary + grouped list

### Losing Tickets Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| All tickets visible | Won tickets gold-highlighted, losers muted | ✓ |
| Winners only + count | Only show winning tickets + non-winning count | |

**User's choice:** All tickets visible

---

## Summary Display

| Option | Description | Selected |
|--------|-------------|----------|
| Ticket count (total/won/lost) | Aggregate numbers | ✓ |
| Total prize amount | Sum of all prize values | ✓ |
| Per-tier breakdown | e.g. "รางวัลที่ 1 × 1, รางวัลที่ 3 × 2" | ✓ |
| Highlight big wins | Special treatment for large prizes | ✓ |

**User's choice:** All 4 options selected

---

## Camera/OCR

| Option | Description | Selected |
|--------|-------------|----------|
| Defer OCR | Skip for Phase 2, paste-based only | ✓ |
| Include basic OCR | native camera + Tesseract.js or cloud OCR | |

**User's choice:** Defer OCR

---

## Claude's Discretion

- Textarea parsing edge cases (duplicates, invalid lengths, non-numeric)
- Max batch size limit
- Animation/transitions for batch results
- Batch history persistence approach

## Deferred Ideas

- Camera/OCR — future phase
- Batch history persistence
- Export/share batch results
- Max batch size UI indicator
