---
phase: quick/260425-gms-fix-input-typing
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/CheckForm.tsx
autonomous: true
requirements: [GMS-FIX-INPUT]

must_haves:
  truths:
    - "Input field shows a visible focus ring (green) when tapped/clicked"
    - "User can type digits into the input"
    - "Submit button is visually styled (green gradient, not invisible)"
    - "Shake animation still fires on invalid submit"
  artifacts:
    - path: "src/components/CheckForm.tsx"
      provides: "Input + button with valid Tailwind CSS 4 token references"
      contains: "lottery-green"
  key_links:
    - from: "CheckForm.tsx input className"
      to: "--color-lottery-green token in globals.css"
      via: "focus:border-lottery-green"
      pattern: "lottery-green"
---

<objective>
Fix unresponsive input in the lottery checker by replacing removed `gold` CSS tokens with the
correct `lottery-green` and `lottery-red` tokens that are actually defined in globals.css `@theme`.

Purpose: In Tailwind CSS 4, unknown utility tokens (`border-gold`, `shadow-gold-glow`, etc.) are
silently dropped — they produce zero CSS output. The input's `focus:border-gold` generates no
focus ring, making the field appear frozen/unresponsive to users. The button's gradient classes
also produce no visible style when disabled=false, so the CTA is invisible as a clickable element.

Output: CheckForm.tsx with all gold references replaced by lottery-green equivalents. Dev server
restart to pick up the clean CSS bundle.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/home/deploy-app/poc-lottery-online/.planning/PROJECT.md

<interfaces>
<!-- Tokens defined in src/app/globals.css @theme — use ONLY these -->

Defined tokens (safe to use in Tailwind utilities):
  --color-lottery-green       → text-lottery-green, border-lottery-green, bg-lottery-green
  --color-lottery-green-dark  → bg-lottery-green-dark
  --color-lottery-green-light → bg-lottery-green-light
  --color-lottery-red         → text-lottery-red, border-lottery-red
  --color-win                 → (alias for lottery-green)
  --color-win-bg              → bg-win-bg
  --color-error               → border-error (already used in CheckForm — valid)
  --color-surface             → bg-surface
  --color-border              → border-border (already used — valid)
  --color-text                → text-text (already used — valid)
  --color-text-muted          → text-text-muted (already used — valid)
  --shadow-card               → shadow-card (already used — valid)
  --shadow-card-lg            → shadow-card-lg

NOT defined (will produce zero CSS in Tailwind CSS 4):
  gold, gold-dark, gold-light, shadow-gold-glow  ← REMOVE ALL REFERENCES
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace gold tokens with lottery-green in CheckForm.tsx</name>
  <files>src/components/CheckForm.tsx</files>
  <action>
Replace every reference to removed gold tokens in CheckForm.tsx className strings.

Exact replacements:

INPUT className (lines 65-73):
- `focus:border-gold` → `focus:border-lottery-green`
- `focus-visible:ring-gold/30` → `focus-visible:ring-lottery-green/30`

BUTTON className (lines 79-88):
- `bg-gradient-to-r from-gold-dark via-gold to-gold-light shadow-gold-glow hover:brightness-105 active:brightness-95 hover:shadow-lg`
  → `bg-lottery-green hover:bg-lottery-green-dark shadow-card-lg hover:shadow-lg`
- `bg-gradient-to-r from-gold-dark via-gold to-gold-light opacity-40 cursor-not-allowed`
  → `bg-lottery-green opacity-40 cursor-not-allowed`
- `focus-visible:ring-gold/50` → `focus-visible:ring-lottery-green/50`

Do NOT change: border-border, border-error, text-text, placeholder:text-text-muted, shadow-card —
these are all valid defined tokens and work correctly.

After editing CheckForm.tsx, restart the Next.js dev server to force a clean CSS rebuild:
  pkill -f "next dev" || true
  cd /home/deploy-app/poc-lottery-online && nohup npm run dev > /tmp/lottery-dev.log 2>&1 &
Wait 5 seconds, then verify the server is running:
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
  </action>
  <verify>
    <automated>grep -c "lottery-green" /home/deploy-app/poc-lottery-online/src/components/CheckForm.tsx && ! grep -q "border-gold\|from-gold\|via-gold\|to-gold\|shadow-gold" /home/deploy-app/poc-lottery-online/src/components/CheckForm.tsx && echo "CLEAN: no gold tokens remain"</automated>
  </verify>
  <done>
- CheckForm.tsx contains no references to gold, gold-dark, gold-light, or shadow-gold-glow
- Input has focus:border-lottery-green (generates visible green focus ring on tap)
- Button has bg-lottery-green (visible green CTA)
- Dev server restarted and responds 200 on localhost:3000
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| remote browser → localhost:3000 | User accesses dev server via 49.13.51.154; allowedDevOrigins already set |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-gms-01 | Tampering | ticket input (tel field) | accept | Input strips non-digits via replace(/\D/g,'') — XSS surface is nil for this numeric-only field |
| T-gms-02 | Information Disclosure | dev server on public IP | accept | Dev-only exposure; production will use proper deployment. allowedDevOrigins limits CORS surface. |
</threat_model>

<verification>
1. Open http://49.13.51.154:3000 in browser
2. Tap the 6-digit input field — should show green border focus ring
3. Type numbers — digits should appear in the field
4. Enter 6 digits — green submit button becomes active
5. Submit — result panel renders
</verification>

<success_criteria>
- Input field accepts typed digits (visible green focus ring confirms React hydration + CSS token resolution)
- Button is visually green (not invisible/unstyled)
- No gold-* token warnings in Next.js dev output
</success_criteria>

<output>
After completion, create `/home/deploy-app/poc-lottery-online/.planning/quick/260425-gms-fix-input-typing/260425-gms-01-SUMMARY.md`
</output>
