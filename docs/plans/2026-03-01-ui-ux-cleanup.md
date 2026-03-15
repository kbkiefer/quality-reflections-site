# UI/UX Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 22 UI/UX issues (4 critical bugs, 10 moderate UX improvements, 8 polish items) across the Quality Reflections website.

**Architecture:** Surgical fixes only — no restructuring, no new components, no refactoring. Each fix targets specific lines in existing files.

**Tech Stack:** Astro 5.x, Tailwind 4, vanilla JS, CSS custom properties

**Baseline commit:** `9a76cae` on `main`

---

### Task 1: Fix global.css — border-radius, font import, scroll tracker, bento grid

**Files:**
- Modify: `src/styles/global.css`

**Step 1: Add Inter 300 import (Fix 5)**

After line 7 (`@import "@fontsource/inter/400.css";`), add:
```css
@import "@fontsource/inter/300.css";
```

**Step 2: Add scroll-tracker-dot border-radius exception (Fix 1)**

After line 52 (closing `}` of the `*` reset), add:
```css
.scroll-tracker-dot {
  border-radius: 50% !important;
}
```

**Step 3: Fix scroll tracker pointer-events (Fix 22)**

In the `.scroll-tracker` rule (line 381), change:
```css
pointer-events: none;
```
to:
```css
pointer-events: auto;
```

**Step 4: Fix scroll tracker dot active state — no size change (Fix 8)**

Replace `.scroll-tracker-dot.active` (lines 430-436):
```css
.scroll-tracker-dot.active {
  width: 8px;
  height: 8px;
  border-color: var(--color-glass-blue);
  background: var(--color-glass-blue);
  box-shadow: 0 0 6px rgba(74, 144, 217, 0.4);
}
```
with:
```css
.scroll-tracker-dot.active {
  border-color: var(--color-glass-blue);
  background: var(--color-glass-blue);
  box-shadow: 0 0 8px rgba(74, 144, 217, 0.5), 0 0 2px rgba(74, 144, 217, 0.8);
}
```

**Step 5: Fix bento featured card at tablet (Fix 18)**

In the `@media (max-width: 1024px)` block (lines 946-950), add the featured override:
```css
@media (max-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .bento-grid .bento-item.featured {
    grid-column: span 2;
    grid-row: span 1;
  }
}
```

**Step 6: Build and verify**

Run: `npm run build`
Expected: Clean build, no errors.

**Step 7: Commit**

```bash
git add src/styles/global.css
git commit -m "fix: global.css — border-radius exception, inter 300, tracker dots, bento tablet"
```

---

### Task 2: Fix index.astro — cursor crosshairs, card glow performance

**Files:**
- Modify: `src/pages/index.astro`

**Step 1: Fix cursor crosshair class mismatch (Fix 3)**

Replace lines 27-32:
```html
<div id="cursor-overlay">
  <div class="cursor-grid"></div>
  <div class="cursor-glow"></div>
  <div class="cursor-crosshair-h"></div>
  <div class="cursor-crosshair-v"></div>
</div>
```
with:
```html
<div id="cursor-overlay">
  <div class="cursor-grid"></div>
  <div class="cursor-glow"></div>
  <div class="cursor-crosshairs"></div>
</div>
```

**Step 2: Cache card-glow querySelectorAll (Fix 4)**

Replace lines 67-78:
```js
// ─── 2. Card Hover Glow ───
if (!isTouch) {
  document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.card-glow-bg');
    cards.forEach((card) => {
      const rect = (card as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      (card as HTMLElement).style.setProperty('--card-x', x + 'px');
      (card as HTMLElement).style.setProperty('--card-y', y + 'px');
    });
  }, { passive: true });
```
with:
```js
// ─── 2. Card Hover Glow ───
if (!isTouch) {
  const glowCards = document.querySelectorAll('.card-glow-bg');
  document.addEventListener('mousemove', (e) => {
    glowCards.forEach((card) => {
      const rect = (card as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      (card as HTMLElement).style.setProperty('--card-x', x + 'px');
      (card as HTMLElement).style.setProperty('--card-y', y + 'px');
    });
  }, { passive: true });
```

**Step 3: Build and verify**

Run: `npm run build`
Expected: Clean build.

**Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "fix: index.astro — crosshair class match, cache card glow query"
```

---

### Task 3: Fix ScrollTracker — hero target

**Files:**
- Modify: `src/components/ui/ScrollTracker.astro`

**Step 1: Fix hero querySelector (Fix 2)**

On line 74, change:
```js
const hero = document.querySelector('#hero') || document.querySelector('section:first-of-type');
```
to:
```js
const hero = document.querySelector('#hero-scroll-spacer') || document.querySelector('#hero-section');
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: Clean build.

**Step 3: Commit**

```bash
git add src/components/ui/ScrollTracker.astro
git commit -m "fix: scroll tracker targets correct hero element"
```

---

### Task 4: Fix HeroSection — font weight, text contrast

**Files:**
- Modify: `src/components/HeroSection.astro`

**Step 1: Bump steel text color for WCAG AA (Fix 15)**

On line 65, change `text-[#8A919A]` to `text-[#A0A7B0]`:
```html
<p class="text-base sm:text-lg text-[#A0A7B0] max-w-2xl leading-relaxed mb-10 font-light">
```

On line 80, change `text-[#8A919A]` to `text-[#A0A7B0]`:
```html
class="btn-blueprint px-8 py-4 border border-[rgba(138,145,154,0.3)] text-[#A0A7B0] font-medium text-sm tracking-wider"
```

On lines 96, 104, 112, 120, change `text-[#8A919A]` to `text-[#A0A7B0]`:
```html
<div class="font-mono text-[10px] uppercase tracking-widest text-[#A0A7B0]">Years</div>
```
(repeat for Projects, Systems, Compliant)

**Step 2: Build and verify**

Run: `npm run build`
Expected: Clean build.

**Step 3: Commit**

```bash
git add src/components/HeroSection.astro
git commit -m "fix: hero section text contrast bumped to WCAG AA"
```

---

### Task 5: Fix ProjectsSection — dead links, mobile affordance

**Files:**
- Modify: `src/components/ProjectsSection.astro`

**Step 1: Remove all 5 "View Details" dead links (Fix 9)**

Remove the `<a>` blocks at lines 75-80, 107-113, 139-145, 171-177, 203-209. Each block is:
```html
            <a href="#" class="inline-flex items-center gap-2 font-mono text-xs text-[#4A90D9] uppercase tracking-wider hover:text-white transition-colors">
              <span>View Details</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="square" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
```
Delete all 5 occurrences.

**Step 2: Add mobile scroll affordance (Fix 6)**

After the gallery `</div>` (after line 213), before the section-cut, add:
```html
    <!-- Mobile scroll hint -->
    <div class="flex sm:hidden items-center justify-center gap-2 mt-6">
      <span class="font-mono text-[10px] uppercase tracking-widest text-[#A0A7B0]">Swipe to explore</span>
      <svg class="w-4 h-4 text-[#4A90D9]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="square" stroke-width="1.5" d="M9 5l7 7-7 7" />
      </svg>
    </div>
```

**Step 3: Build and verify**

Run: `npm run build`
Expected: Clean build.

**Step 4: Commit**

```bash
git add src/components/ProjectsSection.astro
git commit -m "fix: remove dead project links, add mobile scroll hint"
```

---

### Task 6: Normalize section header spacing (Fix 7)

**Files:**
- Modify: `src/components/ServicesSection.astro` (line 13)
- Modify: `src/components/PlatformsSection.astro` (line 13)
- Modify: `src/components/CertificationsSection.astro` (line 13)
- Modify: `src/components/TestimonialsSection.astro` (line 43)

**Step 1: Normalize all to mb-14**

ServicesSection line 13: change `mb-12` to `mb-14`
PlatformsSection line 13: change `mb-16` to `mb-14`
CertificationsSection line 13: change `mb-16` to `mb-14`
TestimonialsSection line 43: change `mb-12` to `mb-14`

**Step 2: Build and verify**

Run: `npm run build`
Expected: Clean build.

**Step 3: Commit**

```bash
git add src/components/ServicesSection.astro src/components/PlatformsSection.astro src/components/CertificationsSection.astro src/components/TestimonialsSection.astro
git commit -m "fix: normalize section header spacing to mb-14"
```

---

### Task 7: Fix Header — mobile brand name, menu close UX

**Files:**
- Modify: `src/components/Header.astro`

**Step 1: Show brand name on mobile (Fix 20)**

On line 23, change:
```html
<span class="font-mono text-xs font-semibold tracking-[0.2em] text-white uppercase hidden sm:inline">
  Quality Reflections
</span>
```
to:
```html
<span class="font-mono text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-white uppercase">
  Quality Reflections
</span>
```

**Step 2: Add hamburger-to-X transition and close UX (Fix 11)**

Replace the hamburger button (lines 40-49):
```html
<button
  id="mobileMenuBtn"
  class="lg:hidden flex items-center justify-center w-10 h-10 border border-[rgba(74,144,217,0.2)] text-[#4A90D9]"
  aria-label="Toggle navigation menu"
  aria-expanded="false"
>
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path stroke-linecap="square" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
</button>
```
with:
```html
<button
  id="mobileMenuBtn"
  class="lg:hidden flex items-center justify-center w-10 h-10 border border-[rgba(74,144,217,0.2)] text-[#4A90D9]"
  aria-label="Toggle navigation menu"
  aria-expanded="false"
>
  <svg id="menuIconOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path stroke-linecap="square" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
  <svg id="menuIconClose" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path stroke-linecap="square" stroke-width="1.5" d="M6 6l12 12M6 18L18 6" />
  </svg>
</button>
```

**Step 3: Add backdrop div after the mobile menu**

After the `mobileMenu` nav div, add:
```html
<div id="menuBackdrop" class="fixed inset-0 bg-black/30 z-30 hidden lg:hidden" aria-hidden="true"></div>
```

**Step 4: Replace mobile menu script (lines 67-95)**

Replace the entire `<script>` block with:
```html
<script>
  const menuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const iconOpen = document.getElementById('menuIconOpen');
  const iconClose = document.getElementById('menuIconClose');
  const backdrop = document.getElementById('menuBackdrop');

  function toggleMenu(open?: boolean) {
    if (!menuBtn || !mobileMenu || !iconOpen || !iconClose || !backdrop) return;
    const isOpen = open ?? mobileMenu.classList.contains('hidden');
    if (isOpen) {
      mobileMenu.classList.remove('hidden');
      backdrop.classList.remove('hidden');
      iconOpen.classList.add('hidden');
      iconClose.classList.remove('hidden');
      menuBtn.setAttribute('aria-expanded', 'true');
    } else {
      mobileMenu.classList.add('hidden');
      backdrop.classList.add('hidden');
      iconOpen.classList.remove('hidden');
      iconClose.classList.add('hidden');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  }

  menuBtn?.addEventListener('click', () => toggleMenu());
  backdrop?.addEventListener('click', () => toggleMenu(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu && !mobileMenu.classList.contains('hidden')) {
      toggleMenu(false);
    }
  });

  // Close on nav link click
  mobileMenu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  // Header scroll darkening
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.backgroundColor = window.scrollY > 50
        ? 'rgba(1, 14, 47, 0.95)'
        : 'rgba(1, 14, 47, 0.8)';
    }, { passive: true });
  }
</script>
```

**Step 5: Build and verify**

Run: `npm run build`
Expected: Clean build.

**Step 6: Commit**

```bash
git add src/components/Header.astro
git commit -m "fix: mobile brand name visible, menu X icon, backdrop close, escape key"
```

---

### Task 8: Fix PartnershipSection — visible heading, grid-coord

**Files:**
- Modify: `src/components/PartnershipSection.astro`

**Step 1: Add section header above the card (Fix 14 + Fix 10)**

After the opening `<div class="max-w-4xl...">` (line 10) and before the main card (line 13), add:
```html
    <!-- Section Header -->
    <div class="mb-12 scroll-reveal">
      <div class="flex items-center gap-3 mb-4">
        <span class="grid-coord text-xs">F1</span>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Partnership</h2>
      </div>
    </div>
```

Then change the `<h2>` inside the card (line 36-38) to an `<h3>`:
```html
<h3 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
  Kawneer Authorized Dealer
</h3>
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: Clean build.

**Step 3: Commit**

```bash
git add src/components/PartnershipSection.astro
git commit -m "fix: partnership section visible heading with grid-coord F1"
```

---

### Task 9: Fix CertificationsSection — grid-coord positioning

**Files:**
- Modify: `src/components/CertificationsSection.astro`

**Step 1: Change absolute grid-coords to inline flex (Fix 13)**

For each of the 5 certification cards, change the grid-coord from absolute positioned to an inline flex row. Replace the pattern:
```html
<span class="grid-coord text-xs absolute top-3 left-3">G2.1</span>
<!-- Logo Area -->
<div class="w-16 h-16 mx-auto mb-3 border ... mt-4">
```
with:
```html
<div class="flex items-center justify-center gap-2 mb-3">
  <span class="grid-coord text-xs">G2.1</span>
</div>
<div class="w-16 h-16 mx-auto mb-3 border ...">
```

Remove `mt-4` from the logo div and remove `relative` from the parent card `<div>` if it was only there for the absolute positioning (check — if other children need it, keep it).

Apply to all 5 cards at lines 34, 49, 63, 77, 91.

**Step 2: Build and verify**

Run: `npm run build`
Expected: Clean build.

**Step 3: Commit**

```bash
git add src/components/CertificationsSection.astro
git commit -m "fix: certifications grid-coord inline flex instead of absolute"
```

---

### Task 10: Fix ContactSection — remove metadata, add section-cut

**Files:**
- Modify: `src/components/ContactSection.astro`

**Step 1: Remove Drawing/Rev/Date rows from title block (Fix 16)**

Delete lines 91-102 (the Drawing, Rev, and Date `tb-row` blocks).

**Step 2: Add section-cut at bottom (Fix 19)**

Before the closing `</section>` tag, add:
```html
  <!-- Section Cut -->
  <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
    <div class="section-cut" data-cut>
      <div class="cut-line"></div>
      <span class="cut-label">Section H-H</span>
    </div>
  </div>
```

**Step 3: Build and verify**

Run: `npm run build`
Expected: Clean build.

**Step 4: Commit**

```bash
git add src/components/ContactSection.astro
git commit -m "fix: remove drawing metadata from contact, add section-cut"
```

---

### Task 11: Fix Footer — grid-coord sizing, letter sequence

**Files:**
- Modify: `src/components/Footer.astro`

**Step 1: Remove grid-coord inline size overrides (Fix 17)**

On lines 20, 36, 51, change:
```html
<span class="grid-coord text-xs w-[22px] h-[22px] text-[9px]">F1</span>
```
to:
```html
<span class="grid-coord text-xs">I1</span>
```

(Also change F2→I2 and F3→I3 for the grid-coord letter fix — Fix 10)

**Step 2: Build and verify**

Run: `npm run build`
Expected: Clean build.

**Step 3: Commit**

```bash
git add src/components/Footer.astro
git commit -m "fix: footer grid-coord standard sizing, letter sequence I"
```

---

### Task 12: Fix section-cut label alignment (Fix 21)

**Files:**
- Modify: `src/components/HeroSection.astro`
- Modify: `src/components/ServicesSection.astro`
- Modify: `src/components/ProjectsSection.astro`
- Modify: `src/components/PlatformsSection.astro`
- Modify: `src/components/PartnershipSection.astro`
- Modify: `src/components/CertificationsSection.astro`
- Modify: `src/components/TestimonialsSection.astro`
- Modify: `src/components/ContactSection.astro`

**Step 1: Align section-cut labels to grid-coord letters**

| Section | Grid-coord | Section-cut label |
|---------|-----------|-------------------|
| Hero | B | Section B-B |
| Services | C | Section C-C |
| Projects | D | Section D-D |
| Platforms | E | Section E-E |
| Partnership | F | Section F-F |
| Certifications | G | Section G-G |
| Testimonials | H | Section H-H |
| Contact | (new) | Section I-I |

Current state: Hero=A-A, Services=B-B, Projects=C-C, Platforms=D-D, Partnership=E-E, Certifications=F-F, Testimonials=G-G, Contact=none.

Change: Hero A-A→B-B, Services B-B→C-C, Projects C-C→D-D, Platforms D-D→E-E, Partnership E-E→F-F, Certifications F-F→G-G, Testimonials G-G→H-H. Contact already set to H-H in Task 10 — change to I-I.

**Step 2: Build and verify**

Run: `npm run build`
Expected: Clean build.

**Step 3: Commit**

```bash
git add src/components/*.astro
git commit -m "fix: section-cut labels aligned to grid-coord letter sequence"
```

---

### Task 13: Final build + push

**Step 1: Full build**

Run: `npm run build`
Expected: Clean build, no errors or warnings.

**Step 2: Push**

```bash
git push origin main
```
