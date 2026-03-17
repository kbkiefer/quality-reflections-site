# CLAUDE.md — Quality Reflections Glasswork

## Project Overview

Commercial glazing contractor website for **Quality Reflections Glasswork** in Laredo, TX. Targets general contractors and construction project managers. Single-page site with scroll-based navigation and a premium blueprint/architectural aesthetic.

**Live:** Deployed via FTP using `deploy.sh`
**Repo:** https://github.com/kbkiefer/quality-reflections-site.git

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Astro 5.5.0 | Static-first, islands architecture, built-in image optimization |
| UI Islands | React 19 + `@astrojs/react` | Framer Motion patterns, interactive components |
| Animations | Framer Motion 12.6.0 | Spring physics for cursor, cubic-bezier for UI entrances |
| CSS | Tailwind 4.1.0 (build-time) | ~10KB compiled vs 113KB runtime CDN |
| Fonts | Inter + JetBrains Mono (`@fontsource`, self-hosted) | No Google Fonts dependency |
| Images | `astro:assets` | Auto WebP/AVIF, responsive srcset, lazy loading |
| Deploy | FTP via `deploy.sh` | Builds to `dist/`, uploads via curl |

## Commands

```bash
npm run dev          # Astro dev server (localhost:4321)
npm run build        # Production build → dist/
npm run preview      # Preview production build
bash deploy.sh       # FTP upload dist/ to hosting (requires .env)
```

## Design System

### Brand Colors (CSS custom properties in `src/styles/global.css`)
```
--navy:        #012A89    (primary)
--navy-dark:   #011B5A
--navy-black:  #010E2F    (hero/dark sections)
--glass-blue:  #4A90D9    (accent, interactive)
--steel:       #8A919A    (secondary text)
--silver:      #D1D5DB    (body text)
```

Light/dark theme support via `data-theme` attribute on `<html>`. Theme stored in `localStorage` key `qr-theme`.

### Design Direction
- **Construction-document aesthetic** — blueprint grids, crosshairs, grid coordinates, dimension lines, section cuts
- **No rounded corners** — `border-radius: 0` everywhere (exception: scroll tracker dots at 50%)
- No gradients on UI elements (only in glass reflection effects)
- Geometric, rectilinear, engineered
- Fonts: Inter (300–800) for body, JetBrains Mono (300–500) for technical labels/grid coords
- Blueprint grid backgrounds on dark sections

### Animation Convention — NO SPRING, NO BOUNCE
```tsx
const EASE = [0.25, 0.1, 0.25, 1] // cubic-bezier for all UI entrances
```
Spring physics ONLY for damped cursor tracking (`GlassCursor`). Never for UI entrance animations.

### Glass Reflection Effects (per-section)
- **Hero**: Diagonal curtain wall light sweep
- **Services**: Specular highlight sweep on card hover
- **Projects**: Cloud reflection on placeholder images
- **Platforms**: Prismatic light refraction on hover
- **Testimonials**: Frosted glass panel with edge light streaks
- **Contact CTA**: Caustic light blobs (Framer Motion infinite animations)
- **Certifications**: Glass edge glow on hover
- **Global**: Curtain wall mullion grid follows cursor (GlassCursor island)

## Project Structure

```
quality-reflections-site/
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
├── deploy.sh                     # FTP deploy (requires .env with FTP_HOST/USER/PASS/PATH)
├── .env.example
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── logos/                    # Partner logos (kawneer, ykk, agc, oldcastle, tubelite, etc.)
└── src/
    ├── layouts/
    │   └── Layout.astro          # Base: fonts, meta, OG, JSON-LD, CSS vars, theme script
    ├── styles/
    │   └── global.css            # 2,329 lines: design tokens, grids, glass effects, animations
    ├── components/
    │   ├── Header.astro          # Sticky nav, mobile menu, theme toggle
    │   ├── HeroSection.astro     # Scroll-pinned hero with assembly animation + 4 stats
    │   ├── ServicesSection.astro  # 7-service bento grid (featured items span 2x2)
    │   ├── ProjectsSection.astro # Horizontal scroll gallery (5 projects)
    │   ├── PlatformsSection.astro # 6-platform grid with backbone pulse line
    │   ├── PartnershipSection.astro # Kawneer dealer showcase
    │   ├── CertificationsSection.astro # 5 credentials on timeline connector
    │   ├── TestimonialsSection.astro   # 3 testimonial cards (staggered)
    │   ├── CareersSection.astro  # 2 opportunity cards (employees/office)
    │   ├── ContactSection.astro  # CTA with caustic lights + title block
    │   ├── Footer.astro          # 3-col link grid + drawing info block
    │   ├── ui/
    │   │   └── ScrollTracker.astro  # Fixed scroll-spy dots (7 sections)
    │   └── react/
    │       ├── GlassCursor.tsx      # client:load — mullion grid cursor reveal
    │       ├── HeroAssembly.tsx     # client:load — 9-layer scroll-driven exploded view (1,011 lines)
    │       ├── AnimatedStat.tsx     # client:visible — counter animation
    │       └── CausticLights.tsx    # client:visible — 3 drifting radial blobs
    ├── scripts/
    │   ├── hairlines.ts          # Cursor guideline followers (inlined in index.astro)
    │   └── particles.ts          # Floating particles (inlined in index.astro)
    ├── assets/
    │   └── images/               # Project photos (Astro optimizes)
    └── pages/
        └── index.astro           # Composes all sections + inline JS (scroll reveal, card glow, etc.)
```

## Page Sections (top to bottom)

| Section | Component | Grid Coord | Key Content |
|---------|-----------|------------|-------------|
| Hero | HeroSection | B2 | Assembly animation, headline, 2 CTAs, 4 animated stats |
| Services | ServicesSection | C1-C7 | Curtain walls, storefronts, windows, entrances, railings, skylights, panels |
| Projects | ProjectsSection | D1-D5 | Office tower, medical center, university, retail pavilion, courthouse |
| Platforms | PlatformsSection | E1-E6 | Kawneer, YKK AP, Oldcastle, Viracon, AGC Glass, Tubelite |
| Partnership | PartnershipSection | F1 | Kawneer authorized dealer showcase |
| Certifications | CertificationsSection | G1-G5 | OSHA 30h, NGA member, BBB A+, DOT licensed, bonded/insured |
| Testimonials | TestimonialsSection | H1-H4 | 3 client testimonials (placeholder content) |
| Careers | CareersSection | H-series | 2 cards: employees, office positions |
| Contact | ContactSection | I | CTA + caustic lights + title block |
| Footer | Footer | J | 3-col links + drawing info block |

## Content Status

Most content is **placeholder** — testimonials, project names, phone numbers, etc. are not real.
`WEBSITE-CONTENT.md` (in parent directory) is the client worksheet for real data — mostly unchecked.

## Key Conventions

- Astro components for static content (zero JS shipped)
- React islands only where interactivity/animation requires it
- `client:load` for above-fold interactive (cursor, hero assembly)
- `client:visible` for below-fold animations (stats, caustic lights)
- All colors via CSS custom properties — never hardcoded hex values
- `prefers-reduced-motion` respected on ALL animations
- Touch device detection hides cursor-based effects
- Images in `src/assets/` for Astro optimization pipeline
- Commit messages: imperative mood, concise ("add", "fix", "update")

## Known Issues (22 documented)

See `docs/plans/2026-03-01-ui-ux-cleanup-design.md` for full list.
Critical: scroll tracker dots render square, cursor crosshair class mismatch, card glow perf (60x/sec DOM queries).

## Admin Panel Sync Rule

**CRITICAL: The admin panel and public site must stay in sync at all times.**

When making ANY change to the public site (src/components/, src/pages/, src/data/):
1. If you add, remove, or rename a content field in a component → update the matching admin editor page to include that field
2. If you add a new section to the public site → add a corresponding admin editor page with all its content fields
3. If you change the structure of content.json → update the export function (admin/server/export.ts) AND the admin editor that writes to it
4. If you add new hardcoded text to a component → make it editable from admin instead, pulling from content.json with a fallback to the hardcoded value

The admin panel lives in `admin/` and manages all website content via a SQLite database. On publish, it exports to `src/data/content.json` which Astro components read at build time. Every piece of visible text on the public site should be editable from admin.

**Admin structure:**
- `admin/server/` — Express API, routes, DB, export
- `admin/client/` — React SPA (Vite + Tailwind)
- `admin/client/src/pages/` — one editor page per site section
- `src/data/content.json` — exported content consumed by Astro components

## Do Not

- Add rounded corners to cards or containers
- Use gradients on UI elements (only in glass reflection effects)
- Use spring/bounce animations for UI entrances — cubic-bezier only
- Add playful, organic, or decorative elements
- Make the design feel like a consumer/retail site — this is B2B construction
- Use Google Fonts CDN — fonts are self-hosted via @fontsource
- Use Tailwind CDN — everything is build-time compiled
- Ship JavaScript for purely static content — use Astro components
