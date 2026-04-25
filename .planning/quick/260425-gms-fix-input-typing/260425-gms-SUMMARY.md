---
status: complete
quick_id: 260425-gms
slug: fix-input-typing
completed: 2026-04-25
commit: 2b9d0f8
---

# Summary: Fix Input Typing (260425-gms)

## Root Cause
CheckForm.tsx referenced removed CSS tokens (`focus:border-gold`, `from-gold-dark via-gold to-gold-light`, `shadow-gold-glow`). In Tailwind CSS 4, unknown tokens produce **zero CSS output** — no error, just silence. Result: button had no visible background, input had no focus ring → UI appeared frozen.

## Fix
Replaced all gold token references in `src/components/CheckForm.tsx`:

| Old | New |
|-----|-----|
| `focus:border-gold` | `focus:border-lottery-green` |
| `focus-visible:ring-gold/30` | `focus-visible:ring-lottery-green/30` |
| `focus-visible:ring-gold/50` | `focus-visible:ring-lottery-green/50` |
| `bg-gradient-to-r from-gold-dark via-gold to-gold-light shadow-gold-glow` | `bg-lottery-green shadow-card-lg` |

Dev server restarted to pick up clean CSS bundle.
