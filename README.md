# CivicSense

**AI-powered civic issue reporting, neighbourhood intelligence, and transparent municipal resolution platform.**

CivicSense connects residents and municipal operations teams in a single calm, accountable workspace—combining photo and bilingual (English / हिन्दी) voice intake with proximity duplicate detection, community validation safeguards, and six-stage evidence-backed resolution timelines.

---

## 1. Product Vision

Civic reporting tools often fail for two reasons: citizens submit fragmented, incomplete tickets into an opaque black box, and municipal teams drown in duplicate complaints without clear prioritization context. CivicSense closes that loop by turning every street observation into structured, verifiable neighbourhood intelligence where both AI triage and municipal closure remain transparent and human-approved.

## 2. Problem Statement

- **Fragmented intake**: Residents must fill long forms in English, leading to vague titles, missing landmarks, and low participation.
- **Duplicate queue inflation**: Ten citizens reporting the same pothole create ten unlinked tickets instead of one corroborated high-priority work order.
- **Opaque status badges**: Generic "In Progress" labels hide whether an issue was verified, assigned to a crew, or inspected with post-repair proof.
- **Unexplained triage**: Municipal officers need clear, auditable reasoning—not black-box automation—to justify why one street hazard is dispatched before another.

## 3. Project Objectives

1. **Reduce reporting friction** through multimodal photo analysis (`SmartReport AI`) and English/Hindi voice capture.
2. **Prevent duplicate clutter** using spatial proximity (Haversine distance), categorical matching, and semantic comparison (`Duplicate Intelligence`).
3. **Elevate neighbourhood visibility** via ward-level analytics (`CivicPulse`) and interactive spatial filtering (`Neighbourhood Radar`).
4. **Enforce accountability** with a six-stage resolution timeline, community confirmation safeguards, and mandatory human officer sign-off on AI prioritization.

---

## 4. Main Features (Implemented vs. Planned)

### Implemented in This Release

- **Landing Page & Role-Aware Authentication**: Clean editorial overview, email/password signup & login (`scrypt` salted hashes + HMAC-signed Bearer tokens), Citizen & Municipal Authority roles, plus one-click evaluation login buttons.
- **Citizen Home & Civic Impact**: Personalized ward summary, quick launchers for Photo AI / Voice / Radar, nearby community verification cards, and grounded personal impact figures (without gamified leaderboards).
- **SmartReport AI (Photo + Context)**: Server-side Gemini vision analysis suggesting category, headline, description, missing field checklist, and urgency with a plain-language rationale—fully editable before submission.
- **Multilingual Voice Reporting (English & हिन्दी)**: Browser `MediaRecorder` audio capture (plus editable transcript/sample prompts) transcribed and structured into an English report draft while retaining the original Hindi/Hinglish transcript.
- **Duplicate Intelligence**: Real-time proximity (within 350m), category, recency, and Gemini semantic matching against open issues, allowing citizens to confirm or cluster with an existing ticket.
- **Neighbourhood Radar (Explore Map)**: Interactive custom SVG street map of East Bengaluru pilot wards (`Ward 82 Indiranagar`, `Ward 80 Hoysala Nagar`, `Ward 113 Halasuru`, `Ward 79 CV Raman Nagar`) with zoom, proximity radar rings (`500m`, `1km`, `2km`), issue density heatmap toggle, category/severity filters, and resolved toggle.
- **CivicPulse Intelligence**: Ward selector, weekly reported vs. resolved SVG trend chart, common local problems breakdown, emerging hotspot corridors, and recent reports stream.
- **Transparent 6-Stage Resolution Timeline & Community Validation**: Tracks `Submitted` → `Verified` → `Assigned` → `In Progress` → `Evidence Uploaded` → `Resolved`, with before/after visual comparisons, anti-manipulation limits (1 confirmation per user per validation type), and additional evidence uploads.
- **Authority Operations Console**: Explainable AI triage prioritization (always requiring explicit officer `Approve & Assign`), SLA escalation alerts, duplicate cluster grouping, department workload metrics, and inline field/resolution evidence workflows.
- **Responsive Mobile Support**: Mobile-first bottom thumb navigation bar (`<= 56px`) and single-column layouts for `375px+` viewports.

### Prototype Characteristics & Planned Roadmap

- **Current Persistence**: Uses an atomic JSON datastore (`data/civicsense.json` bootstrapped from `server/seedData.ts`) rather than an external managed RDBMS.
- **Current Map Engine**: Uses an interactive bespoke SVG street-grid map (`src/components/NeighbourhoodMap.tsx`) tailored to the East Bengaluru pilot wards rather than third-party tile APIs.
- **Roadmap**:
  - PostGIS / PostgreSQL persistence layer with spatial indexing.
  - Real-time street geocoding and map tile integration (Google Maps / Mapbox).
  - Push / SMS / WhatsApp status notifications for citizens in regional languages.
  - Automated unit and end-to-end Playwright test suite.

---

## 5. AI Capabilities

All AI calls run strictly **server-side** in `server.ts` using the `@google/genai` SDK:

| Capability | Model Used | Purpose | Human-in-the-Loop Safeguard |
| :--- | :--- | :--- | :--- |
| **SmartReport AI** | `gemini-4-hydrogen` | Analyzes uploaded photos + notes to draft category, title, description, missing details, and urgency rationale. | Citizen reviews and edits every field before submitting. |
| **Voice Transcription** | `gemini-3.5-transcribe` | Transcribes recorded Hindi, Hinglish, or English audio into text. | Citizen inspects transcript and structured English draft before posting. |
| **Voice Structuring** | `gemini-4-hydrogen` | Translates/structures spoken Hindi or English transcripts into standardized report fields. | Citizen edits final title, description, and urgency. |
| **Duplicate Intelligence** | `gemini-4-hydrogen` | Explains semantic similarity alongside Haversine spatial proximity and category checks. | Citizen chooses whether to confirm the existing report or submit separately. |
| **Authority Prioritization** | `gemini-4-hydrogen` | Ranks open queue with priority score, suggested department, risk factors, and rationale. | Advisory only; officers must explicitly click `Approve & Assign`. |

---

## 6. Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), Motion (`motion/react`), Lucide Icons (`lucide-react`).
- **Typography**: `Bricolage Grotesque` (display), `Plus Jakarta Sans` (body), `JetBrains Mono` (tabular metrics & IDs).
- **Backend**: Node.js, Express 4 (`tsx server.ts`), `@google/genai` (`^3.6.1`).
- **Storage**: Atomic file-backed JSON database (`data/civicsense.json`) seeded on first launch.

---

## 7. Application Architecture

CivicSense runs as a unified full-stack Express + Vite application on port `3000`:

- **Development**: `tsx server.ts` mounts `vite.middlewares` in SPA middleware mode alongside `/api/*` REST & AI endpoints.
- **Production**: `npm run build` compiles the React client to `dist/`, and `npm start` serves `dist/` statically with Express handling `/api/*` routes.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for detailed diagrams and module responsibilities.

---

## 8. Project Folder Structure

```text
civicsense/
├── .env.example                 # Environment variable template (no secrets)
├── .gitignore                   # Excludes node_modules, dist, .env*, runtime data/
├── CONTRIBUTING.md              # Contribution workflow & standards
├── README.md                    # Project overview and setup guide
├── index.html                   # HTML shell & Google Fonts
├── metadata.json                # Applet metadata & microphone permissions
├── package.json                 # Scripts & dependencies
├── server.ts                    # Express server, API routes, auth & Gemini AI handlers
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite & Tailwind v4 configuration
├── docs/
│   ├── API.md                   # REST & AI endpoint specifications
│   ├── ARCHITECTURE.md          # System architecture & data flow
│   └── DEVELOPMENT.md           # Local dev, demo credentials & troubleshooting
├── server/
│   └── seedData.ts              # Password hashing & initial East Bengaluru civic dataset
└── src/
    ├── App.tsx                  # Root layout, 3-zone header, mobile nav & view state
    ├── api.ts                   # Typed frontend HTTP client with Bearer auth
    ├── index.css                # Tailwind v4 import & CivicSense design tokens
    ├── main.tsx                 # React entry point
    ├── types.ts                 # Shared TypeScript domain interfaces
    ├── components/
    │   ├── CivicBrand.tsx       # Logo mark, status/urgency typography & formatters
    │   ├── CivicIllustrations.tsx # Custom architectural SVGs & resilient image wrapper
    │   └── NeighbourhoodMap.tsx # Interactive SVG map, heatmap, radar ring & pin picker
    └── pages/
        ├── AuthPage.tsx         # Split-pane Login / Signup & demo role access
        ├── AuthorityDashboardPage.tsx # Explainable triage, clusters & SLA analytics
        ├── CitizenHomePage.tsx  # Personalized ward hub & Civic Impact
        ├── CivicPulsePage.tsx   # Ward intelligence, trends & hotspot analytics
        ├── ExploreMapPage.tsx   # Neighbourhood Radar map & filter workspace
        ├── IssueDetailsPage.tsx # 6-stage timeline, validation & officer actions
        ├── LandingPage.tsx      # Public landing page & live ledger preview
        ├── MyReportsPage.tsx    # Searchable personal report ledger
        └── ReportIssuePage.tsx  # SmartReport AI, Voice (EN/HI) & Duplicate Intelligence
```

---

## 9. Installation & Local Development

### Prerequisites

- Node.js `>= 20` (tested on Node `22.x`)
- `npm` (or `bun`)
- A Google Gemini API key (required for AI endpoints)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/civicsense.git
cd civicsense

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and set GEMINI_API_KEY and SESSION_SECRET

# 4. Start the full-stack development server (http://localhost:3000)
npm run dev
```

### Available Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Express + Vite dev middleware on port `3000`. |
| `npm run lint` | Runs `tsc --noEmit` TypeScript verification. |
| `npm run build` | Builds client bundle into `dist/`. |
| `npm start` | Runs Express in production mode serving `dist/`. |
| `npm run clean` | Removes `dist/` and compiled artifacts. |

---

## 10. Environment Variables

Configure these in `.env` (never commit `.env` to Git):

- `GEMINI_API_KEY` *(required for AI features)*: Server-only Gemini API key used by `@google/genai`.
- `SESSION_SECRET` *(recommended in production)*: Secret used to sign HMAC session tokens. If omitted in local development, an ephemeral 256-bit secret is generated at startup.
- `APP_URL` *(optional)*: Public deployment URL.

---

## 11. Database & Seed Data

No external database server is required for local evaluation. On first boot, `server.ts` creates `data/civicsense.json` from `server/seedData.ts` with 11 realistic civic reports across 4 wards and 3 pre-seeded accounts:

- **Citizen**: `ananya@civicsense.in` / `citizen123`
- **Citizen (Hindi preferred)**: `raghav@civicsense.in` / `citizen123`
- **Authority Officer**: `authority@civicsense.in` / `authority123`

To reset local data to the initial seed state, stop the server and delete `data/civicsense.json`.

---

## 12. API Documentation

Full endpoint specs, request/response schemas, and authentication requirements are documented in [`docs/API.md`](docs/API.md).

---

## 13. Deployment

```bash
npm install
npm run build
NODE_ENV=production npm start
```

Set `GEMINI_API_KEY` and a persistent `SESSION_SECRET` in your hosting provider's environment settings (e.g., Cloud Run, Render, Fly.io, or Railway). Note that container platforms with ephemeral filesystems will reset `data/civicsense.json` on redeploy unless mounted to persistent storage or migrated to a managed database.

---

## 14. Screenshots

> Replace the placeholders below with captured screenshots from your running instance (`public/` or `.github/assets/`).

- **Landing Page & Claim-to-Proof Metrics**: `![Landing Page](docs/screenshots/landing.png)`
- **SmartReport AI & Duplicate Intelligence**: `![Report Issue](docs/screenshots/report-issue.png)`
- **Neighbourhood Radar Map**: `![Explore Map](docs/screenshots/explore-map.png)`
- **CivicPulse Ward Analytics**: `![CivicPulse](docs/screenshots/civicpulse.png)`
- **Authority Triage & Explainable AI**: `![Authority Console](docs/screenshots/authority-dashboard.png)`
- **Transparent 6-Stage Issue Timeline**: `![Issue Details](docs/screenshots/issue-details.png)`

---

## 15. Security Considerations

- **Server-Side AI Execution**: `GEMINI_API_KEY` is read exclusively inside `server.ts` and is never bundled into `src/`.
- **Password Hashing**: Account passwords are hashed using per-user 16-byte random salts with `crypto.scryptSync` and compared using `crypto.timingSafeEqual`.
- **Stateless Signed Tokens**: Session tokens are HMAC-SHA256 signed on the server. Set a strong `SESSION_SECRET` in production.
- **Anti-Manipulation Guardrails**: Community validation prevents duplicate voting (`still_exists`, `confirm_resolved`, `support`) from the same authenticated account.
- **Human-in-the-Loop Governance**: AI prioritization recommendations never alter official ticket status or department assignments without authenticated officer action.

---

## 16. Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for development guidelines, code checks, and pull request expectations.
