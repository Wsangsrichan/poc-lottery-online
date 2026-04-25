# Domain Pitfalls: Thai Government Lottery Checker

**Domain:** Thai Government Lottery (สลากกินแบ่งรัฐบาล) web checker
**Researched:** 2026-04-25
**Confidence:** MEDIUM (live API tests performed; web search tools rate-limited so some findings rely on domain knowledge)

---

## Critical Pitfalls

Mistakes that cause rewrites, broken features, or app failure.

---

### Pitfall 1: External API Returns Schema Instead of Data

**What goes wrong:** The recommended rayriffy API (`https://lotto.api.rayriffy.com/latest`) returns TypeScript-style type definitions (e.g., `date: string`, `reward: string`) instead of actual lottery results. Every call returns 200 OK with valid-looking structure but no real data.

**Evidence (LIVE TEST on 2026-04-25):**
```
curl https://lotto.api.rayriffy.com/latest
{
  response: {
    date: string,          # <-- NOT an actual date
    endpoint: url,         # <-- NOT an actual URL
    prizes: [{
        amount: int,       # <-- NOT an actual number
        reward: string     # <-- NOT an actual prize amount
    }]
  }
}
```

All three endpoints (`/latest`, `/list/{page}`, `/lotto/{id}`) behave identically. The root path redirects to `/swagger` (Elysia Scalar docs). This API is either in perpetual "documentation mode" or is a dead project that was never connected to a real data source.

**Why it happens:** ElysiaJS (the framework used) has built-in Scalar documentation. When the API handler is not properly implemented or the data source is broken, Elysia returns its type schema as the response body instead of actual JSON data. The HTTP status is 200, so error handling code does not catch it.

**Consequences:**
- Prize checking shows "string" as dates and "int" as amounts -- complete garbage
- `JSON.parse()` fails because the response is not valid JSON (keys are unquoted)
- No test would catch this without a live integration test against the real endpoint
- The STACK.md and ARCHITECTURE.md research files both assume this API works correctly

**Prevention:**
1. **Validate API response at build time.** Write a `scripts/verify-api.ts` that calls the endpoint and asserts the response contains actual data (dates match regex, numbers are numeric, prizes array has real 6-digit strings). Run this in CI.
2. **Do NOT ship without a fallback.** The app must have a hardcoded fallback dataset for the current draw period that gets served when the API is unavailable or returns invalid data.
3. **Consider a different primary data source.** The rayriffy API should be treated as unreliable. See Pitfall 2 for alternatives.
4. **Use Zod or similar runtime validation** on the API response to catch schema-vs-data mismatches:
   ```typescript
   import { z } from 'zod'
   const PrizeSchema = z.object({
     id: z.string(),
     name: z.string(),
     number: z.array(z.string().regex(/^\d{6}$/)),
     reward: z.union([z.string(), z.number()]), // API may return either
     amount: z.number(),
   })
   ```

**Detection:**
- The response body contains literal strings `"string"`, `"int"`, `"url"` as values
- `JSON.parse()` throws because keys are unquoted (no double quotes around property names)
- `response.prizes[0].number` contains `"string"` instead of `"123456"`

**Phase mapping:** Phase 1 (Data Layer) -- this must be resolved before any UI work begins.

---

### Pitfall 2: No Reliable Free Thai Lottery API Exists

**What goes wrong:** Every publicly-documented free Thai lottery API is either dead, returns no data, or is undocumented. Building the entire app on a single external dependency with no verified working alternative is a single point of failure.

**Evidence (LIVE TESTS on 2026-04-25):**

| API | URL | Status | Issue |
|-----|-----|--------|-------|
| rayriffy | `lotto.api.rayriffy.com/latest` | 200 | Returns type schema, not data |
| hunsa.com | `api.lottery.hunsa.com` | N/A | Domain/endpoint does not exist |
| GLO official | `glo.or.th/api/lottery` | 5xx | Server error |
| lottery.co.th | `lottery.co.th/api/results` | 404 | No API exists |
| naigolf Vercel | `lottery-thai-api.vercel.app` | NOT_FOUND | Deployment removed |
| Multiple random Vercel apps | Various | 404/NOT_FOUND | Dead deployments |

**Why it happens:** Thai lottery APIs are almost always hobby/scraping projects. They get abandoned, hit by source-site changes (sanook.com restructures), or get blocked by Cloudflare. There is no official GLO API.

**Consequences:**
- App launches and shows "Loading..." forever on day one
- Need to scramble to find/build an alternative data source mid-development
- Users see broken results on draw days when traffic spikes hit the fragile API

**Prevention:**
1. **Build a self-hosted scraper as the primary data source.** Deploy a lightweight scraper (Node.js + cheerio or Puppeteer) on Vercel Cron Jobs or Railway that:
   - Scrapes the GLO official results page (`https://www.glo.or.th`) or a reliable aggregator (sanook.com/lotto, mthai.com/lotto)
   - Stores results in a simple JSON file committed to the repo or in Vercel KV/Upstash
   - Runs on a cron schedule (every 30 min on draw days 1st/16th, once daily otherwise)
2. **Use rayriffy or similar as secondary/fallback** only after verifying it returns real data
3. **Hardcode results in the repo** as a third fallback. After each draw, commit the results JSON. The app always has at least the last draw's data.
4. **Plan for API swap from day one.** Abstract the data source behind an interface:
   ```typescript
   interface LotteryDataSource {
     getLatest(): Promise<LotteryResult>
     getByDate(date: string): Promise<LotteryResult | null>
   }
   ```
   Implement both `RayriffySource` and `HardcodedSource` and `ScraperSource`. Swap via env var.

**Detection:**
- Any API test returns schema-like responses instead of real data
- CI integration test against the live endpoint fails
- API response does not contain valid Thai date format (dd/mm/yyyy)

**Phase mapping:** Phase 1 (Data Layer) -- must be resolved before any client-facing work.

---

### Pitfall 3: Prize Amount Confusion -- Per-Ticket vs Per-Pair vs With Tax

**What goes wrong:** The app displays incorrect prize amounts because of confusion between:
- **Per-ticket amount** (what one individual 80-baht ticket wins)
- **Per-pair amount** (what the ชุด of two tickets wins combined)
- **TGL vs TCL amounts** (Thai Government Lottery vs Thai Charity Lottery have different first-prize amounts)
- **Pre-tax vs post-tax** amounts

**Evidence from FEATURES.md research:**
- รางวัลที่ 1: TGL = 2,000,000 baht per ticket, TCL = 3,000,000 baht per ticket
- But rayriffy API's schema shows `reward: 6,000,000` (which appears to be per-pair TGL, or per-ticket TCL, or neither)
- Tax: 0.5% on TGL, 1% on TCL

The FEATURES.md research says first prize is 2M (TGL) / 3M (TCL) per ticket. The STACK.md research shows the rayriffy API returning `reward: 6,000,000`. Neither source clarifies whether the displayed amount should be per-ticket or per-pair.

**Why it happens:** Thai lottery tickets are sold in pairs (ชุด). Many websites and apps show the per-pair amount because it looks bigger and more exciting. The official GLO website shows per-ticket amounts. Users expect to see per-pair amounts because that is what they paid for.

**Consequences:**
- User thinks they won 6M when they actually won 3M (per-ticket) -- causes real anger and lost trust
- Or user sees 2M when they expected 4M (per-pair) -- thinks the app is wrong
- Conflicting numbers between the app and official GLO site damages credibility

**Prevention:**
1. **Always display per-ticket amounts** and clearly label them. The standard is: "รางวัลที่ 1: 2,000,000 บาท (ต่อใบ)" -- note the ต่อใบ (per ticket).
2. **Do NOT combine TGL and TCL amounts.** Most checkers don't distinguish between TGL and TCL tickets (the user doesn't know which they have just from the number). Pick one amount and label it. Recommend: show TGL amounts (2M) since TGL is far more common, and add a note: "TCL: 3,000,000 บาท/ใบ".
3. **Use the official GLO prize table as the source of truth, not the API.** Hardcode prize amounts in the app. The API provides winning numbers only; the app provides the amounts from its own constants.
4. **Add a disclaimer** near the prize display: "ยอดรางวัลตามประกาศ สลากกินแบ่งรัฐบาล (หักภาษี 0.5% ของรางวัลที่ 1)"

**Detection:**
- Prize amounts in the API don't match official GLO amounts
- QA test compares app display against GLO website

**Phase mapping:** Phase 1 (Data Layer + Check Logic) -- hardcode amounts before building display.

---

### Pitfall 4: โต๊ด (Permutation) Is NOT an Official Government Lottery Prize

**What goes wrong:** The app includes โต๊ด checking logic (permutations of 3 digits for the running number prizes), but โต๊ด is an underground lottery (หวยใต้ดิน) concept, NOT an official สลากกินแบ่งรัฐบาล prize type.

**Evidence from FEATURES.md:**
> "โต๊ด is not an official prize tier for สลากกินแบ่งรัฐบาล; it applies to underground lottery (หวยใต้ดิน). Do not conflate."

The official Thai government lottery has:
- เลขหน้า 3 ตัว: first 3 digits match a drawn number (exact match only)
- เลขท้าย 3 ตัว: last 3 digits match a drawn number (exact match only)
- เลขท้าย 2 ตัว: last 2 digits match a drawn number (exact match only)

There is NO permutation/โต๊ด variant. The 3-digit prizes are exact-match only.

**Why it happens:** Many Thai lottery apps include โต๊ด because users expect it. Thai lottery culture conflates the government lottery with the underground lottery. Users who play โต๊ด naturally want their government lottery tickets checked for it too. Some apps compromise by offering both, clearly labeled.

**Consequences:**
- Including โต๊ด makes the app legally ambiguous -- it could be seen as facilitating underground gambling
- The PROJECT.md scope says "สลากกินแบ่งรัฐบาล" only -- adding โต๊ด is scope creep into illegal territory
- Incorrect โต๊ด logic (wrong permutation set) produces wrong results and angry users

**Prevention:**
1. **Do not include โต๊ด checking in v1.** The app is scoped to สลากกินแบ่งรัฐบาล only.
2. **If users request it later**, add it as an explicitly separate feature with clear labeling: "เลขโต๊ด (หวยใต้ดิน)" with a disclaimer that this is not an official prize.
3. **The correct โต๊ด logic** (for future reference, should it ever be needed): For a 3-digit number ABC, โต๊ด means any permutation of those 3 distinct digits. If digits repeat (e.g., 112), โต๊ด has fewer permutations (112, 121, 211 = 3, not 6). This is the tricky part that causes bugs.

**Detection:**
- Any code that generates permutations of user input digits
- Feature request or user complaint about missing โต๊ด

**Phase mapping:** Phase 1 -- explicitly exclude from scope. If added later, it is a separate phase.

---

### Pitfall 5: Adjacent First Prize (รางวัลข้างเคียง) Boundary Conditions

**What goes wrong:** The "adjacent to first prize" check (+/- 1 of the 6-digit first prize number) has edge cases that many checkers get wrong:
- **No wraparound:** 999999 + 1 = 000000 is NOT valid. Adjacent only applies within normal integer range.
- **Leading zeros:** If first prize is 000001, then 000000 and 000002 are adjacent. But the input "1" (without leading zeros) must be padded to "000001" before comparison.
- **Data format mismatch:** If the API returns the first prize as a string "123456" but the user input is stored as a number 123456, the adjacent check may fail for numbers with leading zeros.

**Why it happens:** The adjacent prize is the ONLY prize tier that involves arithmetic on the ticket number. All other tiers are pure string/exact-match comparisons. Developers who implement the checker with simple `===` comparisons may forget to handle the arithmetic case, or may implement it incorrectly with number coercion instead of string manipulation.

**Consequences:**
- Ticket 999999 does not show as adjacent to first prize 000000 (correct) or incorrectly shows as adjacent (wrong, if wraparound logic is added)
- Ticket with leading zeros is rejected as "invalid" when it is actually a valid winning number
- Users who hold 000001 think they didn't win because the checker says "000000 and 2 are adjacent" instead of "000002"

**Prevention:**
1. **Always pad ticket input to 6 digits with leading zeros.** Never store or compare as a number.
   ```typescript
   function padTicket(input: string): string {
     return input.trim().padStart(6, '0')
   }
   ```
2. **Adjacent calculation uses string manipulation, not math:**
   ```typescript
   function getAdjacentNumbers(firstPrize: string): string[] {
     const n = parseInt(firstPrize, 10)
     const results: string[] = []
     if (n > 0) results.push(String(n - 1).padStart(6, '0'))
     if (n < 999999) results.push(String(n + 1).padStart(6, '0'))
     return results
   }
   ```
   No wraparound. First prize 000000 has no lower adjacent. First prize 999999 has no upper adjacent.
3. **Write unit tests for boundary cases:**
   - First prize "000000" -> adjacent: ["000001"] only
   - First prize "999999" -> adjacent: ["999998"] only
   - First prize "123456" -> adjacent: ["123455", "123457"]
   - User input "1" -> pad to "000001" before any comparison

**Detection:**
- Unit tests covering boundary values
- Manual test with ticket numbers near 000000 and 999999

**Phase mapping:** Phase 1 (Check Logic) -- unit tests alongside `matchPrizes()`.

---

## Moderate Pitfalls

Mistakes that cause bad UX or partial failures.

---

### Pitfall 6: Thai Date Format and Buddhist Calendar

**What goes wrong:** Draw dates are displayed in wrong format, wrong calendar, or inconsistent between the API response and the UI.

**The reality:**
- The API returns dates in Thai Buddhist calendar format: `"16/04/2568"` (day/month/Buddhist year)
- Thai users expect to see Buddhist year (พ.ศ.) for the draw date: "งวดประจำวันที่ 16 เมษายน 2568"
- JavaScript's `Date` object works in Gregorian calendar. `new Date("16/04/2568")` produces invalid results.
- International date formatting libraries default to Gregorian years.

**Consequences:**
- Draw date shows as "16 April 2025" (Gregorian) when users expect "16 เมษายน 2568" (Buddhist)
- Date comparison fails when checking if a cached result is from the current draw period
- `new Date(apiDate)` silently produces wrong dates for Buddhist year strings

**Prevention:**
1. **Do not parse the API date string with `new Date()`.** Parse it manually:
   ```typescript
   function parseThaiDate(dateStr: string): { day: number; month: number; buddhistYear: number } {
     const [day, month, year] = dateStr.split('/').map(Number)
     return { day, month, buddhistYear: year }
   }
   ```
2. **Display dates in Thai format using a mapping, not `Intl.DateTimeFormat`:**
   ```typescript
   const THAI_MONTHS = [
     '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
     'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
     'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
   ]
   function formatThaiDate(day: number, month: number, year: number): string {
     return `${day} ${THAI_MONTHS[month]} ${year}`
   }
   ```
3. **For "next draw" calculation**, convert Buddhist year to Gregorian: `gregorianYear = buddhistYear - 543`.
4. **Store draw dates as ISO strings internally** (`2025-04-16`) for sorting and comparison, convert to Thai display format only for UI.

**Detection:**
- Any code that passes a Buddhist year string to `new Date()`
- Unit test: parse "16/04/2568" and verify it does not produce a JavaScript Date object

**Phase mapping:** Phase 2 (UI) -- date formatting when displaying results.

---

### Pitfall 7: Input Validation -- Leading Zeros, Non-Digit Characters, Length

**What goes wrong:** Users paste ticket numbers with spaces, dashes, or other formatting. Numbers with leading zeros get stripped. Inputs longer or shorter than 6 digits are accepted.

**Common failure modes:**
- User pastes "123 456" or "123-456" from LINE message -> validation rejects it
- User enters "012345" -> `parseInt("012345")` becomes `12345` -> wrong 5-digit comparison
- User enters "1234567" (7 digits) -> app silently compares only first 6 -> wrong result
- User enters "abcdef" -> app crashes or shows confusing error

**Prevention:**
1. **Strip all non-digit characters before processing:**
   ```typescript
   function sanitizeTicket(input: string): string {
     return input.replace(/\D/g, '')
   }
   ```
2. **Use `type="tel"` and `inputMode="numeric"` on the HTML input** -- triggers numeric keypad on mobile, avoids keyboard switching.
3. **Use `maxLength={6}`** on the input element.
4. **Validate AFTER sanitization:**
   ```typescript
   function validateTicket(raw: string): { valid: true; ticket: string } | { valid: false; error: string } {
     const sanitized = raw.replace(/\D/g, '')
     if (sanitized.length !== 6) return { valid: false, error: 'กรุณากรอกหมายเลข 6 หลัก' }
     return { valid: true, ticket: sanitized }
   }
   ```
5. **NEVER use `parseInt()` on ticket numbers.** Always treat as strings. Pad with leading zeros to 6 characters.

**Detection:**
- Unit tests with inputs: "012345", "123 456", "123-456", "1234567", "abc", ""
- Manual test: paste a LINE message containing a ticket number

**Phase mapping:** Phase 2 (UI) -- input validation in CheckForm.

---

### Pitfall 8: Multiple Prizes Per Ticket Not Reported

**What goes wrong:** A single ticket can win multiple prizes simultaneously. For example, ticket `123456` could win:
- รางวัลที่ 5 (if 123456 is in the fifth prize list)
- เลขท้าย 3 ตัว (if 456 is in the back-3 running numbers)
- เลขท้าย 2 ตัว (if 56 is in the back-2 running numbers)

Many checkers stop at the first match and miss additional prizes.

**Evidence from FEATURES.md:**
> "A single ticket can win multiple prizes simultaneously (e.g., win last-2-digit AND last-3-digit AND fifth prize). The checker must report ALL matches."

**Consequences:**
- User sees "ถูกเลขท้าย 2 ตัว 2,000 บาท" but misses the additional "เลขท้าย 3 ตัว 4,000 บาท"
- User loses trust because the app says they won less than they actually did
- This is arguably the worst UX error because it directly costs users money (they might throw away a winning ticket)

**Prevention:**
1. **The `matchPrizes()` function MUST check ALL prize tiers and return ALL matches.** Do not `return` early after the first match.
   ```typescript
   // WRONG: stops at first match
   for (const prize of prizes) {
     if (prize.number.includes(ticket)) return [prize] // BUG
   }

   // CORRECT: collects all matches
   const matches: PrizeMatch[] = []
   for (const prize of prizes) {
     if (prize.number.includes(ticket)) matches.push(prize)
   }
   // Also check running numbers...
   return matches
   ```
2. **Display all matches in the UI** as stacked cards, not just the highest-value one.
3. **Show total winnings** as a sum of all matched prizes.
4. **Unit test:** construct a scenario where a ticket matches 3 prizes simultaneously and verify all 3 are returned.

**Detection:**
- Unit test with a ticket number designed to match multiple tiers
- Manual test against a known draw result

**Phase mapping:** Phase 1 (Check Logic) -- critical logic, test thoroughly.

---

### Pitfall 9: Prize Amounts Hardcoded vs API-Provided

**What goes wrong:** The app relies on the API to provide prize amounts (`reward` field), but:
- The rayriffy API returns `reward` as a string type (per the live schema test), not a number
- The API might return amounts that don't match current official GLO amounts (prizes were changed historically)
- The API might return per-pair amounts while the app should display per-ticket amounts

**Prevention:**
1. **Hardcode prize amounts in the app as the source of truth.** The API provides winning numbers only.
   ```typescript
   const PRIZE_AMOUNTS: Record<string, number> = {
     prizeFirst: 2000000,
     prizeSecond: 100000,
     prizeThird: 40000,
     prizeFourth: 20000,
     prizeFifth: 10000,
     adjacentFirst: 100000,
     runningFront3: 4000,
     runningBack3: 4000,
     runningBack2: 2000,
   } as const
   ```
2. **Use API `reward` field only as a validation check** (if it doesn't match our hardcoded value, log a warning).
3. **If prize amounts ever change** (they have historically -- the bonus prize was eliminated in 2015), updating a constant is a one-line change, not an API migration.

**Detection:**
- Code review: any display of `prize.reward` from the API directly in the UI

**Phase mapping:** Phase 1 (Data Layer) -- define prize amounts as constants before building check logic.

---

### Pitfall 10: ISR Cache Shows Stale Results on Draw Day

**What goes wrong:** On draw day (1st or 16th), users check the app after ~15:30 (typical draw result announcement time). But the Next.js ISR cache has a 12-hour TTL set from the previous fetch. If the last fetch was at 10:00 AM, stale results persist until 10:00 PM -- 6+ hours after results are available.

**Why it happens:** The ARCHITECTURE.md research recommends `revalidate: 43200` (12 hours). This is fine between draws but terrible on draw day. The 1st and 16th are the ONLY days when freshness matters, and the cache is designed for the other 13-14 days.

**Consequences:**
- Users see "ยังไม่มีผลรางวัล" or results from the PREVIOUS draw for hours after new results are announced
- Users flock to competitor apps that show results faster
- The app becomes irrelevant on the most important days

**Prevention:**
1. **Reduce revalidation to 30-60 minutes on draw days.** Detect draw day in the Route Handler:
   ```typescript
   export const revalidate = 1800 // 30 minutes -- always safe

   // OR: smarter approach -- longer TTL between draws, short TTL on draw days
   const now = new Date()
   const isDrawDay = now.getDate() === 1 || now.getDate() === 16
   const isAfterDraw = isDrawDay && now.getHours() >= 15
   export const revalidate = isAfterDraw ? 300 : 43200 // 5 min vs 12 hours
   ```
2. **Add a manual "refresh" button** in the UI that bypasses the cache and fetches fresh results:
   ```typescript
   // Client-side forced refresh
   fetch('/api/lottery', { cache: 'no-store' })
   ```
3. **Use on-demand revalidation** (Vercel webhook or cron) triggered at draw time. Set up a Vercel Cron Job that calls `revalidateTag('lottery-result')` at 16:00 on the 1st and 16th of each month.
4. **Show a "last updated" timestamp** so users know how fresh the data is.

**Detection:**
- On draw day after 16:00, the displayed results should match the official GLO announcement
- Compare the draw date in the response against today's date

**Phase mapping:** Phase 2 (UI) -- caching strategy refinement. Critical for user retention.

---

## Minor Pitfalls

Issues that cause inconvenience or cosmetic problems.

---

### Pitfall 11: Arabic vs Thai Numerals in Display

**What goes wrong:** The app displays prize numbers in Arabic numerals (0-9) while some Thai users expect or prefer Thai numerals (๐-๙). Or conversely, the app uses Thai numerals in places where users expect Arabic numerals.

**The standard in Thai lottery context:**
- Ticket numbers are ALWAYS in Arabic numerals (0-9). No Thai lottery ticket has ever been printed with Thai numerals.
- Prize amounts are typically in Arabic numerals with the baht unit.
- Date display uses Arabic numerals for the day/year but Thai text for the month.

**Prevention:**
1. **Use Arabic numerals everywhere** for ticket numbers, prize amounts, and dates. This matches the physical ticket and every official source.
2. **Do not add a "Thai numeral" toggle** -- it's unnecessary complexity for v1.
3. **If localizing numbers** (e.g., `2,000,000` -> `2,000,000`), use `toLocaleString('th-TH')` which uses Arabic numerals in Thai locale.

**Phase mapping:** Phase 2 (UI) -- cosmetic, low priority.

---

### Pitfall 12: localStorage Quota Exceeded and Private Mode

**What goes wrong:** Safari in private browsing mode throws on `localStorage.setItem()`. Even in normal mode, accumulating too many history entries can hit the 5-10MB localStorage quota.

**Prevention:**
1. **Always wrap localStorage in try/catch.** The STACK.md research already documents this pattern.
2. **Cap history at 50 entries.** Each entry is roughly 100-200 bytes. 50 entries = ~10KB. Far below any quota limit.
3. **On quota exceeded, delete oldest entries** and retry, rather than silently failing.
4. **Do not store full API responses in localStorage.** Only store the minimal data needed: `{ ticket, drawDate, result, timestamp }`.

**Detection:**
- Test in Safari private mode
- Test with 100+ history entries to verify pruning works

**Phase mapping:** Phase 3 (History) -- localStorage implementation.

---

### Pitfall 13: Share URL Does Not Work as Expected

**What goes wrong:** The share URL `/?ticket=123456` works for sharing, but:
- The shared URL opens the app and shows the result for the CURRENT draw, not the draw when the ticket was originally checked. If the user saved a link from the April 1 draw and opens it on April 20, it checks against the April 16 draw.
- Some social platforms (LINE, Facebook) strip query parameters from shared URLs.
- OG metadata may not render correctly for shared links on platforms that don't execute JavaScript.

**Prevention:**
1. **Include the draw date in the share URL:** `/?ticket=123456&draw=2025-04-16`. This way the shared result always refers to the same draw.
2. **When a shared URL has a draw date from a past draw**, show a clear notice: "ผลรางวัลจากงวดที่ 16 เมษายน 2568 (งวดที่แล้ว)" with a button to check against the current draw.
3. **Use server-side `generateMetadata()`** to produce OG tags for social sharing -- this works even on platforms that don't render JavaScript (Facebook, Twitter).

**Detection:**
- Share a result URL, wait until the next draw, and open it -- verify it shows the correct (original) draw's result
- Test the shared URL in Facebook's Sharing Debugger

**Phase mapping:** Phase 4 (Share) -- share URL design.

---

### Pitfall 14: Legal/Compliance -- Lottery App Risks

**What goes wrong:** Operating a lottery-related app in Thailand has legal considerations:
- The app is a CHECKER only, not a purchase platform -- this is generally legal
- Including โต๊ด/underground lottery features crosses into facilitating illegal gambling
- Showing advertisements for gambling/lottery purchase services could create liability
- Collecting personal data (even ticket numbers) triggers PDPA considerations if the app evolves

**Prevention:**
1. **Clearly label the app as a checker tool only.** No purchase links, no prediction features.
2. **Add a disclaimer:** "แอปนี้เป็นเครื่องมือตรวจสอบผลรางวัลเท่านั้น ไม่ได้จัดจำหน่ายสลากกินแบ่งรัฐบาล"
3. **Link to the official GLO website** for authoritative results and ticket purchase information.
4. **Do not collect any personally identifiable information.** Ticket numbers are not PII, but adding user accounts in v2 would trigger PDPA.

**Detection:**
- Legal review before launch
- No purchase links, no gambling ads, no prediction features

**Phase mapping:** Phase 5 (Polish/Launch) -- disclaimers and legal review before going public.

---

### Pitfall 15: Mobile UX -- Number Pad Not Triggered

**What goes wrong:** Using `<input type="number">` on mobile sometimes triggers a decimal keyboard (with comma and period) instead of a plain numeric keypad. This makes entering 6 digits unnecessarily frustrating.

**Prevention:**
1. **Use `type="tel"` and `inputMode="numeric"`.** The `tel` type triggers the phone-style numeric keypad (digits only, large keys) on both iOS and Android. The `inputMode="numeric"` is the modern standard that does the same thing.
2. **Do NOT use `type="number"`.** It strips leading zeros and triggers a keyboard with extra symbols.
3. **Test on both iOS Safari and Android Chrome** -- keyboard behavior differs between platforms.

**Detection:**
- Manual test on iOS Safari and Android Chrome: verify numeric keypad appears

**Phase mapping:** Phase 2 (UI) -- input component.

---

### Pitfall 16: SEO and Draw-Day Traffic Spikes

**What goes wrong:** Lottery checker searches spike massively on draw days (1st and 16th). Keywords like "ตรวจหวย", "ตรวจสลาก", "ผลสลากกินแบ่ง" are extremely competitive on Google Thailand. Without SEO, the app gets zero organic traffic on the days when users are actually looking for it.

**Prevention:**
1. **Use Next.js Server Components** (already planned) so the page content is server-rendered and crawlable.
2. **Add proper Thai-language meta tags:**
   ```typescript
   export const metadata = {
     title: 'ตรวจหวยรัฐบาล ผลสลากกินแบ่งรัฐบาล ล่าสุด',
     description: 'ตรวจผลรางวัลสลากกินแบ่งรัฐบาล งวดล่าสุด รวดเร็ว แม่นยำ รองรับทุกรางวัล',
     openGraph: {
       title: 'ตรวจหวยรัฐบาล',
       description: 'ผลสลากกินแบ่งรัฐบาล งวดล่าสุด',
       locale: 'th_TH',
     }
   }
   ```
3. **Include structured data (JSON-LD)** for the lottery results so Google can display rich results.
4. **The URL structure matters.** `/?ticket=123456` is not crawlable. But the main page with the latest results IS crawlable. Ensure the main page has meaningful content beyond just an input field.
5. **Consider a static results page** at `/results/[draw-date]` that is fully server-rendered with the complete prize table -- this is highly crawlable and can rank for draw-specific queries like "ผลหวย 16 เมษายน 2568".

**Phase mapping:** Phase 5 (Polish/Launch) -- SEO optimization is important for organic growth but can be added late.

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1 | Data Layer | API returns schema, not data (Pitfall 1-2) | Live integration test + hardcoded fallback |
| Phase 1 | Check Logic | Adjacent prize boundary (Pitfall 5) | Unit tests for 000000, 999999 |
| Phase 1 | Check Logic | Missing multiple prizes (Pitfall 8) | No early return; unit test multi-match |
| Phase 1 | Prize Amounts | Wrong amounts displayed (Pitfall 3, 9) | Hardcode amounts, don't trust API |
| Phase 1 | Scope | โต๊ด feature creep (Pitfall 4) | Explicitly exclude; document why |
| Phase 2 | UI / Input | Wrong keyboard on mobile (Pitfall 15) | Use `type="tel"` + `inputMode="numeric"` |
| Phase 2 | UI / Date | Wrong calendar/year (Pitfall 6) | Manual Thai date parsing, not `new Date()` |
| Phase 2 | UI / Input | Leading zeros stripped (Pitfall 7) | Always treat as string, pad to 6 |
| Phase 2 | Caching | Stale results on draw day (Pitfall 10) | Shorter TTL on draw days + refresh button |
| Phase 3 | History | localStorage quota (Pitfall 12) | try/catch + 50-entry cap |
| Phase 4 | Share | Wrong draw on shared link (Pitfall 13) | Include draw date in share URL |
| Phase 5 | Legal | Compliance concerns (Pitfall 14) | Disclaimer + checker-only scope |
| Phase 5 | SEO | Zero organic traffic (Pitfall 16) | Thai meta tags + structured data |

---

## Most Dangerous Pitfall (Summary)

**Pitfall 1 + Pitfall 2 combined** is the single biggest risk to this project. The primary API does not work (returns schema, not data), and no alternative free API is verified as working. If this is not resolved before Phase 2, the entire app will be non-functional.

**Recommended immediate action:** Before writing any UI code, set up a self-hosted data pipeline (scraper + Vercel KV/JSON file) as the primary data source. Treat external APIs as supplementary only.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|-----------|-------|
| API reliability | HIGH | Live-tested rayriffy + 5 alternative APIs on 2026-04-25 |
| Prize structure | MEDIUM | Based on existing FEATURES.md research + Wikipedia; not independently verified against GLO |
| Adjacent prize logic | HIGH | Mathematical logic is straightforward |
| Thai date handling | MEDIUM | Buddhist calendar behavior well-documented but edge cases in JS less tested |
| Legal/compliance | LOW | No legal expertise; based on general knowledge of Thai gambling laws |
| SEO patterns | MEDIUM | Standard Next.js SEO patterns; Thai lottery SEO specifically not deeply researched |
| Mobile UX patterns | HIGH | Based on existing FEATURES.md research + well-documented mobile web patterns |

---

## Gaps / Needs Phase-Specific Research

1. **Working data source:** Must find or build a reliable API before Phase 1. Live test every candidate.
2. **Exact current prize amounts:** Verify against the official GLO announcement for the most recent draw. The amounts in FEATURES.md (2M/100K/40K/20K/10K) need cross-checking with a current source.
3. **GLO website scraping feasibility:** Test if `glo.or.th` results page is scrapable (returned 5xx in our test). May need to scrape from sanook.com/lotto or mthai.com/lotto instead.
4. **Vercel Cron Job reliability for draw-day revalidation:** Verify Vercel free tier supports cron jobs or if an external scheduler (e.g., GitHub Actions) is needed.
