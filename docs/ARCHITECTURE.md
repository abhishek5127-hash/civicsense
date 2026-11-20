# CivicSense System Architecture

## Overview

CivicSense is structured as a single-service TypeScript full-stack application combining a React 19 SPA with an Express API server.

```text
┌──────────────────────────────────────────────────────────┐
│ Browser Client (React 19 + Vite + Tailwind CSS v4)       │
│  ├── Pages: Landing, Auth, Home, Report, Explore,        │
│  │          MyReports, CivicPulse, Authority, Details    │
│  ├── Interactive SVG Map (NeighbourhoodMap.tsx)          │
│  └── Typed HTTP Client (src/api.ts, Bearer Token Auth)   │
└───────────────────────────┬──────────────────────────────┘
                            │ HTTPS / JSON (/api/*)
┌───────────────────────────▼──────────────────────────────┐
│ Express Server (server.ts, Port 3000)                    │
│  ├── Auth Middleware (scrypt + HMAC-SHA256 tokens)       │
│  ├── Civic Workflow & Validation Engine                  │
│  ├── Duplicate Intelligence (Haversine + Semantic)       │
│  ├── Gemini AI Gateway (@google/genai)                   │
│  │     ├── gemini-4-hydrogen (Vision, JSON, Triage)      │
│  │     └── gemini-3.5-transcribe (EN/HI Audio-to-Text)   │
│  └── Atomic JSON Datastore (data/civicsense.json)        │
└──────────────────────────────────────────────────────────┘
```

## Key Architectural Decisions

### 1. Unified Express + Vite Serving (`server.ts`)
- In development (`NODE_ENV !== 'production'`), Express mounts Vite's `createServer({ middlewareMode: true })` so client HMR-disabled assets and `/api/*` routes share origin `http://localhost:3000` without CORS complexity.
- In production (`NODE_ENV=production`), Express serves static assets from `dist/` and falls back to `dist/index.html`.

### 2. Authentication & Role Separation
- Passwords are salted with 16 random bytes and hashed using `crypto.scryptSync`.
- Tokens are base64url payloads signed with `HMAC-SHA256` using `SESSION_SECRET` (or a runtime-generated 256-bit key in local dev) and sent via `Authorization: Bearer <token>`.
- Role guards (`requireAuth`, `requireAuthority`) enforce citizen vs. municipal officer privileges on the server.

### 3. Intake & Duplicate Intelligence
- **Photo Intake**: Client converts uploaded images (or sample canvas PNGs) to base64 data URLs and sends them to `POST /api/ai/smart-report`.
- **Voice Intake**: Client records `audio/webm` via `MediaRecorder` (or accepts Hindi/Hinglish/English text) and submits to `POST /api/ai/voice-report`.
- **Duplicate Check**: `POST /api/reports/check-duplicates` scores open reports by Haversine distance (`<= 350m`), matching category, submission recency (`<= 72h`), and keyword overlap, then optionally enriches similarity reasoning via `gemini-4-hydrogen`.

### 4. Six-Stage Resolution State Machine
Reports progress through:
1. `Submitted`
2. `Verified` (auto-promoted at 3 `still_exists` confirmations or by Authority review)
3. `Assigned` (requires authenticated Authority officer dispatch)
4. `In Progress`
5. `Evidence Uploaded` (requires post-repair note or photo)
6. `Resolved` (auto-closed at 2 `confirm_resolved` citizen confirmations after evidence upload, or closed by Authority officer after evidence inspection)

### 5. Custom Interactive Neighbourhood Map (`src/components/NeighbourhoodMap.tsx`)
Instead of external map tile keys, CivicSense renders an interactive vector street grid mapped to East Bengaluru wards (`12.965–12.987 N, 77.628–77.656 E`) supporting zoom, radial heatmaps, proximity radar rings, marker inspection, and click-to-pin coordinate picking.
