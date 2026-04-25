# Feature Landscape

**Domain:** Thai Government Lottery (สลากกินแบ่งรัฐบาล) web checker
**Researched:** 2026-04-25
**Overall confidence:** HIGH (prize structure verified against live API; feature landscape from existing apps/repos + domain knowledge)

---

## Thai Lottery Prize Structure

The Thai Government Lottery (สลากกินแบ่งรัฐบาล) draws on the 1st and 16th of every month. A ticket is a 6-digit number (000000-999999), sold in pairs (ชุดละ 80 บาท). Each ticket can win multiple prizes simultaneously.

### Prize Tiers (verified from live API — April 2026)

| Thai Name | English Name | Matching Rule | Prize (THB) | Winners per Draw |
|-----------|-------------|---------------|-------------|-----------------|
| รางวัลที่ 1 | First Prize | All 6 digits exact match | 6,000,000 | 1 |
| รางวัลข้างเคียงรางวัลที่ 1 | Adjacent to First Prize | First prize number +/- 1 | 100,000 | 2 |
| รางวัลที่ 2 | Second Prize | 6 digits exact (pre-drawn list) | 200,000 | 5 |
| รางวัลที่ 3 | Third Prize | 6 digits exact (pre-drawn list) | 80,000 | 10 |
| รางวัลที่ 4 | Fourth Prize | 6 digits exact (pre-drawn list) | 40,000 | 50 |
| รางวัลที่ 5 | Fifth Prize | 6 digits exact (pre-drawn list) | 20,000 | 100 |
| รางวัลเลขหน้า 3 ตัว | Front 3-digit Prize | First 3 digits of ticket match | 4,000 | ~4,000 |
| รางวัลเลขท้าย 3 ตัว | Last 3-digit Prize | Last 3 digits of ticket match | 4,000 | ~4,000 |
| รางวัลเลขท้าย 2 ตัว | Last 2-digit Prize | Last 2 digits of ticket match | 2,000 | ~10,000 |

**Confidence:** HIGH -- amounts and winner counts verified against live rayriffy API responses for draws 16042569 and 01042569.

**Important notes:**
- Adjacent prize: if first prize is 309612, adjacent winners are 309611 and 309613 (no wraparound -- 999999+1 does NOT wrap to 000000).
- A single ticket CAN win multiple prizes simultaneously (e.g., ticket matches Prize 5 AND last 3 digits AND last 2 digits). The checker MUST report all matches.
- Tax: 0.5% government tax deducted at prize redemption (not relevant for the checker, but users may ask).
- โต๊ด (tod) is NOT an official สลากกินแบ่ง prize tier. It is a concept from underground lottery (หวยใต้ดิน). Do NOT include as a prize category. The PROJECT.md mentions it in context but it should be excluded from the checker logic.
- Prize 3 was historically 5 winners; now confirmed as 10 winners. Do NOT hardcode winner counts -- use the `amount` field from the API response.

### Checking Logic Summary

Given a 6-digit input, the checker evaluates:

1. **รางวัลที่ 1:** exact match against 1 number
2. **รางวัลข้างเคียง:** exact match against 2 numbers (first prize +/- 1, no wraparound)
3. **รางวัลที่ 2-5:** exact match against 5/10/50/100 pre-drawn numbers
4. **เลขหน้า 3 ตัว:** first 3 digits of ticket match 1 of 2 drawn numbers
5. **เลขท้าย 3 ตัว:** last 3 digits of ticket match 1 of 2 drawn numbers
6. **เลขท้าย 2 ตัว:** last 2 digits of ticket match the 1 drawn number

The rayriffy API already separates `prizes` (items 1-5) from `runningNumbers` (items 4-6 above). The checking logic should follow this split.

---

## Table Stakes (Must Have)

Features every Thai user expects. Missing any = the app feels broken or incomplete.

| # | Feature | Why Expected | Complexity | Notes |
|---|---------|-------------|------------|-------|
| 1 | 6-digit number input | Core function -- nothing works without it | Low | `inputMode="numeric"` for mobile number pad; accept leading zeros (use `type="tel"` not `type="number"`); validate exactly 6 digits |
| 2 | Check all prize tiers at once | Users do not want separate checks per tier | Low | Run all checks in a single pass; return array of matches |
| 3 | Clear won/not-won result | Immediate binary feedback is the whole point | Low | Visual distinction: "ถูกรางวัล!" vs "ไม่ถูกรางวัล" -- gold/green for win, neutral grey for lose |
| 4 | Prize name + amount in Thai | Users need to know which prize and how much | Low | Display Thai names: รางวัลที่ 1, เลขท้าย 2 ตัว, etc. + baht value with comma formatting (e.g., "2,000 บาท") |
| 5 | All matches shown for a ticket | A ticket can win multiple prizes; showing only the highest cheats the user | Low | Stack all won prizes -- e.g., "รางวัลที่ 5 (20,000 บาท) + เลขท้าย 2 ตัว (2,000 บาท)" |
| 6 | Full result set for current draw | Users want to see ALL winning numbers for the period | Low | Collapsible section showing all prize tiers with their winning numbers |
| 7 | Draw date displayed (งวดที่) | Users must know which draw they are checking | Low | e.g., "งวดประจำวันที่ 16 เมษายน 2569" |
| 8 | Latest draw auto-loaded | Users should see current results immediately | Low | Fetch on page load; show skeleton/loading state |
| 9 | Mobile-first responsive UI | 80%+ of Thai internet users are mobile-first | Medium | Touch targets >= 44px, no horizontal scroll, readable at 320px width |
| 10 | Check history (localStorage) | Users re-check across sessions and devices | Low | Group by draw date; cap at 50 entries; handle private browsing gracefully |

---

## Differentiators (Competitive Advantage)

Features that are not universal but meaningfully improve the experience. Pick 1-2 for MVP.

| # | Feature | Value Proposition | Complexity | Notes |
|---|---------|-----------------|------------|-------|
| 1 | Share result (Line + copy link) | Line is the dominant social app in Thailand; sharing wins to friends/family is the #1 post-check behavior | Medium | Web Share API triggers native share sheet (Line, Messages, etc.); fallback to "copy link" for desktop. Share URL format: `/?ticket=123456` |
| 2 | Visual digit highlight | Makes it immediately obvious which digits matched which prize | Low | Color-highlight the matching portion of the 6-digit number (e.g., green on last 2 digits for 2-tod prize) |
| 3 | Multi-ticket batch check | Users typically hold 2-10 tickets; checking one-by-one is tedious | Medium | Accept comma-separated or line-by-line input; show grouped results. High impact but more UI work |
| 4 | Save favorite numbers | Users often play the same numbers every draw | Low | localStorage; auto-check saved numbers when new results load; one tap to add/remove |
| 5 | Past draw archive | Users sometimes forget to check and need to look up old draws | Medium | rayriffy API supports `/list` and `/lotto/:id` -- historical data is available |
| 6 | Screenshot-friendly result card | Many Thai users share by screenshot rather than link | Low | Design result card with solid background, no transparent/overlapping elements, good contrast |
| 7 | QR code ticket scan | Tickets have a QR code; scanning is faster than typing | High | Requires camera permission + QR library (e.g., `html5-qrcode`); high impact but significant build complexity |

---

## Anti-Features (Deliberately Exclude)

Features that seem natural but create scope, legal, or UX problems.

| Anti-Feature | Why Avoid | What to Do Instead |
|-------------|-----------|-------------------|
| Online ticket purchasing | Illegal in Thailand outside official GLO channels; major legal liability | This is a checker only. Never link to purchase flows |
| หวยใต้ดิน (underground lottery) | Illegal gambling; legal and ethical risk | Explicitly scope to สลากกินแบ่งรัฐบาล only |
| Prediction / "lucky number" generation | Lottery is random; predictions undermine credibility and may violate gambling regulations | If statistics are ever added, frame as historical frequency data only |
| User authentication / accounts | Backend complexity, PDPA obligations, unnecessary for POC | localStorage for all persistence |
| Push notifications | Service worker + notification permissions + backend scheduler = heavyweight | Users bookmark and return; defer to v2 |
| Admin panel | Overkill for a public checker tool in POC | Defer to v2 if content management becomes necessary |
| Other lottery types (ยี่กี, ลาว, Hanoi) | Different prize structures, APIs, draw schedules | Out of scope for v1 |
| Ticket image upload / OCR | Complex ML/vision for uncertain accuracy | If scanning wanted, use QR code (structured data) only |
| Prize redemption guide | Useful content but not core checker function; risks content drift | Link to official GLO website (glo.or.th) |
| โต๊ด (tod) prize checking | Not an official สลากกินแบ่ง prize tier | Do not include in prize categories |

---

## Mobile UX Patterns (Thai-Specific)

Based on analysis of Thai lottery apps (Sanook Lotto, Postjung, GLO Official, MThai Lotto, lottosod) and mobile web conventions in Thailand.

### Input Patterns

- **Numeric keypad trigger:** `inputMode="numeric"` and `type="tel"` so mobile shows number pad. Critical -- Thai users hate switching keyboards.
- **Auto-submit on 6 digits:** Automatically check when exactly 6 digits entered. Reduces taps from 2 (type + tap button) to 1 (just type).
- **Leading zeros preserved:** Ticket numbers start with 0 (e.g., 012345). Use `type="tel"` not `type="number"` (which strips leading zeros).
- **Paste support:** Users receive ticket numbers via LINE messages. Paste must work cleanly and strip spaces/dashes.
- **Clear button always visible:** Single-tap clear. Do not rely on native backspace only.

### Result Display Patterns

- **Color coding:** Gold (สีทอง) for winners -- strong cultural association with luck/wealth in Thai culture. Green is secondary. Grey for no-win.
- **Prize cards:** Each won prize as a distinct card: Thai name + winning number + baht amount.
- **All wins stacked:** If multiple prizes won, show all of them, not just the highest.
- **Full results collapsible:** Show complete draw results collapsed by default so the user's check result is the hero element.

### History Patterns

- **Grouped by draw date (งวด):** Users think in terms of "which draw" not chronological timestamps.
- **Re-check button per entry:** One tap to re-run a saved number against the latest draw.
- **Delete individual entries:** Users accumulate numbers they do not want.
- **Max 50 entries cap:** Prevents localStorage overflow.

### Share Patterns

- **Web Share API first:** `navigator.share()` triggers the native share menu on mobile (Line, Messages, WhatsApp, etc.).
- **Fallback copy link:** For desktop browsers without Web Share API, "Copy link" copies `/?ticket=123456` to clipboard.
- **Share text format:** Include draw date, ticket number, prize won, amount. Keep short for LINE messages.
- **Screenshot-friendly:** Design the result card to look good as a screenshot (solid background, clear text, no floating elements).

### Thai-Specific Considerations

- **Thai numerals (๐-๙):** Do NOT use Thai numerals for the ticket input or display. Thai people use Arabic numerals (0-9) for lottery numbers. The input and display should be Arabic numerals only.
- **Buddhist calendar dates:** Thai lottery uses Buddhist Era (พ.ศ.) dates, e.g., "16 เมษายน 2569" not "April 16, 2026". Display dates in Thai Buddhist calendar format.
- **Font:** Sarabun (Google Fonts) is the standard Thai government/formal font and is appropriate for lottery context. Available via `next/font/google`.
- **Language:** All UI in Thai. No English toggle needed for POC target audience.
- **Draw timing:** Results are announced ~15:30 on draw day (1st and 16th). Users flood checkers right after. Loading speed at peak matters.
- **Cultural context:** Lottery is deeply embedded in Thai culture. Users treat checking as a social event -- share, celebrate, commiserate. The UX should feel celebratory (win) or gentle (lose), never clinical.

---

## Feature Dependencies

```
[6-digit input] --> [Prize check logic] --> [Result display]
                                          |
[External API fetch] -------------------->|
                                          |
[Result display] --> [History save]       |
[Result display] --> [Share URL build]    |
                                          |
[History panel] <-- [localStorage read]   |
```

Key dependencies:
- Prize check logic requires external API data (must fetch first)
- History and share both depend on a completed check result
- Multi-ticket batch check adds UI complexity but uses the same check logic
- QR scan is independent of core check logic (alternative input method)

---

## MVP Feature Priority

For v1 POC, build in this order:

**Phase 1 -- Core checker (must ship):**
1. 6-digit input with `inputMode="numeric"`, validation, auto-submit
2. Fetch latest draw from rayriffy API (`lotto.api.rayriffy.com/latest`)
3. Check all prize tiers with `matchPrizes()` pure function
4. Display won/not-won with prize name + amount in Thai
5. Full draw result display (all winning numbers for current period)
6. Draw date displayed

**Phase 2 -- Retention features (ship before public launch):**
7. Check history in localStorage (grouped by draw, re-check, delete)
8. Share via Web Share API with copy-link fallback

**Phase 3 -- Polish (before or shortly after launch):**
9. Screenshot-friendly result card design
10. Visual digit highlighting on result
11. Loading skeleton / error boundary for API failures
12. OG metadata for shared links

**Defer to v1.1 or v2:**
- Multi-ticket batch check (medium complexity, high value)
- Save favorite numbers (low complexity, medium value)
- QR code scan (high complexity, high value)
- Past draw archive browsing (depends on API reliability validation)
- Statistics / hot numbers (v2)

---

## Sources

- **Prize structure (live API verification):** `https://lotto.api.rayriffy.com/latest` -- confirmed active 2026-04-25, returns all prize tiers with correct amounts. Draws 16042569 and 01042569 verified. [HIGH confidence]
- **API documentation:** [rayriffy/thai-lotto-api GitHub](https://github.com/rayriffy/thai-lotto-api) -- 104 stars, active. Note: README sample data from 2018 is outdated (Prize 3 shows 5 winners, now 10). [MEDIUM confidence -- docs outdated but API works]
- **Historical data:** rayriffy `/list` and `/lotto/:id` endpoints confirmed working. [HIGH confidence]
- **Feature landscape:** [hein-hkk/thai-lottery-checker](https://github.com/hein-hkk/thai-lottery-checker) (multilingual, admin blog, embedded checker), [santhitak/lotto.th](https://github.com/santhitak/lotto.th) (Fresh.js showcase), [SnkDigitalDesign/Thai-Lottery-Qr-Checker](https://github.com/SnkDigitalDesign/Thai-Lottery-Qr-Checker) (QR scanning approach). [MEDIUM confidence -- repos exist, features inferred from README]
- **Existing Thai lottery websites:** lottery.co.th, lottosod.com, lottovip.com -- meta descriptions confirm standard feature set (ตรวจหวย, สถิติหวยย้อนหลัง, ใบตรวจหวย, ถ่ายทอดสดหวยออก). [LOW confidence -- web scraping limited by rate limits]
- **Mobile UX patterns:** General Thai mobile web conventions, LINE dominance as sharing platform. [MEDIUM confidence -- from domain knowledge, not verified by search]
