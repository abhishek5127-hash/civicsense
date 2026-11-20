# Development Guide

## Local Environment Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure `.env`**
   ```bash
   cp .env.example .env
   ```
   Set `GEMINI_API_KEY` to a valid Google AI Studio Gemini API key. Optionally set `SESSION_SECRET` to keep login sessions valid across server restarts.

3. **Run development server**
   ```bash
   npm run dev
   ```
   The app and API will be served at `http://localhost:3000`.

## Demo Credentials

The initial seed dataset (`server/seedData.ts`) creates three accounts in `data/civicsense.json` for testing:

| Role | Email | Password | Ward / Scope |
| :--- | :--- | :--- | :--- |
| Citizen | `ananya@civicsense.in` | `citizen123` | Ward 82 · Indiranagar |
| Citizen (Hindi) | `raghav@civicsense.in` | `citizen123` | Ward 82 · Indiranagar |
| Authority Officer | `authority@civicsense.in` | `authority123` | Municipal Operations Command |

## Testing AI Workflows Without External Media

- **Photo AI**: On the **Report Issue** screen, click `Road Pothole`, `Streetlight Outage`, or `Waste Overflow` to generate a realistic PNG street scene on an HTML5 canvas and send it directly to `/api/ai/smart-report`.
- **Hindi / English Voice**: If running in an environment without microphone hardware, click `Sample हिन्दी Report` or `Sample English Report` and click `Structure Transcript` to test `/api/ai/voice-report`.

## Verification Commands

```bash
# TypeScript type-checking
npm run lint

# Production client bundle check
npm run build

# Start production build locally
NODE_ENV=production npm start
```

## Troubleshooting

- **`GEMINI_API_KEY is not configured`**: Ensure `.env` exists at the project root with a valid `GEMINI_API_KEY` and restart `npm run dev`.
- **Voice microphone blocked**: Browsers require HTTPS or `localhost` for `navigator.mediaDevices.getUserMedia`. Use the text/transcript box as a fallback when testing over plain HTTP LAN IPs.
- **Resetting local data**: Stop the server and remove `data/civicsense.json`; it will regenerate cleanly on next startup.
