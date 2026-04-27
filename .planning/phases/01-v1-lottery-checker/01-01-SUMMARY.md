---
plan: 01-01
status: complete
completed: 2026-04-25
---

# Summary: Token Replacement (globals.css)

Replaced `@theme` block in `src/app/globals.css` with Thai lottery green/red palette.

## Changes
- Removed: `--color-gold`, `--color-gold-light`, `--color-gold-dark`, `--color-cream`, `--color-warm-gray`, `--shadow-gold-glow`
- Removed: `@keyframes glow-pulse`, `@keyframes prize-pop`
- Added: `--color-lottery-green: #006B3C`, `--color-lottery-green-dark`, `--color-lottery-green-light`, `--color-lottery-red: #C8102E`, `--color-lottery-red-light`
- Added semantic aliases: `--color-win: #006B3C`, `--color-win-bg: #E6F4ED`, `--color-error: #C8102E`
- Body background: `linear-gradient(...)` → `#FFFFFF`
- Kept: spacing scale, font token, shake + fade-in-up keyframes, neutral shadows

## Verification
- No gold/cream/warm-gray tokens remain
- Build passes
