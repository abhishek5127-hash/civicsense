# Contributing to CivicSense

Thank you for helping improve CivicSense. Please keep contributions aligned with the project's calm, accessible, and transparent civic design principles.

## Development Workflow

1. Fork or branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Install dependencies and copy `.env.example` to `.env`:
   ```bash
   npm install
   cp .env.example .env
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Before opening a pull request, verify TypeScript checks and the production Vite build pass cleanly:
   ```bash
   npm run lint
   npm run build
   ```

## Coding & Architecture Guidelines

- **TypeScript**: Keep shared domain models in `src/types.ts` synchronized between `server.ts` and `src/`.
- **Server-Side AI**: All `@google/genai` calls must stay in `server.ts`. Never import `@google/genai` or expose `GEMINI_API_KEY` in client files.
- **Explainable AI & Governance**: Any new AI triage or recommendation endpoint must include transparent reasoning and require explicit human approval before mutating official civic records.
- **Accessibility & Design Consistency**:
  - Maintain WCAG AA contrast and `focus-visible` states on interactive controls.
  - Use tabular numerals (`tabular-nums`) for IDs, timestamps, and metrics.
  - Avoid pill-badge clutter on static metadata; reserve color signals with paired text labels.

## Security & Privacy

- Never commit `.env`, API keys, tokens, or `data/civicsense.json` runtime snapshots.
- Report security concerns directly to the repository maintainers before opening a public issue.
