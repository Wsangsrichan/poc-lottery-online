---
status: testing
phase: 01-v1-lottery-checker
source: [derived from ROADMAP.md REQ-01..REQ-10 — no SUMMARY.md exists]
started: 2026-04-25T18:17:24Z
updated: 2026-04-25T18:20:00Z
---

## Current Test

number: 3
name: Prize Check — All Tiers
expected: |
  Enter a known winning number from the draw table. Submit check.
  All matching prize tiers shown in one result (e.g. if matches back-2 AND back-3, both appear).
  No tier missed.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Start `npm run dev`. App boots without errors. http://localhost:3000 loads. Draw data or loading skeleton appears. No crash.
result: pass

### 2. Ticket Input — 6-digit with leading zeros
expected: Input field accepts 6-digit numbers including leading zeros (e.g. "012345"). Type "012345" — field shows full number, not truncated. Input is mobile-friendly (type="tel" or numeric keyboard on mobile).
result: issue
reported: "กดปุ่มไม่ได้เลย พิมพ์ไม่ได้"
severity: blocker

### 3. Prize Check — All Tiers
expected: Enter a known winning number (check the draw table on screen). Submit. All matching prize tiers shown in one result — e.g. if matches back-2 AND back-3, both appear. No tier missed.
result: [pending]

### 4. Won/Not-Won Feedback in Thai
expected: After checking: clear binary result shown. If won — prize name in Thai (e.g. รางวัลที่ 1) + amount (e.g. ฿6,000,000) highlighted. If not won — clear "ไม่ถูกรางวัล" or equivalent. No English-only labels.
result: [pending]

### 5. Full Draw Result Table
expected: Page shows complete draw table — all prize tiers with their winning numbers (1st prize, 2nd, 3rd, 4th, 5th, front-3, back-3, back-2). User can see all numbers for the current period.
result: [pending]

### 6. Draw Date Displayed
expected: Current draw period (งวดที่ / วันที่) shown on page — e.g. "งวดประจำวันที่ 1 เมษายน 2568". Date is human-readable in Thai format.
result: [pending]

### 7. Auto-Load on Page Load
expected: Open http://localhost:3000 fresh (no ticket param). Latest draw data loads automatically — no manual "fetch" button needed. Loading skeleton visible briefly during fetch, then real data appears.
result: [pending]

### 8. Mobile Responsive UI
expected: Resize browser to 320px wide (or use DevTools mobile mode). Page still readable — no horizontal scroll, no overlapping text. Buttons/inputs have comfortable touch targets (≥ 44px height visually).
result: [pending]

### 9. Check History in localStorage
expected: Check 2–3 different tickets. Open DevTools → Application → localStorage. Entries stored grouped by draw date. Old history persists after page refresh. History panel shows past checks on the page.
result: [pending]

### 10. Share Result
expected: After a check, Share button appears. Click it — Web Share sheet opens on supported browser/mobile, OR clipboard fallback copies result text (shown via toast/notification). Shared text includes ticket number and result.
result: [pending]

### 11. URL Auto-Check (?ticket= param)
expected: Navigate to http://localhost:3000?ticket=123456. Page loads with "123456" pre-filled in input AND check runs automatically — result shown without user pressing the check button.
result: [pending]

## Summary

total: 11
passed: 0
issues: 0
pending: 11
skipped: 0
blocked: 0

## Gaps

[none yet]
