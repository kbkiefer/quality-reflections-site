# Portfolio Project Pages Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the overlay-based project detail view with dedicated `/portfolio/[slug]` pages using a spec-sheet layout.

**Architecture:** Extract shared project data into a standalone module. Create a dynamic Astro page at `src/pages/portfolio/[slug].astro` using `getStaticPaths()`. Convert homepage project cards from `<button>` overlay triggers to `<a>` links. Remove all overlay code.

**Tech Stack:** Astro 5.5 static pages, Tailwind CSS, existing `astro:assets` image pipeline, existing i18n system.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/data/projects.ts` | Create | Shared project data + service label/desc maps (extracted from ProjectsSection) |
| `src/pages/portfolio/[slug].astro` | Create | Dynamic portfolio page — spec-sheet layout |
| `src/components/ProjectsSection.astro` | Modify | Cards → `<a>` links, remove overlay HTML/CSS/JS |
| `src/i18n/translations.ts` | Modify | Add portfolio page translation keys |

---

## Chunk 1: Extract Data & Build Portfolio Page

### Task 1: Extract project data into shared module

**Files:**
- Create: `src/data/projects.ts`
- Modify: `src/components/ProjectsSection.astro`

- [ ] **Step 1: Create `src/data/projects.ts`**

Extract the `projects` array, `SERVICE_LABELS`, and `SERVICE_DESCS` from `ProjectsSection.astro` into this new file. Also export the image imports.

```typescript
import officeTower from '../assets/images/project-office-tower.png';
import medicalCenter from '../assets/images/project-medical-center.png';
import university from '../assets/images/project-university.png';
import retailPavilion from '../assets/images/project-retail-pavilion.png';
import courthouse from '../assets/images/project-courthouse.png';

export const SERVICE_LABELS: Record<string, string> = {
  'curtain-wall': 'Curtain Wall',
  'storefront': 'Storefront',
  'window': 'Windows',
  'entrance': 'Entrances',
  'railing': 'Railings',
  'skylight': 'Skylights',
};

export const SERVICE_DESCS: Record<string, string> = {
  'curtain-wall': 'Non-structural exterior cladding system spanning multiple floors with unitized aluminum and glass panels.',
  'storefront': 'Ground-level glazing system framed between structural supports, designed for high-traffic commercial entrances.',
  'window': 'Punched openings with thermally broken aluminum frames, operable and fixed configurations.',
  'entrance': 'Balanced or automatic door assemblies with tempered glass panels and heavy-duty hardware.',
  'railing': 'Structural glass guardrails with stainless steel standoff fittings and laminated safety glass.',
  'skylight': 'Overhead glazing systems engineered for snow loads, thermal performance, and water management.',
};

export interface Project {
  id: string;
  slug: string;
  image: ImageMetadata;
  alt: string;
  coord: string;
  category: string;
  title: string;
  desc: string;
  location: string;
  year: string;
  sqft: string;
  services: string[];
  delay: string;
}

export const projects: Project[] = [
  {
    id: 'office-tower', slug: 'office-tower', image: officeTower,
    alt: 'Metropolitan Office Tower - 32-story curtain wall glazing system',
    coord: 'D2', category: 'Commercial', title: 'Metropolitan Office Tower',
    desc: 'Full curtain wall system, 32 floors of unitized glass and aluminum panels with integrated sunshades.',
    location: 'San Antonio, TX', year: '2023', sqft: '48,000 sq ft glazing',
    services: ['curtain-wall', 'window', 'entrance'], delay: '0',
  },
  {
    id: 'medical-center', slug: 'medical-center', image: medicalCenter,
    alt: 'Regional Medical Center - blast-resistant storefront and curtain wall systems',
    coord: 'D3', category: 'Healthcare', title: 'Regional Medical Center',
    desc: 'Storefront and curtain wall systems with blast-resistant glazing and hurricane-rated assemblies.',
    location: 'Laredo, TX', year: '2022', sqft: '22,000 sq ft glazing',
    services: ['curtain-wall', 'storefront', 'window'], delay: '100',
  },
  {
    id: 'university', slug: 'university', image: university,
    alt: 'University Science Complex - skylights and specialized lab-grade glazing',
    coord: 'D4', category: 'Education', title: 'University Science Complex',
    desc: 'Skylights, curtain wall, and specialized lab-grade glazing with integrated ventilation louvers.',
    location: 'College Station, TX', year: '2023', sqft: '31,000 sq ft glazing',
    services: ['skylight', 'curtain-wall', 'window'], delay: '200',
  },
  {
    id: 'retail-pavilion', slug: 'retail-pavilion', image: retailPavilion,
    alt: 'Luxury Retail Pavilion - structural silicone glazing and frameless entrance',
    coord: 'D5', category: 'Retail', title: 'Luxury Retail Pavilion',
    desc: 'All-glass storefront with structural silicone glazing and frameless glass entrance system.',
    location: 'McAllen, TX', year: '2024', sqft: '8,500 sq ft glazing',
    services: ['storefront', 'entrance', 'railing'], delay: '300',
  },
  {
    id: 'courthouse', slug: 'courthouse', image: courthouse,
    alt: 'Federal Courthouse - impact-resistant glazing with custom mullion profiles',
    coord: 'D6', category: 'Civic', title: 'Federal Courthouse',
    desc: 'Impact-resistant glazing with custom mullion profiles and blast-mitigation film assemblies.',
    location: 'Corpus Christi, TX', year: '2024', sqft: '36,000 sq ft glazing',
    services: ['curtain-wall', 'window', 'entrance'], delay: '400',
  },
];
```

- [ ] **Step 2: Update ProjectsSection.astro imports**

Replace inline data with imports from the shared module:

```astro
---
import { Image } from 'astro:assets';
import { projects, SERVICE_LABELS } from '../data/projects';
---
```

Remove the old `import` lines for images, the `SERVICE_LABELS`, `SERVICE_DESCS` constants, and the `projects` array from the frontmatter.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds, no import errors.

- [ ] **Step 4: Commit**

```bash
git add src/data/projects.ts src/components/ProjectsSection.astro
git commit -m "extract project data into shared module"
```

---

### Task 2: Create portfolio page

**Files:**
- Create: `src/pages/portfolio/[slug].astro`

- [ ] **Step 1: Create the dynamic page**

```astro
---
import Layout from '../../layouts/Layout.astro';
import Header from '../../components/Header.astro';
import Footer from '../../components/Footer.astro';
import { Image } from 'astro:assets';
import { projects, SERVICE_LABELS, SERVICE_DESCS } from '../../data/projects';

export function getStaticPaths() {
  return projects.map((p) => ({
    params: { slug: p.slug },
    props: { project: p },
  }));
}

const { project } = Astro.props;
const p = project;

// Prev/next navigation
const idx = projects.findIndex((pr) => pr.slug === p.slug);
const prev = idx > 0 ? projects[idx - 1] : null;
const next = idx < projects.length - 1 ? projects[idx + 1] : null;
---

<Layout title={`${p.title} | Quality Reflections Glasswork`}>
  <Header />

  <section class="relative bg-[#010E2F] pt-20">

    <!-- Back link -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <a href="/#projects" class="inline-flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-[#4A90D9] hover:text-white transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path d="M15 19l-7-7 7-7" /></svg>
        <span data-i18n="portfolio.backToProjects">Back to Projects</span>
      </a>
    </div>

    <!-- Hero Image -->
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="relative overflow-hidden border border-[rgba(74,144,217,0.15)]">
        <Image
          src={p.image}
          alt={p.alt}
          width={1280}
          height={600}
          class="w-full h-[250px] sm:h-[400px] lg:h-[500px] object-cover"
        />
        <div class="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#010E2F] to-transparent pointer-events-none"></div>
      </div>
    </div>

    <!-- Project Header -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
      <div class="flex items-center gap-2 mb-2">
        <span class="grid-coord text-sm">{p.coord}</span>
        <span class="font-mono text-sm uppercase tracking-widest text-[#4A90D9]">{p.category}</span>
      </div>
      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">{p.title}</h1>
      <p class="text-[#A0A7B0] text-lg sm:text-xl leading-relaxed max-w-3xl mb-8">{p.desc}</p>
    </div>

    <!-- Specs Grid -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Location', value: p.location, i18n: 'portfolio.spec.location' },
          { label: 'Year', value: p.year, i18n: 'portfolio.spec.year' },
          { label: 'Scope', value: p.sqft, i18n: 'portfolio.spec.scope' },
          { label: 'Type', value: p.category, i18n: 'portfolio.spec.type' },
          { label: 'Duration', value: 'TBD', i18n: 'portfolio.spec.duration' },
          { label: 'Value', value: 'TBD', i18n: 'portfolio.spec.value' },
        ].map((spec) => (
          <div class="border border-[rgba(74,144,217,0.12)] bg-[rgba(1,42,137,0.06)] p-4">
            <div class="font-mono text-[11px] uppercase tracking-widest text-[#8A919A] mb-1" data-i18n={spec.i18n}>{spec.label}</div>
            <div class="text-white text-base sm:text-lg font-medium">{spec.value}</div>
          </div>
        ))}
      </div>
    </div>

    <!-- Systems Installed -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div class="flex items-center gap-3 mb-6">
        <div class="h-px flex-1 bg-[rgba(74,144,217,0.15)]"></div>
        <span class="font-mono text-sm uppercase tracking-widest text-[#4A90D9]" data-i18n="portfolio.systemsInstalled">Systems Installed</span>
        <div class="h-px flex-1 bg-[rgba(74,144,217,0.15)]"></div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {p.services.map((svc, svcIdx) => (
          <div class="border border-[rgba(74,144,217,0.15)] bg-[rgba(1,42,137,0.08)] hover:border-[rgba(74,144,217,0.35)] hover:bg-[rgba(1,42,137,0.15)] transition-all">
            {/* Placeholder image */}
            <div class="w-full aspect-[16/10] bg-[rgba(1,27,90,0.4)] border-b border-[rgba(74,144,217,0.1)] flex flex-col items-center justify-center gap-2 relative overflow-hidden">
              <div class="absolute inset-0">
                <div class="absolute top-1/2 left-0 right-0 h-px bg-[rgba(74,144,217,0.08)]"></div>
                <div class="absolute left-1/2 top-0 bottom-0 w-px bg-[rgba(74,144,217,0.08)]"></div>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.25)" stroke-width="1">
                <rect x="3" y="3" width="18" height="18" />
                <line x1="3" y1="3" x2="21" y2="21" />
                <line x1="21" y1="3" x2="3" y2="21" />
              </svg>
              <span class="font-mono text-sm text-[rgba(74,144,217,0.3)] uppercase tracking-widest relative z-10" data-i18n="portfolio.photoPlaceholder">Photo Placeholder</span>
            </div>
            {/* Service info */}
            <div class="p-4">
              <div class="flex items-center gap-2 mb-2">
                <span class="w-6 h-6 border border-[rgba(74,144,217,0.15)] bg-[rgba(1,42,137,0.1)] text-[#4A90D9] font-mono text-xs font-medium leading-6 text-center inline-block flex-shrink-0">
                  {p.coord.charAt(0)}{svcIdx + 1}
                </span>
                <span class="font-mono text-sm font-semibold text-white uppercase tracking-wider">
                  {SERVICE_LABELS[svc] || svc}
                </span>
              </div>
              <p class="text-sm text-[#8A919A] leading-relaxed">{SERVICE_DESCS[svc] || ''}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <!-- Photo Gallery Placeholders -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div class="flex items-center gap-3 mb-6">
        <div class="h-px flex-1 bg-[rgba(74,144,217,0.15)]"></div>
        <span class="font-mono text-sm uppercase tracking-widest text-[#4A90D9]" data-i18n="portfolio.gallery">Project Gallery</span>
        <div class="h-px flex-1 bg-[rgba(74,144,217,0.15)]"></div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div class="aspect-[4/3] border border-[rgba(74,144,217,0.12)] bg-[rgba(1,27,90,0.3)] flex flex-col items-center justify-center gap-2 relative overflow-hidden">
            <div class="absolute inset-0">
              <div class="absolute top-1/2 left-0 right-0 h-px bg-[rgba(74,144,217,0.06)]"></div>
              <div class="absolute left-1/2 top-0 bottom-0 w-px bg-[rgba(74,144,217,0.06)]"></div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.2)" stroke-width="1">
              <rect x="3" y="3" width="18" height="18" /><line x1="3" y1="3" x2="21" y2="21" /><line x1="21" y1="3" x2="3" y2="21" />
            </svg>
            <span class="font-mono text-xs text-[rgba(74,144,217,0.25)] uppercase tracking-widest">{p.coord}.{i + 1}</span>
          </div>
        ))}
      </div>
    </div>

    <!-- Prev/Next Navigation -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div class="flex items-center justify-between border-t border-[rgba(74,144,217,0.15)] pt-8">
        {prev ? (
          <a href={`/portfolio/${prev.slug}`} class="flex items-center gap-3 group">
            <svg class="w-5 h-5 text-[#4A90D9] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path d="M15 19l-7-7 7-7" /></svg>
            <div>
              <div class="font-mono text-[11px] uppercase tracking-widest text-[#8A919A]" data-i18n="portfolio.prev">Previous</div>
              <div class="text-white text-sm sm:text-base font-medium group-hover:text-[#4A90D9] transition-colors">{prev.title}</div>
            </div>
          </a>
        ) : <div />}
        {next ? (
          <a href={`/portfolio/${next.slug}`} class="flex items-center gap-3 text-right group">
            <div>
              <div class="font-mono text-[11px] uppercase tracking-widest text-[#8A919A]" data-i18n="portfolio.next">Next</div>
              <div class="text-white text-sm sm:text-base font-medium group-hover:text-[#4A90D9] transition-colors">{next.title}</div>
            </div>
            <svg class="w-5 h-5 text-[#4A90D9] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path d="M9 5l7 7-7 7" /></svg>
          </a>
        ) : <div />}
      </div>
    </div>

    <!-- Section Cut -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="section-cut" data-cut>
        <div class="cut-line"></div>
        <span class="cut-label">Detail {p.coord}</span>
      </div>
    </div>

  </section>

  <Footer />
</Layout>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds, 8 pages (3 existing + 5 portfolio).

- [ ] **Step 3: Commit**

```bash
git add src/pages/portfolio/
git commit -m "add portfolio project pages at /portfolio/[slug]"
```

---

### Task 3: Convert project cards to links and remove overlay

**Files:**
- Modify: `src/components/ProjectsSection.astro`

- [ ] **Step 1: Replace `<button>` cards with `<a>` links**

Change the card element from:
```html
<button class="..." data-project-open={idx} aria-label={`View ${p.title} project details`}>
```
to:
```html
<a href={`/portfolio/${p.id}`} class="..." aria-label={`View ${p.title} project details`}>
```

And close with `</a>` instead of `</button>`.

- [ ] **Step 2: Remove the entire overlay block**

Delete everything from `<!-- Full-screen Project Overlay -->` (line ~199) through the end of the file — the overlay HTML, `<style>` block, and both `<script>` blocks.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds. Clicking a project card navigates to `/portfolio/office-tower` etc.

- [ ] **Step 4: Commit**

```bash
git add src/components/ProjectsSection.astro
git commit -m "convert project cards to portfolio links, remove overlay"
```

---

### Task 4: Add i18n translation keys

**Files:**
- Modify: `src/i18n/translations.ts`

- [ ] **Step 1: Add portfolio page translations**

Add after the existing `projects.` keys:

```typescript
// === PORTFOLIO ===
'portfolio.backToProjects': { en: 'Back to Projects', es: 'Volver a Proyectos' },
'portfolio.spec.location': { en: 'Location', es: 'Ubicacion' },
'portfolio.spec.year': { en: 'Year', es: 'Año' },
'portfolio.spec.scope': { en: 'Scope', es: 'Alcance' },
'portfolio.spec.type': { en: 'Type', es: 'Tipo' },
'portfolio.spec.duration': { en: 'Duration', es: 'Duracion' },
'portfolio.spec.value': { en: 'Value', es: 'Valor' },
'portfolio.systemsInstalled': { en: 'Systems Installed', es: 'Sistemas Instalados' },
'portfolio.photoPlaceholder': { en: 'Photo Placeholder', es: 'Espacio para Foto' },
'portfolio.gallery': { en: 'Project Gallery', es: 'Galeria del Proyecto' },
'portfolio.prev': { en: 'Previous', es: 'Anterior' },
'portfolio.next': { en: 'Next', es: 'Siguiente' },
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/i18n/translations.ts
git commit -m "add portfolio page i18n translations"
```
