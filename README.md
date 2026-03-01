# Quality Reflections Glasswork

Commercial glazing company website featuring:
- Custom blueprint-style cursor with mullion grid reveal
- Scroll-pinned hero with exploded 3D glass curtain wall assembly animation
- AI-generated project photography with automatic WebP/AVIF optimization
- Glass-morphism UI components with architectural precision
- Framer Motion animations with cubic-bezier easing

## Tech Stack

- **Astro 5.x** — Static-first, islands architecture
- **React 19** — Interactive islands (cursor, animations, scroll assembly)
- **Framer Motion 12** — Scroll-driven transforms, entrance animations
- **Tailwind CSS 4** — Build-time compiled (~10KB vs 113KB CDN)
- **TypeScript** — Type-safe React islands and scripts

## Development

```bash
npm install
npm run dev          # Start dev server at localhost:4321
npm run build        # Production build → dist/
npm run preview      # Preview production build
```

## Deploy

```bash
# Set FTP credentials in .env (see .env.example)
bash deploy.sh       # Build + FTP upload
```

## Structure

```
src/
├── layouts/Layout.astro          # Base layout with meta, fonts, JSON-LD
├── pages/index.astro             # Main page composition
├── styles/global.css             # Design system + Tailwind config
├── components/
│   ├── Header.astro              # Fixed nav, mobile menu
│   ├── HeroSection.astro         # Scroll-pinned hero
│   ├── ServicesSection.astro     # Bento grid services
│   ├── ProjectsSection.astro    # Gallery
│   ├── ...Section.astro          # Other sections
│   ├── Footer.astro
│   ├── ui/                       # Zero-JS Astro atoms
│   └── react/                    # React islands (JS where needed)
├── scripts/                      # Vanilla TS scripts
└── assets/                       # Images + logos (Astro optimized)
```
