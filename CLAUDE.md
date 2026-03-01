# CLAUDE.md — Quality Reflections Glasswork

## Project Overview

Commercial glazing contractor website for **Quality Reflections Glasswork** in Laredo, TX. Targets general contractors and construction project managers. Single-page site with scroll-based navigation and a premium blueprint/architectural aesthetic.

**Migration:** From a single 2,985-line HTML file (Tailwind CDN) → Astro 5.x + React islands + Framer Motion + build-time Tailwind.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Astro 5.x | Static-first, islands architecture, built-in image optimization |
| UI Islands | React 19 + `@astrojs/react` | Reuse archived Framer Motion patterns |
| Animations | Framer Motion 12.x | Spring physics for cursor, cubic-bezier for UI |
| CSS | Tailwind 4.x (build-time) | ~10KB compiled vs 113KB runtime CDN |
| Fonts | Inter + JetBrains Mono (`@fontsource`, self-hosted) | No Google Fonts dependency |
| Images | `astro:assets` | Auto WebP/AVIF, responsive srcset, lazy loading |
| Deploy | FTP via `deploy.sh` | Builds to `dist/`, uploads via curl |

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

### Design Direction
- **Construction-document aesthetic** — blueprint grids, crosshairs, architectural precision
- **No rounded corners** — `border-radius: 0` everywhere. Reflects precision of glasswork
- No gradients on UI elements (only in glass reflection effects)
- Geometric, rectilinear, engineered
- Fonts: Inter (400–800) for body, JetBrains Mono (300–500) for technical labels
- Blueprint grid backgrounds on dark sections

### Animation Convention — NO SPRING, NO BOUNCE
```tsx
const EASE = [0.25, 0.1, 0.25, 1] // cubic-bezier, used everywhere for UI entrances
```
Spring physics used ONLY for damped cursor tracking (`GlassCursor`). Never for UI entrance animations.

### Glass Reflection Effects (per-section)
- **Hero**: Diagonal curtain wall light sweep
- **Services**: Specular highlight sweep on card hover
- **Projects**: Cloud reflection on placeholder images
- **Platforms**: Prismatic light refraction on hover
- **Testimonials**: Frosted glass panel with edge light streaks
- **CTA**: Caustic light blobs (Framer Motion infinite animations)
- **Certifications**: Glass edge glow on hover
- **Global**: Curtain wall mullion grid follows cursor (GlassCursor island)

## Project Structure

```
quality-reflections-site/
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
├── deploy.sh                     # FTP deploy script
├── public/
│   ├── favicon.svg
│   └── robots.txt
└── src/
    ├── layouts/
    │   └── Layout.astro          # Base: fonts, meta, OG, JSON-LD, CSS vars
    ├── styles/
    │   └── global.css            # CSS custom properties, blueprint grids, glass cards
    ├── components/
    │   ├── Header.astro          # Sticky nav, mobile menu (vanilla JS)
    │   ├── HeroSection.astro     # Scroll-pinned hero wrapper
    │   ├── ServicesSection.astro  # Bento grid
    │   ├── ProjectsSection.astro # Gallery
    │   ├── PlatformsSection.astro
    │   ├── PartnershipSection.astro
    │   ├── CertificationsSection.astro
    │   ├── TestimonialsSection.astro
    │   ├── ContactSection.astro
    │   ├── Footer.astro
    │   ├── ui/                   # Shared Astro atoms (zero JS shipped)
    │   │   ├── GlassCard.astro
    │   │   ├── SectionMarker.astro
    │   │   ├── GridCoord.astro
    │   │   ├── DimensionLine.astro
    │   │   ├── SectionCut.astro
    │   │   ├── BlueprintButton.astro
    │   │   └── ArchIcon.astro
    │   └── react/                # React islands (JS only where needed)
    │       ├── GlassCursor.tsx       # client:load — cursor effect
    │       ├── RevealSection.tsx     # client:visible — scroll reveal
    │       ├── HeroAssembly.tsx      # client:load — scroll-driven assembly
    │       ├── AnimatedStat.tsx      # client:visible — counter animation
    │       ├── AssemblyPanel.tsx     # client:idle — detail panel
    │       ├── ProjectsGrid.tsx     # client:visible — filterable portfolio
    │       └── CausticLights.tsx    # client:visible — CTA decorative
    ├── scripts/
    │   ├── hairlines.ts          # Cursor guideline followers
    │   └── particles.ts          # Floating particles
    ├── assets/
    │   ├── images/               # Project photos (Astro optimizes)
    │   └── logos/                 # Partner/cert SVGs
    └── pages/
        └── index.astro           # Composes all sections
```

## Commands

```bash
npm run dev          # Astro dev server
npm run build        # Production build → dist/
npm run preview      # Preview production build
bash deploy.sh       # FTP upload dist/ to hosting
```

## Content Context

- **Services**: Curtain walls, storefronts, window walls, glass handrails, aluminum panels, skylights, entrances, specialty glass
- **Platforms**: Procore, ConstructConnect, GCPay, Bluebeam
- **Partnership**: Authorized Kawneer dealer (1600/1620 curtain wall, Trifab storefront, 350/500 entrances, InLighten daylighting)
- **Certifications**: NGA member, BBB A+ rating, OSHA 30-hour certified crews, licensed commercial carrier (DOT)

## Key Conventions

- Astro components for static content (no JS shipped)
- React islands only where interactivity/animation requires it
- `client:load` for above-fold interactive (cursor, hero assembly)
- `client:visible` for below-fold animations (reveal, stats, projects)
- `client:idle` for deferred interactivity (assembly panel)
- All colors via CSS custom properties — never hardcoded
- `RevealSection` wraps content needing scroll-triggered entrance
- `prefers-reduced-motion` respected on ALL animations
- Touch device detection hides cursor-based effects
- Images in `src/assets/` for Astro optimization pipeline

## Source Files

| Source | Location | What to Port |
|--------|----------|-------------|
| Current site | `./index.html` (legacy) | All content, section structure, SVG assembly |
| Archive React patterns | `../_archive/Orchestrator-Test/src/` | GlassCursor, RevealSection, hooks, CTA caustics, Projects grid |
| Archive CSS system | `../_archive/Orchestrator-Test/src/index.css` | CSS custom properties, design tokens |

## Do Not

- Add rounded corners to cards or containers
- Use gradients on UI elements (only in glass reflection effects)
- Use spring/bounce animations for UI entrances — cubic-bezier only
- Add playful, organic, or decorative elements
- Make the design feel like a consumer/retail site — this is B2B construction
- Use Google Fonts CDN — fonts are self-hosted via @fontsource
- Use Tailwind CDN — everything is build-time compiled
- Ship JavaScript for purely static content — use Astro components
