# Changelog — Quality Reflections Glasswork

All notable changes to this project will be documented in this file.

---

## [2.0.0] — 2026-02-06 — Astro Migration

### Architecture
- Migrated from single-file HTML (2,985 lines) to Astro 5.x with ~30 focused components
- Adopted islands architecture: React islands for interactive elements, Astro components for static content
- Replaced Tailwind CDN (113KB runtime JIT) with build-time Tailwind 4.x (~10KB compiled)
- Self-hosted fonts via @fontsource (Inter + JetBrains Mono) — removed Google Fonts CDN dependency
- Added TypeScript throughout React islands and Astro scripts

### Animations
- Ported vanilla RAF animation loops to Framer Motion 12.x
- Hero scroll assembly now uses `useScroll` + `useTransform` (replaces 200+ line RAF loop)
- GlassCursor ported from archive with mullion grid reveal, glass panel reflection, construction reticle
- RevealSection scroll-triggered entrances with configurable delay/direction
- AnimatedStat counter animations with ease-out cubic
- CausticLights infinite drift animations for CTA section
- Animation easing: cubic-bezier `[0.25, 0.1, 0.25, 1]` — no spring/bounce for UI entrances
- `prefers-reduced-motion` respected on all animations

### Performance
- Images optimized via `astro:assets`: WebP/AVIF conversion, responsive srcset, lazy loading
- Project images reduced from ~45MB total (raw PNGs) to ~1MB (optimized WebP)
- JavaScript shipped only where needed via islands (`client:load`, `client:visible`, `client:idle`)
- Static sections ship zero JavaScript

### SEO
- Added proper `<title>` (removed "Variation 3.1")
- Added meta description targeting "commercial glazing Laredo TX"
- Added Open Graph and Twitter Card meta tags
- Added LocalBusiness JSON-LD structured data
- Added `robots.txt` and `sitemap.xml`
- Added canonical URL

### Accessibility
- Added `tel:` and `mailto:` links for contact information
- Verified WCAG AA contrast ratios on all text
- Added proper heading hierarchy
- Added ARIA labels on interactive elements

### Components Added
- `Layout.astro` — Base layout with head, fonts, meta, JSON-LD
- `Header.astro` — Sticky nav with mobile menu
- `HeroSection.astro` — Scroll-pinned hero wrapper
- `ServicesSection.astro` — Bento grid service cards
- `ProjectsSection.astro` — Gallery with optimized images
- `PlatformsSection.astro` — System diagram
- `PartnershipSection.astro` — Kawneer dealer card
- `CertificationsSection.astro` — Timeline row
- `TestimonialsSection.astro` — Testimonial notes
- `ContactSection.astro` — CTA with caustic lights
- `Footer.astro` — Links grid + title block
- `ui/GlassCard.astro` — Glass card with corner brackets
- `ui/SectionMarker.astro` — Numbered section markers
- `ui/GridCoord.astro` — Coordinate badges
- `ui/DimensionLine.astro` — Blueprint dimension lines
- `ui/SectionCut.astro` — Section dividers
- `ui/BlueprintButton.astro` — CTA buttons with sweep effect
- `ui/ArchIcon.astro` — Three-nested-arch SVG logo
- `react/GlassCursor.tsx` — Cursor-tracking mullion grid
- `react/RevealSection.tsx` — Scroll-triggered reveal wrapper
- `react/HeroAssembly.tsx` — Scroll-driven curtain wall assembly
- `react/AnimatedStat.tsx` — Counter animation
- `react/AssemblyPanel.tsx` — Layer detail panel
- `react/ProjectsGrid.tsx` — Filterable portfolio grid
- `react/CausticLights.tsx` — Decorative CTA animations

### Deploy
- Added `deploy.sh` FTP deploy script (builds to `dist/`, uploads via curl)

---

## [1.0.0] — 2026-02-05 — Initial Build

### Added
- Single-page commercial glazing website
- Custom blueprint-style cursor with coordinate hairlines
- Scroll-pinned hero with exploded 3D glass curtain wall assembly animation (9 layers)
- Blueprint grid backgrounds and architectural aesthetic
- Glass-morphism UI components with corner brackets
- Services bento grid (8 service categories)
- Project gallery with AI-generated photography
- Platform integrations section (Procore, ConstructConnect, GCPay, Bluebeam)
- Kawneer authorized dealer partnership section
- Certifications timeline (NGA, BBB, OSHA, DOT)
- Testimonials section with note-card style
- Contact CTA with title block
- Mobile-responsive layout
- Navy-black (#010E2F) / glass-blue (#4A90D9) color palette
- Inter + JetBrains Mono typography
- Vanilla JS animations (RAF-based scroll assembly, intersection observers)

### Tech
- Single HTML file (2,985 lines)
- Tailwind CSS via CDN (runtime JIT, 113KB)
- Google Fonts CDN
- ~1,200 lines inline CSS
- ~550 lines vanilla JavaScript
- 5 AI-generated project images (~45MB raw PNGs)
