# poc-lottery-online

## What This Is

ระบบตรวจหวยรัฐบาลไทยออนไลน์ — ผู้ใช้กรอกหมายเลขสลาก ระบบตรวจผลรางวัลจาก API ภายนอก แสดงผลว่าถูกรางวัลหรือไม่พร้อมรายละเอียดรางวัล รองรับมือถือ deploy บน Vercel

## Core Value

**ตรวจหวยได้ในไม่กี่วินาที** — กรอกเลข → เห็นผลทันที ไม่ต้องค้นหาเอง

## Context

- **Domain**: Thai Government Lottery (สำนักงานสลากกินแบ่งรัฐบาล)
- **Draws**: ทุกวันที่ 1 และ 16 ของทุกเดือน
- **Ticket format**: 6 หลัก (เช่น 123456)
- **Prizes**: รางวัลที่ 1 (6 หลักตรง), โต๊ด, 2 ตัวบน/ล่าง, 3 ตัวบน/ล่าง, รางวัลใกล้เคียง
- **Data source**: API ภายนอก (เช่น api.lottery.hunsa.com หรือ similar public API)
- **Cache**: JSON file / localStorage สำหรับ history และ cache ผลรางวัล

## Target Users

คนไทยทั่วไปที่ถือสลากกินแบ่งรัฐบาล ต้องการตรวจผลรางวัลผ่านมือถือหรือ browser ได้ง่ายๆ

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Data**: External lottery API + JSON/localStorage for history
- **Deploy**: Vercel
- **Language**: TypeScript

## Requirements

### Active (v1)

- [ ] ผู้ใช้กรอกหมายเลขสลาก 6 หลัก และตรวจสอบผลรางวัล
- [ ] ระบบแสดงผลว่าถูกรางวัลหรือไม่ พร้อมประเภทรางวัลและมูลค่า
- [ ] ระบบแสดงผลรางวัลทั้งหมดของงวดล่าสุด
- [ ] ระบบเก็บประวัติหมายเลขที่เคยตรวจไว้ใน localStorage
- [ ] ผู้ใช้แชร์ผลการตรวจได้ (copy link / share)
- [ ] UI รองรับมือถือ (mobile-first, responsive)

### Out of Scope (v1)

- User authentication — ไม่จำเป็นสำหรับ POC
- การซื้อสลากออนไลน์ — นอก scope
- หวยประเภทอื่น (ยี่กี, ลาว) — defer to v2
- Admin panel — defer to v2
- Push notifications — defer to v2

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router | SSR + API routes ใน project เดียว, deploy Vercel ง่าย | — Pending |
| External API for results | ไม่ต้อง maintain lottery database เอง | — Pending |
| localStorage for history | POC scope, ไม่ต้อง backend/auth | — Pending |
| Tailwind CSS | Rapid UI development, responsive ง่าย | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope
2. Requirements validated? → Move to Validated
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions

---
*Last updated: 2026-04-25 after initialization*
