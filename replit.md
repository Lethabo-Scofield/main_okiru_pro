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

## Authentication
- Users must sign in or register to access the dashboard and all features
- No demo mode or auto-login fallbacks — real authentication required
- Auth provider (`Toolkit/src/lib/auth.tsx`) properly throws errors on failed login/register
- Unauthenticated users are redirected to `/auth` from protected routes
- Landing page (`/`) always shows on reload regardless of auth state

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

## B-BBEE Calculator Updates (March 2026)

### Preferential Procurement
- Full 6 sub-indicator breakdown + 2 bonus lines on scorecard expand
- Sub-lines: Empowering Suppliers (5pts), QSE (3pts), EME (4pts), ≥51% Black Owned (11pts), >30% Black Female Owned (4pts), Designated Group (2pts)
- Bonus: Graduation of ED beneficiaries to SD (1pt, tick-box), Jobs Created from ED & SD (1pt, tick-box)
- ProcurementData type now includes graduationBonus/jobsCreatedBonus fields
- Store actions: `updateProcurementBonuses`

### Skills Development
- TrainingProgram now has `categoryCode` field (A-F) with backward-compatible legacy mapping
- Category E capped at 25% of total spend, Category F capped at 15%
- Cost breakdown fields added: courseCost, travelCost, accommodationCost, cateringCost
- Scorecard shows category breakdown when spend exists in a category

### Enterprise & Supplier Development
- ESD now supports graduation bonus (+1pt) and jobs created bonus (+1pt)
- ESDData type includes graduationBonus/jobsCreatedBonus/jobsCreatedCount fields
- Store actions: `updateEsdBonuses`
- Max possible: 17 pts (15 base + 2 bonus)

### SED
- Tooltip added: "Grass-roots only (health, safety). Education = Skills Development."
