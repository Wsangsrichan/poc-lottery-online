---
plan: 01-03
status: complete
completed: 2026-04-25
---

# Summary: CheckResult + PrizeTable Restyle

## CheckResult.tsx
- Won state: `bg-lottery-green` solid green fill, `text-white`, `text-3xl`, no card/border/shadow (D-10)
- Won animation: `glow-pulse` (removed) → `fade-in-up` 
- Not-won state: `text-base font-semibold text-text-muted`, `py-sm`, no bg/border (D-11: understated)

## PrizeTable.tsx
- Header row: `bg-warm-gray` → `bg-surface-2`
- รางวัลที่ 1 row: `bg-gold-light/40` → `bg-lottery-green-light`
- รางวัลที่ 1 cells (prize name, number, amount): `text-gold-dark` → `text-lg text-lottery-green` (D-13)
- Zero gold references remain
