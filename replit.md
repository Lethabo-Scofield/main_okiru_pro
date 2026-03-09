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
- `api/` — Legacy Vercel serverless functions (not used on Replit)

## Required Environment Variables
- `MONGODB_URI` — MongoDB connection string (required for auth, templates, data persistence)
- `GROQ_API_KEY` — Groq API key (required for AI entity extraction features)
- `SESSION_SECRET` — Express session secret (auto-generated on Replit)

## Dev Server
- `npm run dev` starts Express on port 5000 with Vite middleware (HMR)
- In production, `npm run build` then `npm run start`

## Key Configuration
- `API_BASE` in `Toolkit/src/lib/config.ts` defaults to empty string (relative URLs)
- MongoDB connection gracefully degrades in dev mode (warns instead of crashing)
- Session store falls back to in-memory in dev when MONGODB_URI is not set
- Storage layer (`server/storage.ts`) has a `MemoryStorage` fallback when MONGODB_URI is not set, enabling full Entity Builder, auth, and template CRUD without MongoDB (data does not persist across restarts)
- In-memory mode auto-seeds 3 predefined B-BBEE starter templates from `src/data/starterTemplates.ts` on startup (B-BBEE Certificate, Ownership Verification, Management Control)
- Entity generation without AI key fills all fields intelligently (synonyms, positives, negatives, zones, keywords, pattern) based on type detection (date, amount, percentage, name, number, status)
