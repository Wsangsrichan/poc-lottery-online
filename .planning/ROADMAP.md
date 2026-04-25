# Roadmap — poc-lottery-online

**Created:** 2026-04-25
**Milestone:** v1 — Thai Lottery Checker POC

---

## Phase 1: v1 Lottery Checker — Full Build

**Goal:** Build and deploy a working Thai government lottery checker. Users enter a 6-digit ticket number, the app fetches the latest draw result, checks all prize tiers, and shows whether the ticket won — with prize name, amount, and matching digits highlighted. Check history stored in localStorage. Shareable via Web Share API. Deployed to Vercel.

**Depends on:** none

**Requirements:**
- REQ-01: 6-digit ticket input (mobile-friendly, leading zeros supported via type="tel")
- REQ-02: Check all prize tiers in one pass and display all matches
- REQ-03: Clear won/not-won binary feedback with prize name + amount in Thai
- REQ-04: Full draw result table (all winning numbers for the period)
- REQ-05: Draw date displayed (งวดที่)
- REQ-06: Latest draw auto-loaded on page load with loading skeleton
- REQ-07: Mobile-first responsive UI (touch targets ≥ 44px, readable at 320px)
- REQ-08: Check history in localStorage (grouped by draw, capped at 50 entries)
- REQ-09: Share result via Web Share API with clipboard fallback
- REQ-10: Deploy to Vercel with ISR caching

**Stack:** Next.js 15.x, React 19, TypeScript, Tailwind CSS 4.x, Vercel

**Status:** Planning

**Plans:** 4 plans (Wave 1: A+B parallel, Wave 2: C+D sequential)

Plans:
- [ ] 01-PLAN-A.md — Project scaffold: Next.js 15, Tailwind 4.x CSS-first, Sarabun font, globals.css @theme tokens, TypeScript types, Zod schemas
- [ ] 01-PLAN-B.md — Data layer: matchPrizes() engine, LotteryDataSource abstraction, static fallback JSON, sanook.com scraper route, history.ts localStorage helpers
- [ ] 01-PLAN-C.md — UI components: all 8 components (CheckForm, CheckResult, PrizeBadge, PrizeTable, DrawDateHeader, HistoryPanel, HistoryItem, ShareButton) + loading skeleton
- [ ] 01-PLAN-D.md — Page assembly + Vercel deploy: page.tsx ISR, error.tsx, URL ?ticket= auto-check, production deployment

---

## Out of Scope (v2)

- User authentication
- Buying lottery tickets
- หวยประเภทอื่น (ยี่กี, ลาว)
- Admin panel
- Push notifications
- Multi-ticket batch check
- Past draw archive
- Save favorite numbers
