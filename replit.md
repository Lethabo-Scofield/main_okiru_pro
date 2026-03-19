# Okiru Pro - B-BBEE Compliance Platform

## Overview
Full-stack Vite + Express application for B-BBEE compliance management. Migrated from Vercel.

## Architecture
- **Frontend**: React (Vite) with TailwindCSS, Radix UI, Wouter router
- **Backend**: Express.js (TypeScript) with session auth (bcryptjs)
- **Database**: MongoDB (Mongoose) with MongoStore sessions
- **AI**: Groq SDK (llama-3.3-70b) for entity extraction
- **Build**: esbuild bundles server to `dist/index.cjs`, Vite builds client to `dist/public/`

## Project Structure
- `src/` — React frontend (pages, components, lib)
- `Toolkit/` — Shared toolkit library (auth, API, UI components)
- `server/` — Express backend (routes, storage, db, vite middleware)
- `shared/` — Shared schemas (Mongoose models)
- `script/build.ts` — Production build script
- `api/` — Vercel serverless functions (not used on Replit, active on Vercel deployment)

## Required Environment Variables
- `MONGODB_URI` — MongoDB connection string (optional — both Replit and Vercel fallback to in-memory storage if not set)
- `GROQ_API_KEY` — Groq API key (optional — entity generation uses rule-based fallback without it)
- `SESSION_SECRET` — Express session secret (auto-generated on Replit, uses default on Vercel if not set)

## Dev Server
- `npm run dev` starts Express on port 5000 with Vite middleware (HMR)
- In production, `npm run build` then `npm run start`

## Authentication & Multi-Tenancy
- Users must sign in or register to access the dashboard and all features
- Login accepts both username and email (case-insensitive lookup via `getUserByUsernameOrEmail`)
- `requireAuth` middleware validates session AND checks user still exists in DB
- Templates are user-scoped: each user sees their own templates + shared ones (userId: null)
- Users can only edit/delete their own templates — shared templates are read-only
- Auth provider (`Toolkit/src/lib/auth.tsx`) properly throws errors on failed login/register
- Unauthenticated users are redirected to `/auth` from protected routes
- Landing page (`/`) always shows on reload regardless of auth state
- Toolkit client data (ownership, management, skills, procurement) will move to ArangoDB (not yet implemented)

## Registration Wizard (4-step flow)
- Step 1 — Organization: Select from registered orgs (Okiru, Param Solutions) + enter subscription ID
- Step 2 — Personal Details: Full name and email
- Step 3 — Credentials: Username, password, confirm password
- Step 4 — Role Selection: Auditor, Analyst, Manager, or Admin (admin role blocked server-side for self-registration)
- Backend validates org + subscription ID match, trims/normalizes all inputs, enforces allowed roles (no privilege escalation)
- Registered orgs and subscription IDs defined server-side in `REGISTERED_ORGANIZATIONS` constant in `server/routes.ts`
- `/api/organizations` endpoint returns org list (id + name) for the dropdown

## Key Configuration
- `API_BASE` in `Toolkit/src/lib/config.ts` defaults to empty string (relative URLs)
- MongoDB connection gracefully degrades in dev mode (warns instead of crashing)
- Session store falls back to in-memory in dev when MONGODB_URI is not set
- Storage layer (`server/storage.ts`) has a `MemoryStorage` fallback when MONGODB_URI is not set, enabling full Entity Builder, auth, and template CRUD without MongoDB (data does not persist across restarts)
- In-memory mode auto-seeds 3 predefined B-BBEE starter templates and a demo user (username: demo, password: demo) on startup
- Entity generation without AI key fills all fields intelligently based on type detection
- Vercel API (`api/[...path].ts`) includes middleware to preserve pre-parsed request body for proper POST/PUT handling in serverless environment
- Vercel API gracefully handles missing MONGODB_URI: auth uses session-only mode (any credentials accepted), templates use in-memory storage with 3 starter templates
- Vercel routing (`vercel.json`) uses explicit `routes` array: API routes → catch-all serverless function, then filesystem, then SPA fallback to `index.html`
- `api/tsconfig.json` uses ES2020 modules (matching `api/package.json` type: module)

## B-BBEE Scorecard — RCOGP Generic Codes Alignment (March 2026)

### Grand Total: 120 pts (was 133)
- Ownership 25 + Management Control 19 + Skills 25 + Procurement 29 + SD 10 + ED 7 + SED 5 = 120
- YES Initiative (5 pts) is separate/bonus, not counted in base 120

### Priority Sub-minimums (5 total)
- Ownership ≥ 10 pts, Skills ≥ 10 pts, Procurement ≥ 11.6 pts, SD ≥ 4 pts (40% of 10), ED ≥ 2 pts (40% of 5)
- Level discounted by 1 if any sub-minimum fails

### Management Control (19 pts, 13 sub-lines)
- Split by gender: Board black/BWO, Exec black/BWO, Senior black/BWO, Middle black/BWO, Junior black/BWO, Disabled black/BWO, Independent NED
- Uses `subLines` array in calculator result

### Ownership (25 pts, 7 sub-lines)
- Voting rights black (4) + BWO (2), Economic interest black (4) + BWO (2), Designated groups (1), New entrants (4), Net value (8)
- Uses `subLines` array; old fields (votingRights, womenBonus, newEntrantBonus, economicInterest) removed
- Full ownership awarded when black voting ≥ 25%

### Skills Development (25 pts, 5 sub-lines)
- Learning programmes (6), Bursaries (4), Disabled learning (4), Learnerships (6), Absorption (5)
- Old EAP indicator sub-structure removed; uses `subLines` + `categoryBreakdown`
- Category E capped at 25% of total spend, Category F capped at 15%
- TrainingProgram has `categoryCode` field (A-F) with backward-compatible legacy mapping

### Preferential Procurement (29 base + 2 bonus = 31 pts)
- Sub-lines: Empowering Suppliers (5), QSE (3), EME (4), ≥51% Black Owned (11), >30% BWO (4), Designated Group (2)
- Bonus: Graduation (1pt tick-box), Jobs Created (1pt tick-box)
- ProcurementData includes graduationBonus/jobsCreatedBonus fields

### Supplier Development (10 pts, separate row)
- 2% of NPAT target; sub-minimum 4 pts (40%)
- Split from old combined ESD element

### Enterprise Development (7 pts = 5 base + 2 bonus, separate row)
- 1% of NPAT target; sub-minimum 2 pts (40% of 5 base)
- Bonuses: Graduation (1pt), Jobs Created (1pt)
- Split from old combined ESD element

### SED (5 pts)
- 1% of NPAT; no sub-minimum
- Grass-roots only (health, safety). Education = Skills Development.

### Pillar Pages
- Ownership, Skills, Management pillar pages use `subLines` arrays for detailed breakdown tables
- Old hard-coded indicator rows replaced with dynamic sub-line rendering

### Export Excel
- All sheets updated: new sub-line structure for scoring detail sections
- Audit trail shows 8 pillar rows (SD/ED separate), 120 total
- Gaps analysis includes SD and ED as separate pillars
