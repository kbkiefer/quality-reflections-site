# Quality Reflections Glasswork - Website

## Project Overview
Commercial glazing company website for Quality Reflections Glasswork.

## Key Features
- **Custom cursor**: Blueprint-style construction reticle with coordinate hairlines
- **Hero animation**: Scroll-pinned 3D exploded view of glass curtain wall assembly
- **Design language**: Navy/glass-blue color palette, sharp edges (no border-radius), technical/architectural aesthetic

## Tech Stack
- Static HTML with Tailwind CSS (CDN)
- Vanilla JavaScript for animations
- No build tools required

## Design Decisions
- Sharp edges throughout (border-radius: 0) - reflects precision of glasswork
- Blueprint grid backgrounds - construction/technical aesthetic
- Glass-blue (#4A90D9) accent color - references the product
- Navy-black (#010E2F) base - premium, professional feel

## Animation Notes
- Hero section uses `position: sticky` inside a 300vh spacer
- Scroll progress drives the glass assembly animation (exploded → assembled)
- Each component layer has individual explosion configs (offset, scale, timing)
