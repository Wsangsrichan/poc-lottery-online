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

**Status:** Planning (REPLAN — replanning with user decisions from 01-CONTEXT.md)

**Plans:** 3 plans (Wave 1: 01, Wave 2: 02+03 parallel)

Plans:
- [ ] 01-01-PLAN.md — Color system: replace @theme tokens with Thai lottery green/red palette in globals.css
- [ ] 01-02-PLAN.md — Layout & header: flat 640px column in page.tsx, compact date-only DrawDateHeader
- [ ] 01-03-PLAN.md — Result & table: big green won state in CheckResult, muted not-won, รางวัลที่ 1 green highlight in PrizeTable

---

## Phase 2: Multi-Ticket Batch Check

**Goal:** ผู้ใช้กรอกหมายเลขสลากหลายใบพร้อมกัน (paste จากกล้อง/สลากจริง) ระบบตรวจทีเดียว แสดงสรุปผลรวม (ถูกกี่ใบ ไม่ถูกกี่ใบ รางวัลรวมเท่าไร) พร้อมรายละเอียดแต่ละใบ

**Depends on:** Phase 1 (complete)

**Requirements:**
- REQ-11: Input รองรับหลายหมายเลข — paste หลายบรรทัด, คั่นด้วย comma/space/newline, auto-extract 6 หลัก
- REQ-12: แสดงสรุปผลรวม — จำนวนใบที่ถูก/ไม่ถูก, มูลค่ารางวัลรวม
- REQ-13: แสดงรายละเอียดแต่ละใบ — เลข, รางวัลที่ถูก (ถ้ามี), สถานะถูก/ไม่ถูก
- REQ-14: Camera/OCR integration — ถ่ายภาพสลากแล้ว auto-extract เลข (nice-to-have)

**Stack:** Same as Phase 1 (Next.js 16, React 19, Tailwind 4.x)

**Status:** Planning

---

## Out of Scope (v3)

- User authentication
- Buying lottery tickets
- หวยประเภทอื่น (ยี่กี, ลาว)
- Admin panel
- Push notifications
- Multi-ticket batch check
- Past draw archive
- Save favorite numbers
