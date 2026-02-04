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

---

## TODO: Notion Setup (Resume Here)

Once Notion MCP is connected, create:

1. **Projects Dashboard** (database)
   - Name, Status, Repo URL, Live URL, Client, Last Updated
   - Projects: Quality Reflections, Iris Beauty, ShalaWorks, ShalaMakes, Choice Tactical, Blue Mango, ValetFlow, Ballistic Load Dev

2. **Decision Log** (database)
   - Project, Decision, Reasoning, Date
   - Track why design/tech choices were made

3. **Client Notes** (per-project pages)
   - Meeting notes, feedback, requirements
   - Contact info

4. **Design References** (gallery)
   - Inspiration, color palettes, iteration screenshots

5. **Task Tracking** (database)
   - Project, Task, Status, Priority
   - What's done, what's next

### To Resume
1. Run `/mcp` to verify Notion is connected
2. Complete OAuth if prompted
3. Ask Claude to "set up the Notion workspace we planned"
