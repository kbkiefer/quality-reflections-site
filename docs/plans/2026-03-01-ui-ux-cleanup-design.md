# UI/UX Cleanup Design — Quality Reflections Glasswork

**Date:** 2026-03-01
**Approach:** Surgical fixes (Approach A) — 22 targeted fixes across ~10 files, no restructuring
**Baseline commit:** `9a76cae` on `main`

---

## Section 1: Critical Bug Fixes

### Fix 1 — Scroll tracker dots render as squares
**File:** `src/styles/global.css`
**Problem:** Global `* { border-radius: 0 !important }` overrides `.scroll-tracker-dot { border-radius: 50% }`.
**Fix:** Add `.scroll-tracker-dot { border-radius: 50% !important }` after the global reset.

### Fix 2 — ScrollTracker targets wrong element
**File:** `src/components/ui/ScrollTracker.astro` line 74
**Problem:** `querySelector('#hero')` finds nothing — actual ID is `#hero-section` inside `#hero-scroll-spacer`.
**Fix:** Change to `querySelector('#hero-scroll-spacer')`.

### Fix 3 — Cursor crosshair class mismatch
**File:** `src/pages/index.astro` lines 28-32
**Problem:** HTML creates `.cursor-crosshair-h` and `.cursor-crosshair-v` but CSS targets `.cursor-crosshairs` with `::before`/`::after`.
**Fix:** Restructure to use a single `.cursor-crosshairs` div matching the CSS.

### Fix 4 — Card glow querySelectorAll on every mousemove
**File:** `src/pages/index.astro` lines 68-78
**Problem:** `querySelectorAll('.card-glow-bg')` runs inside mousemove handler — 60x/sec DOM query.
**Fix:** Cache the query result in a variable outside the handler.

---

## Section 2: Moderate UX Improvements

### Fix 5 — Import Inter 300 for font-light
**File:** `src/styles/global.css`
**Problem:** Hero subtext uses `font-light` (300) but only 400-800 are imported.
**Fix:** Add Inter 300 import.

### Fix 6 — Mobile projects gallery scroll affordance
**File:** `src/components/ProjectsSection.astro`
**Problem:** Scroll arrows hidden below 640px. No indication gallery scrolls on mobile.
**Fix:** Add "Swipe to explore" hint text + scroll indicator on mobile.

### Fix 7 — Consistent section header spacing
**Files:** ServicesSection, PlatformsSection, CertificationsSection, TestimonialsSection
**Problem:** mb-12 vs mb-16 inconsistency across section headers.
**Fix:** Normalize all to mb-14.

### Fix 8 — Scroll tracker dot size jitter
**File:** `src/styles/global.css`
**Problem:** Active dot changes 6px→8px causing layout shift.
**Fix:** Keep all dots 6px, use box-shadow + opacity for active state instead of size change.

### Fix 9 — Remove dead "View Details" links
**File:** `src/components/ProjectsSection.astro`
**Problem:** Five "View Details" links with hover styles and arrow icons all go to `href="#"`.
**Fix:** Remove the link elements entirely. Keep the card content.

### Fix 10 — Fix grid-coord letter sequence
**Files:** PartnershipSection, CertificationsSection, Footer
**Problem:** Partnership has no grid-coord, Certifications skips F→G, Footer reuses F.
**Fix:** Partnership = F, Certifications = G (stays), Footer = I.

### Fix 11 — Mobile menu close UX
**File:** `src/components/Header.astro`
**Problem:** No X icon when open, no click-outside dismiss, no Escape key.
**Fix:** Add hamburger→X transition, backdrop click dismiss, Escape listener.

### Fix 12 — Cache card-glow querySelectorAll (merged with Fix 4)
Already covered by Fix 4.

### Fix 13 — Certifications grid-coord positioning
**File:** `src/components/CertificationsSection.astro`
**Problem:** Uses `absolute top-3 left-3` + `mt-4` hack instead of inline flex.
**Fix:** Change to inline flex row like other sections.

### Fix 14 — Partnership section needs visible heading
**File:** `src/components/PartnershipSection.astro`
**Problem:** No section-level header visible in scroll flow — heading buried inside card.
**Fix:** Add grid-coord F1 + h2 header above the Kawneer card.

---

## Section 3: Polish & Minor Fixes

### Fix 15 — Steel text contrast below WCAG AA
**Files:** Multiple sections using `text-[#8A919A]` on dark backgrounds
**Problem:** ~3.8:1 contrast ratio, below WCAG AA 4.5:1 requirement.
**Fix:** Bump to `#A0A7B0` (~4.6:1) for body text on dark backgrounds.

### Fix 16 — Contact title block drawing metadata
**File:** `src/components/ContactSection.astro`
**Problem:** "Drawing", "Rev", "Date" rows mixed with real contact info.
**Fix:** Remove the three metadata rows. Keep Company, Phone, Email, Address only.

### Fix 17 — Footer grid-coord custom sizing
**File:** `src/components/Footer.astro`
**Problem:** Inline `w-[22px] h-[22px] text-[9px]` overrides standard `.grid-coord` sizing.
**Fix:** Remove inline overrides, use standard class.

### Fix 18 — Bento featured card at tablet
**File:** `src/styles/global.css`
**Problem:** Featured card spans full 2-column width at 768px-1024px, top-heavy layout.
**Fix:** Add md breakpoint to reduce featured span to 1 column at tablet.

### Fix 19 — No section-cut at bottom of Contact
**File:** `src/components/ContactSection.astro`
**Problem:** Every section has a section-cut except Contact. Breaks visual rhythm.
**Fix:** Add section-cut before footer.

### Fix 20 — Mobile header shows no company name
**File:** `src/components/Header.astro`
**Problem:** Brand text is `hidden sm:inline` — invisible on mobile. Only grid-coord badge visible.
**Fix:** Show company name on mobile at smaller size.

### Fix 21 — Section-cut label alignment
**Files:** All section components
**Problem:** Section-cut letters (A-A through G-G) don't correspond to grid-coord letters.
**Fix:** Renumber section cuts to match grid-coord sequence.

### Fix 22 — Scroll tracker pointer-events timing
**File:** `src/styles/global.css`
**Problem:** `pointer-events: none` in CSS creates brief non-interactive window on load.
**Fix:** Use `opacity: 0` for initial hidden state instead, keep pointer-events always enabled.
