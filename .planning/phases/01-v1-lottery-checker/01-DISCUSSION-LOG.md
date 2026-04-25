# Phase 1: v1 Lottery Checker - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 01-v1-lottery-checker
**Areas discussed:** Page Layout & Proportions, Visual Style & Colors, Result Display, Draw Table Format

---

## Page Layout & Proportions

| Option | Description | Selected |
|--------|-------------|----------|
| Single column centered | Form → Result → Table, top-to-bottom, max-width centered | ✓ |
| Two column side-by-side | Form+Result left, Draw table right | |
| Form first, table below fold | Same as current | |

**Desktop layout:** Single column centered

| Option | Description | Selected |
|--------|-------------|----------|
| Compact — dense info | Less spacing, see more without scrolling | ✓ |
| Comfortable — airy | More spacing, easier to read | |

**Spacing:** Compact

| Option | Description | Selected |
|--------|-------------|----------|
| 480px | Mobile feel | |
| 640px | Balanced | ✓ |
| 800px | Spacious | |

**Max width:** 640px

| Option | Description | Selected |
|--------|-------------|----------|
| Draw date only | Just "งวดประจำวันที่ X" compact | ✓ |
| Title + draw date | "ตรวจสลาก" + date | |

**Header:** Draw date only

---

## Visual Style & Colors

| Option | Description | Selected |
|--------|-------------|----------|
| Modern minimal — white/clean | White background, single accent | |
| Thai lottery feel — green/red/gold | สีเขียว/แดง/ทอง แบบสลากจริง | ✓ |
| ทอง/ครีม — premium | Current implementation | |

**Color tone:** Thai lottery feel

| Option | Description | Selected |
|--------|-------------|----------|
| เรียบไม่มี card | No card boxes, flat layout | ✓ |
| มี card box แต่เบาๆ | Light border/shadow to divide sections | |
| มี card เด่นที่ form | Form inside prominent card only | |

**Cards:** Flat, no cards

| Option | Description | Selected |
|--------|-------------|----------|
| สีเขียว | Green as primary accent | |
| สีแดง+เขียว | Red + green both prominent | ✓ |
| สีน้ำเงิน/gray | Neutral | |

**Accent:** Red + Green

| Option | Description | Selected |
|--------|-------------|----------|
| โอเค, Sarabun ดี | Keep Sarabun | ✓ |
| เปลี่ยนเป็น Noto Sans Thai | | |

**Font:** Sarabun (keep)

**Language:** ไทยทั้งหมด

---

## Result Display

| Option | Description | Selected |
|--------|-------------|----------|
| พื้นหลังสีเขียวใหญ่ + ตัวหนังสือใหญ่ | Large green bg, big text, prize name + amount | ✓ |
| ปูอัป+animation เวลาถูก | Pop-up sparkle animation on win | |
| Banner เต็มหน้า | Full-width banner | |

**Won result:** Large green background + large text

| Option | Description | Selected |
|--------|-------------|----------|
| เล็ก muted — ไม่เด่น | Small gray text "ไม่ถูกรางวัล" | ✓ |
| สีแดงอ่อนๆ + ข้อความไม่ถูก | Light red with message | |

**Not-won result:** Small muted gray

---

## Draw Table Format

| Option | Description | Selected |
|--------|-------------|----------|
| Table เต็มรูป | Full table: prize name, numbers, amount | ✓ |
| Card grid — แยก tier | Each prize tier as small card | |
| ย่อ-คลาย collapse by tier | Collapsible rows | |

**Draw table:** Full table format

| Option | Description | Selected |
|--------|-------------|----------|
| เด่นมาก—สีเขียว/ตัวอักษรใหญ่ | รางวัลที่ 1 row: green text, larger font | ✓ |
| เหมือนกันหมด | All tiers same style | |

**รางวัลที่ 1:** Highlighted with green + large text

---

## Claude's Discretion

- Input field styling details
- Animation on won result
- Share button placement
- History panel collapse behavior
- Exact green/red hex values
- Loading skeleton design

## Deferred Ideas

None
