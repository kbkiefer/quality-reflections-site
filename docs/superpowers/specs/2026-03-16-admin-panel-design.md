# Quality Reflections Admin Panel — Design Spec

## Goal

Build an admin panel for Quality Reflections Glasswork that allows staff to manage featured projects (full CRUD + photos + service badges), job listings (create/edit/delete/toggle), and view/track submitted applications — with a publish workflow that rebuilds and deploys the static site.

## Architecture

Two separate apps sharing one SQLite database:

- **Public site** — Static Astro site deployed via FTP. At build time, reads exported JSON from the admin database to generate pages. No runtime server needed for visitors.
- **Admin app** — Express.js + React SPA hosted at `admin.qualityreflections.com` on a small VPS. Owns the SQLite database, serves the API, and renders the admin UI.

### Publish Workflow

1. User makes changes in admin (add/edit/delete project, toggle job, etc.)
2. User clicks "Publish" button (always visible in admin top bar)
3. Admin server exports current database state as JSON files
4. Runs `npm run build` (Astro generates static HTML from exported data)
5. Runs FTP deploy script (reuses existing `deploy.sh`)
6. Admin shows real-time publish status: idle → building → deploying → live
7. Last publish timestamp displayed in admin

### Authentication

- Username + password login (bcrypt hashed)
- JWT stored in httpOnly cookie
- 24-hour session expiry
- No self-registration — accounts created via CLI seed script
- All admin API routes protected by auth middleware

## Data Models

### Projects

| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | Auto-increment |
| slug | TEXT UNIQUE | Auto-generated from title |
| title | TEXT | Required |
| category | TEXT | e.g., "Commercial Office" |
| description | TEXT | Project description |
| location | TEXT | e.g., "Laredo, TX" |
| year | TEXT | e.g., "2024" |
| sqft | TEXT | e.g., "45,000 SF" |
| duration | TEXT | e.g., "8 months" |
| value | TEXT | e.g., "$2.1M" |
| services | TEXT (JSON) | Array of service keys |
| coverImage | TEXT | Path to cover image |
| gridCoord | TEXT | Blueprint grid coordinate |
| displayOrder | INTEGER | Controls gallery position |
| status | TEXT | "draft" or "published" |
| createdAt | TEXT | ISO timestamp |
| updatedAt | TEXT | ISO timestamp |

### Project Photos

| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | Auto-increment |
| projectId | INTEGER FK | References projects.id |
| path | TEXT | File path on hosting |
| label | TEXT | Photo caption |
| serviceTags | TEXT (JSON) | Array of service keys |
| displayOrder | INTEGER | Photo sort order |

### Job Listings

| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | Auto-increment |
| title | TEXT | e.g., "Glazier - Full Time" |
| department | TEXT | "field" or "office" |
| type | TEXT | "full-time", "part-time", "contract" |
| description | TEXT | Job description |
| requirements | TEXT | Requirements/qualifications |
| payRange | TEXT | e.g., "$18-25/hr" |
| isActive | INTEGER | 0 or 1 toggle |
| displayOrder | INTEGER | Sort order within department |
| createdAt | TEXT | ISO timestamp |
| updatedAt | TEXT | ISO timestamp |

### Applications

| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | Auto-increment |
| jobListingId | INTEGER FK | References job_listings.id |
| name | TEXT | Applicant name |
| email | TEXT | Applicant email |
| phone | TEXT | Applicant phone |
| resumePath | TEXT | Path to uploaded resume |
| formData | TEXT (JSON) | All form responses |
| status | TEXT | "new", "reviewed", "contacted", "rejected" |
| notes | TEXT | Internal admin notes |
| createdAt | TEXT | ISO timestamp |

### Users

| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | Auto-increment |
| username | TEXT UNIQUE | Login username |
| passwordHash | TEXT | bcrypt hash |
| displayName | TEXT | Shown in admin UI |
| createdAt | TEXT | ISO timestamp |

## Admin UI

### Design Language

Same blueprint/construction aesthetic as the main site:
- Dark navy backgrounds, blueprint grid patterns
- Glass-blue (#4A90D9) accents and interactive elements
- JetBrains Mono for labels and data, Inter for body text
- No rounded corners, no gradients on UI elements
- Dark/light mode toggle (same `data-theme` system)
- English/Spanish toggle (same i18n pattern)

### Layout

- **Sidebar** — Dark navy with blueprint grid, navigation links, QR logo
- **Top bar** — Current page title, theme toggle, language toggle, user menu, Publish button
- **Content area** — Main workspace

### Pages

1. **Dashboard** — Overview cards: total projects, active job listings, new applications count, last publish timestamp

2. **Projects List** — Table of all projects with cover thumbnail, title, category, status badge (draft/published), display order. Actions: edit, delete. Drag to reorder. "Add Project" button.

3. **Project Editor** — Full form:
   - Title, category, description, location, year, sqft, duration, value
   - Grid coordinate input
   - Service badges as checkboxes (curtain wall, storefront, windows, entrances, railings, skylights)
   - Cover image upload
   - Photo gallery: drag-and-drop upload, reorder, label editing, service tag assignment per photo
   - Status toggle (draft/published)
   - Save and delete buttons

4. **Job Listings** — Table grouped by department (field/office). Each row: title, type, active toggle, application count. "Add Position" button. Drag to reorder.

5. **Job Editor** — Form: title, department selector, type selector, description, requirements, pay range, active toggle.

6. **Applications** — Filterable table: filter by position, by status, by date. Columns: name, position title, date, status badge. Click row to view details.

7. **Application Detail** — Full submitted data display, resume download link, status dropdown, notes textarea.

8. **Settings** — Manage admin accounts: add user, remove user, reset password.

## Public Site Changes

### Projects

- `ProjectsSection.astro` reads from `src/data/content.json` instead of hardcoded `projects.ts`
- `portfolio/[slug].astro` generates pages from same JSON data
- Only projects with `status: "published"` are included
- Display order controlled by admin
- Deleted projects removed on next publish

### Careers

- `CareersSection.astro` reads active job listings from `content.json`
- If no positions active in a department, that card hides
- If zero positions active total, section shows "no current openings" message
- Apply pages list active positions for the selected department
- User selects specific position when applying

### Apply Forms

- Form submissions POST to admin API (`admin.qualityreflections.com/api/applications`)
- Sends form data + resume file
- Admin API stores application in SQLite, saves resume to disk
- User sees confirmation message on frontend
- CORS configured to allow requests from main domain

### Unchanged Sections

Hero, Services, Platforms, Partnership, Certifications, Testimonials, Contact, Footer — remain hardcoded.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Admin Backend | Express.js + TypeScript | Lightweight, same language as frontend |
| Admin Frontend | React 19 + Tailwind 4 | Same stack as existing site |
| Database | SQLite via better-sqlite3 | Zero config, single file |
| Auth | bcrypt + JWT (httpOnly cookie) | Simple, secure |
| File Uploads | Multer → FTP to main hosting | Reuses existing infrastructure |
| Data Export | JSON files to disk | Astro reads at build time |
| Build/Deploy | Astro build + deploy.sh | Existing pipeline, triggered from admin |
| i18n | Same translations pattern | Consistency |
| Admin Hosting | Small VPS (~$5-7/mo) | Railway, Fly.io, or DigitalOcean |

## Project Structure

```
quality-reflections-site/
├── admin/
│   ├── server/
│   │   ├── index.ts              # Express app entry
│   │   ├── db.ts                 # SQLite setup + migrations
│   │   ├── auth.ts               # JWT + bcrypt middleware
│   │   ├── routes/
│   │   │   ├── projects.ts       # CRUD for projects + photos
│   │   │   ├── jobs.ts           # CRUD for job listings
│   │   │   ├── applications.ts   # Applications + resume upload
│   │   │   ├── publish.ts        # Build + deploy trigger
│   │   │   └── users.ts          # Account management
│   │   └── export.ts             # DB → JSON export for Astro
│   ├── client/
│   │   ├── src/
│   │   │   ├── App.tsx           # Router + layout
│   │   │   ├── pages/            # Dashboard, Projects, Jobs, etc.
│   │   │   ├── components/       # Shared UI (tables, forms, sidebar)
│   │   │   └── styles/           # Blueprint design tokens
│   │   └── index.html
│   ├── data/
│   │   ├── qr-admin.db           # SQLite database file
│   │   └── exports/              # JSON exports for build
│   ├── uploads/                  # Temp file storage
│   ├── seed.ts                   # CLI script to create admin users
│   └── package.json
├── src/
│   ├── data/
│   │   └── content.json          # Generated by admin export
│   └── ...                       # Existing Astro site
└── deploy.sh
```

## API Endpoints

### Auth
- `POST /api/auth/login` — Login, returns JWT cookie
- `POST /api/auth/logout` — Clear cookie
- `GET /api/auth/me` — Current user info

### Projects
- `GET /api/projects` — List all projects
- `GET /api/projects/:id` — Single project with photos
- `POST /api/projects` — Create project
- `PUT /api/projects/:id` — Update project
- `DELETE /api/projects/:id` — Delete project + photos
- `PUT /api/projects/reorder` — Update display order
- `POST /api/projects/:id/photos` — Upload photos
- `PUT /api/projects/:id/photos/:photoId` — Update photo label/tags
- `DELETE /api/projects/:id/photos/:photoId` — Delete photo
- `PUT /api/projects/:id/photos/reorder` — Reorder photos

### Job Listings
- `GET /api/jobs` — List all jobs
- `POST /api/jobs` — Create job
- `PUT /api/jobs/:id` — Update job
- `DELETE /api/jobs/:id` — Delete job
- `PUT /api/jobs/reorder` — Update display order
- `PATCH /api/jobs/:id/toggle` — Toggle active status

### Applications
- `GET /api/applications` — List with filters
- `GET /api/applications/:id` — Single application detail
- `POST /api/applications` — Submit application (public, no auth)
- `PATCH /api/applications/:id/status` — Update status
- `PATCH /api/applications/:id/notes` — Update notes
- `GET /api/applications/:id/resume` — Download resume

### Publish
- `POST /api/publish` — Trigger export + build + deploy
- `GET /api/publish/status` — Current publish status

### Users
- `GET /api/users` — List admin users
- `POST /api/users` — Create user
- `DELETE /api/users/:id` — Remove user
- `PUT /api/users/:id/password` — Reset password
