# CivicSense API Reference

Base URL: `/api` (served on port `3000`)

Authenticated routes expect:
```http
Authorization: Bearer <token>
```

---

## Health

### `GET /api/health`
Returns server readiness and total stored report count.
- **Response `200`**: `{ "ok": true, "reportCount": 11 }`

---

## Authentication

### `POST /api/auth/login`
Authenticates an existing Citizen or Authority account.
- **Body**: `{ "email": string, "password": string }`
- **Response `200`**: `{ "token": string, "user": UserProfile }`
- **Errors**: `400` missing fields, `401` invalid credentials.

### `POST /api/auth/signup`
Registers a new user account.
- **Body**: `{ "name": string, "email": string, "password": string, "role": "citizen" | "authority", "ward": string, "preferredLanguage": "en" | "hi", "department"?: string }`
- **Response `201`**: `{ "token": string, "user": UserProfile }`
- **Errors**: `400` validation error, `409` duplicate email.

### `GET /api/auth/me` *(Auth required)*
Returns the profile for the current Bearer token.
- **Response `200`**: `{ "user": UserProfile }`

---

## Civic Reports & Validation

### `GET /api/reports`
Lists civic reports ordered newest-first.
- **Query params**: `ward`, `category`, `status` (`All` | `Open` | specific stage), `urgency`, `search`, `mine` (`true`), `userId`.
- **Response `200`**: `{ "reports": CivicReport[] }`

### `GET /api/reports/:id`
Returns a single report and any other reports sharing its `duplicateClusterId`.
- **Response `200`**: `{ "report": CivicReport, "relatedReports": CivicReport[] }`
- **Errors**: `404` report not found.

### `POST /api/reports` *(Auth required)*
Creates a new civic issue report and initializes the `Submitted` timeline stage.
- **Body**: `{ "title", "description", "category", "urgency", "urgencyReason"?, "ward", "address", "mapX", "mapY", "imageData"?, "languageReported", "originalTranscript"?, "linkedClusterId"? }`
- **Response `201`**: `{ "report": CivicReport }`

### `POST /api/reports/:id/validate` *(Auth required)*
Records a community confirmation or additional evidence. Enforces 1 action per user per type for `still_exists`, `confirm_resolved`, and `support`.
- **Body**: `{ "type": "still_exists" | "confirm_resolved" | "support" | "evidence", "note"?, "evidenceImage"? }`
- **Response `200`**: `{ "report": CivicReport }`
- **Errors**: `409` duplicate confirmation attempt, `400` missing evidence content.

### `PATCH /api/reports/:id/authority` *(Authority role required)*
Advances official municipal workflow stages with human officer attribution.
- **Body**: `{ "action": "verify" | "assign" | "start_work" | "upload_evidence" | "resolve" | "approve_priority", "department"?, "officer"?, "note"?, "resolutionEvidenceImage"?, "urgency"? }`
- **Response `200`**: `{ "report": CivicReport }`
- **Errors**: `403` non-authority user, `400` missing department or missing resolution evidence.

---

## Neighbourhood Intelligence & Impact

### `GET /api/civicpulse`
Aggregates ward summary metrics, category distributions, emerging hotspots, weekly trends, and recent reports.
- **Query params**: `ward` (`All` or specific ward name)
- **Response `200`**: `{ summary, categoryCounts, wardBreakdown, hotspots, trends, recentReports }`

### `GET /api/citizen/impact` *(Auth required)*
Returns personal contribution metrics and home-ward resolution rate for the signed-in user.
- **Response `200`**: `{ submittedCount, verifiedCount, resolvedCount, communityContributions, wardResolutionRate, wardOpenCount }`

---

## Gemini AI Endpoints

### `POST /api/ai/smart-report` *(Auth required)*
Uses `gemini-4-hydrogen` to analyze an uploaded photo (`data:image/...;base64,...`) and/or citizen notes.
- **Body**: `{ "imageData"?: string, "notes"?: string, "address"?: string }`
- **Response `200`**: `{ "suggestion": { category, title, description, missingInfo, urgency, urgencyReason, imageSummary } }`

### `POST /api/ai/voice-report` *(Auth required)*
Transcribes spoken audio via `gemini-3.5-transcribe` (when `audioData` is supplied) and structures Hindi/Hinglish/English complaints via `gemini-4-hydrogen`.
- **Body**: `{ "audioData"?: string, "mimeType"?: string, "transcriptText"?: string, "languageHint": "en" | "hi" | "mixed" }`
- **Response `200`**: `{ "result": { transcript, detectedLanguage, englishSummary, category, title, description, missingInfo, urgency, urgencyReason } }`

### `POST /api/reports/check-duplicates` *(Auth required)*
Computes spatial Haversine proximity, category, recency, and Gemini semantic similarity against open reports.
- **Body**: `{ "title"?, "description"?, "category"?, "mapX"?, "mapY"? }`
- **Response `200`**: `{ "candidates": DuplicateCandidate[] }`

### `POST /api/ai/prioritize` *(Authority role required)*
Evaluates open reports via `gemini-4-hydrogen` to produce ranked, explainable triage recommendations (`priorityScore`, `suggestedDepartment`, `reasoning`, `riskFactors`). Does **not** automatically change ticket status or assignment.
- **Response `200`**: `{ "recommendations": AuthorityPriorityRecommendation[] }`
