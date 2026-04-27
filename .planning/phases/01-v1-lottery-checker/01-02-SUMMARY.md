---
plan: 01-02
status: complete
completed: 2026-04-25
---

# Summary: Page Layout + DrawDateHeader

## page.tsx
- `max-w-2xl` → `max-w-[640px]` (D-03)
- Removed `rounded-2xl backdrop-blur-sm shadow-card-lg border` card wrappers around LotteryPageClient and PrizeTable (D-06: flat layout)
- `py-md` → `py-sm` (D-02: compact)
- ISR `revalidate: 43200` unchanged

## DrawDateHeader.tsx
- Removed h1 "ตรวจสลากกินแบ่ง" title (D-04: date only)
- Removed decorative gold gradient bar
- Compact: `text-sm` date line, `py-sm` padding
- No gold token references
