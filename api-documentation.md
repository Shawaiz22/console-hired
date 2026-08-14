# API Documentation — Console.Hired

REST API for the AI Resume Analyzer & Mock Interview Platform.
Team **Console.log("Winners")** · RICR-HIM-1024 · HackInMotion 2026.

- **Base URL (local):** `http://localhost:3000`
- **Base URL (hosted):** `https://console-hired.vercel.app`
- **Version prefix:** `/api/v1`
- **Content type:** `application/json` unless a route states `multipart/form-data`

A ready-to-run Postman collection lives at [`docs/postman-collection.json`](docs/postman-collection.json).

## Contents

- [Authentication](#authentication)
- [Conventions](#conventions)
- [Auth Endpoints](#auth-endpoints)
- [Resume Endpoints](#resume-endpoints)
- [Job Description Endpoints](#job-description-endpoints)
- [Analysis Endpoints](#analysis-endpoints)
- [Interview Endpoints](#interview-endpoints)
- [Dashboard Endpoints](#dashboard-endpoints)
- [Error Reference](#error-reference)

## Authentication

> **There is no bearer token.** Sessions are JWTs, but NextAuth v5 stores them in an
> **httpOnly, encrypted (JWE) cookie**. `Authorization: Bearer <token>` will **not** authenticate,
> and the token cannot be minted by hand because it is encrypted with `AUTH_SECRET`.

Protected endpoints read the `authjs.session-token` cookie (`__Secure-authjs.session-token` over
HTTPS). Unauthenticated requests receive `401` with a JSON body — never a redirect.

### Option A — Postman (recommended)

Postman keeps a cookie jar, so it can perform the same sign-in flow a browser does. Two requests,
then every subsequent request is authenticated:

```http
### 1. Get a CSRF token
GET {{baseUrl}}/api/auth/csrf
→ 200 { "csrfToken": "abc123..." }
```

```http
### 2. Sign in with credentials
POST {{baseUrl}}/api/auth/callback/credentials
Content-Type: application/x-www-form-urlencoded

csrfToken=abc123...&email=you@example.com&password=YourPassword123
→ 302, sets authjs.session-token in the cookie jar
```

The included collection does step 1 automatically via a test script and stores `csrfToken` as a
variable.

**The account must be verified.** `auth.ts` rejects sign-in when `emailVerified` is null, so
register and complete the OTP flow once before using the API.

### Option B — Copy the cookie from a browser

1. Sign in at `/login` in the browser.
2. DevTools → Application → Cookies → copy the `authjs.session-token` value.
3. Send it as a header:

```bash
curl http://localhost:3000/api/v1/resumes \
  -H "Cookie: authjs.session-token=PASTE_VALUE_HERE"
```

### Why a cookie rather than localStorage

An httpOnly cookie is unreadable from JavaScript, so a cross-site scripting bug cannot exfiltrate
the session. The trade-off is that non-browser clients must carry the cookie, which is what the two
recipes above do.

## Conventions

**Ownership.** Every protected query is scoped by `userId` in SQL. Requesting another user's
resource returns `404`, not `403`, so IDs cannot be enumerated.

**Validation.** Bodies are parsed with Zod. On failure the first issue's message is returned:
`{ "error": "Answer must be at least 50 characters for AI evaluation" }`.

**Path parameters.** All `:id` values must be UUIDs; malformed IDs return `400`.

**AI failures are surfaced, never faked.** If a model call fails, the endpoint returns `503` with a
retryable message rather than substituting canned content.

## Auth Endpoints

These three are public. Session sign-in and sign-out are handled by NextAuth at
`/api/auth/[...nextauth]`.

### `POST /api/v1/auth/register`

Create an account and dispatch a verification code.

```json
{ "name": "Aisha Khan", "email": "aisha@example.com", "password": "SecurePass123" }
```

| Field      | Rules            |
| ---------- | ---------------- |
| `name`     | min 2 characters |
| `email`    | valid email      |
| `password` | min 8 characters |

**`201 Created`** — new account, OTP sent:

```json
{
  "user": { "id": "…", "name": "Aisha Khan", "email": "aisha@example.com" },
  "requiresVerification": true
}
```

**`200 OK`** — account already existed without a password (e.g. previously Google-only) and has now
been linked; `requiresVerification: false`.

| Status | Meaning                                   |
| -----: | ----------------------------------------- |
|    400 | Validation failed                         |
|    409 | An account with this email already exists |
|    500 | Unexpected error                          |

Passwords are hashed with bcrypt (cost 10) before storage.

### `POST /api/v1/auth/send-otp`

Request a fresh 6-digit code.

```json
{ "email": "aisha@example.com" }
```

**`200 OK`** — always returns the same body whether or not the account exists, to avoid disclosing
which emails are registered:

```json
{ "message": "If an account exists, a verification code has been sent." }
```

| Status | Meaning                                                                |
| -----: | ---------------------------------------------------------------------- |
|    400 | Invalid email                                                          |
|    429 | Cooldown active — includes `retryAfter` in seconds (60s between sends) |
|    500 | Email dispatch failed                                                  |

### `POST /api/v1/auth/verify-otp`

Verify a code and mark the email confirmed.

```json
{ "email": "aisha@example.com", "code": "123456" }
```

**`200 OK`** → `{ "message": "Email verified successfully." }`

| Status | Meaning                                                                   |
| -----: | ------------------------------------------------------------------------- |
|    400 | Invalid, expired, or missing code — includes `attemptsRemaining`          |
|    429 | Five failed attempts; the code is deleted and a new one must be requested |
|    500 | Unexpected error                                                          |

Codes are stored as SHA-256 hashes with an expiry and an attempt counter — never in plain text.

## Resume Endpoints

### `POST /api/v1/resumes` 🔒

Upload a resume. Text is extracted synchronously; structured parsing runs in the background.

**Request:** `multipart/form-data` with a single `file` field (PDF or DOCX, ≤ 5 MB).

```bash
curl -X POST http://localhost:3000/api/v1/resumes \
  -H "Cookie: authjs.session-token=…" \
  -F "file=@resume.pdf"
```

**`201 Created`**

```json
{ "resume": { "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "fileName": "resume.pdf" } }
```

| Status | Meaning                                                            |
| -----: | ------------------------------------------------------------------ |
|    400 | No file provided, or file exceeds 5 MB                             |
|    401 | Not authenticated                                                  |
|    422 | Extraction failed — body includes a `code` such as `NO_TEXT_LAYER` |
|    500 | Unexpected error                                                   |

`422` most commonly means a scanned or image-only PDF with no selectable text.

Parsed output is cached by SHA-256 of the extracted text, so re-uploading an identical document
reuses the previous parse.

### `GET /api/v1/resumes` 🔒

List the caller's resumes, newest first.

**`200 OK`** → `{ "resumes": [ { "id": "…", "fileName": "…", "rawText": "…", "parsed": { … }, "createdAt": "…" } ] }`

`parsed` is `null` until background parsing completes.

## Job Description Endpoints

### `POST /api/v1/job-descriptions` 🔒

Accepts **either** JSON with pasted text **or** `multipart/form-data` with a file.

JSON body:

```json
{
  "rawText": "We are looking for a Senior React Engineer…",
  "title": "Senior React Engineer",
  "company": "Acme"
}
```

| Field     | Rules              |
| --------- | ------------------ |
| `rawText` | min 100 characters |
| `title`   | optional           |
| `company` | optional           |

Multipart alternative: `file` (PDF/DOCX, ≤ 5 MB) or `rawText`, plus optional `title`/`company`.

**`201 Created`** → `{ "jobDescription": { "id": "…", "title": "…", "company": "…" } }`

| Status | Meaning                                                      |
| -----: | ------------------------------------------------------------ |
|    400 | Text under 100 characters, no file/`rawText`, or file > 5 MB |
|    401 | Not authenticated                                            |
|    422 | Extraction failed (includes `code`)                          |
|    500 | Unexpected error                                             |

### `GET /api/v1/job-descriptions` 🔒

**`200 OK`** → `{ "jobDescriptions": [ … ] }`, newest first.

## Analysis Endpoints

### `POST /api/v1/analyses` 🔒

Start an analysis. Returns immediately; scoring runs asynchronously.

```json
{ "resumeId": "3fa85f64-…", "jobDescriptionId": "7c9e6679-…" }
```

**`202 Accepted`** → `{ "id": "9b1deb4d-…" }`

Poll `GET /api/v1/analyses/:id` until `status` is `complete` or `failed`.

| Status | Meaning                                            |
| -----: | -------------------------------------------------- |
|    400 | Invalid JSON, or an ID is not a UUID               |
|    401 | Not authenticated                                  |
|    404 | Resume or job description not found (or not yours) |

### `GET /api/v1/analyses/:id` 🔒

**`200 OK`**

```json
{
  "analysis": {
    "id": "9b1deb4d-…",
    "status": "complete",
    "overallScore": 78,
    "breakdown": {
      "skillCoverage": 82,
      "experienceFit": 70,
      "responsibilityEvidence": 75,
      "atsHygiene": 90
    },
    "evidenceMap": [{ "responsibility": "…", "evidence": "…", "strength": "strong" }],
    "gaps": [{ "skill": "Kubernetes", "severity": "high", "why": "…" }],
    "suggestions": [{ "original": "…", "improved": "…", "rationale": "…" }],
    "completedAt": "2026-08-14T09:12:00.000Z",
    "createdAt": "2026-08-14T09:11:20.000Z"
  }
}
```

`overallScore` is a weighted composite: skill coverage 40%, responsibility evidence 30%,
experience fit 20%, ATS hygiene 10%. The same inputs always produce the same score.

| Status | Meaning                               |
| -----: | ------------------------------------- |
|    400 | `id` is not a valid UUID              |
|    401 | Not authenticated                     |
|    404 | Not found, or belongs to another user |

While `status` is `pending` or `processing`, score fields are `null`. On `failed`, `errorMessage`
explains why.

## Interview Endpoints

### `POST /api/v1/interviews` 🔒

Generate a six-question interview (four technical, two behavioural) grounded in the given resume
and job description.

```json
{ "resumeId": "3fa85f64-…", "jobDescriptionId": "7c9e6679-…" }
```

**`201 Created`**

```json
{
  "session": {
    "id": "5a8f1c2e-…",
    "questions": [
      {
        "id": "q1",
        "question": "Walk me through how you structured state in the dashboard you built with Redux Toolkit.",
        "type": "technical",
        "targetSkill": "State management",
        "whyAsked": "The role owns a large client-side data layer and your resume claims RTK experience."
      }
    ]
  }
}
```

| Status | Meaning                                            |
| -----: | -------------------------------------------------- |
|    400 | Validation failed                                  |
|    401 | Not authenticated                                  |
|    404 | Resume or job description not found (or not yours) |
|    503 | Question generation failed — retry                 |

### `GET /api/v1/interviews/:id` 🔒

Fetch a session with any answers already submitted. Supports resuming: the client lands on the
first unanswered question.

**`200 OK`** → `{ "session": { … }, "answers": [ … ] }`

| Status | Meaning                               |
| -----: | ------------------------------------- |
|    400 | `id` is not a valid UUID              |
|    401 | Not authenticated                     |
|    404 | Not found, or belongs to another user |

### `POST /api/v1/interviews/:id/answers` 🔒

Submit one answer and receive a rubric-based evaluation.

```json
{ "questionIndex": 0, "answerText": "At Acme I owned the migration of a 40-screen dashboard…" }
```

| Field           | Rules                            |
| --------------- | -------------------------------- |
| `questionIndex` | integer, 0–5                     |
| `answerText`    | min 50 characters after trimming |

**`200 OK`**

```json
{
  "answer": {
    "questionIndex": 0,
    "answerText": "…",
    "evaluation": {
      "clarity": 4,
      "relevance": 5,
      "completeness": 3,
      "specificity": 4,
      "star": {
        "situation": "40-screen dashboard on legacy Redux",
        "task": "Migrate without regressions",
        "action": "Introduced RTK Query incrementally behind flags",
        "result": "Cut boilerplate 60%, zero rollbacks"
      },
      "strengths": ["Concrete architecture detail", "Quantified the outcome"],
      "improvements": ["Name the trade-offs you rejected"]
    }
  }
}
```

Each dimension is scored 1–5. `star` is populated for behavioural answers and `null` otherwise.

| Status | Meaning                                                         |
| -----: | --------------------------------------------------------------- |
|    400 | Invalid JSON, answer too short, or `questionIndex` out of range |
|    401 | Not authenticated                                               |
|    404 | Session not found, or belongs to another user                   |
|    500 | Evaluation succeeded but could not be saved                     |
|    503 | Grading model unavailable — retry                               |

### `POST /api/v1/interviews/:id/complete` 🔒

Close the session, compute the final score, and generate a summary. No request body.

**`200 OK`**

```json
{
  "session": {
    "id": "5a8f1c2e-…",
    "status": "completed",
    "overallScore": 81,
    "summary": {
      "overallImpression": "Strong technical depth with quantified outcomes…",
      "topStrengths": ["Concrete architectural reasoning", "…"],
      "focusAreas": ["State trade-offs explicitly", "…"]
    }
  }
}
```

`overallScore` is the mean of all four dimensions across every graded answer, scaled to 100 — it is
derived from stored evaluations, never a default.

| Status | Meaning                                       |
| -----: | --------------------------------------------- |
|    400 | Not a UUID, or no answers submitted yet       |
|    401 | Not authenticated                             |
|    404 | Session not found, or belongs to another user |
|    500 | Unexpected error                              |

If summary generation fails, the session still completes with a real `overallScore` and
`summary: null`; the UI states that the summary is unavailable rather than showing invented text.

## Dashboard Endpoints

### `GET /api/v1/stats` 🔒

Aggregate counts, best scores, recent activity, and dated score history for the signed-in user.

**`200 OK`**

```json
{
  "resumeCount": 3,
  "analysisCount": 5,
  "interviewCount": 2,
  "bestScore": 84,
  "recentAnalyses": [
    { "id": "…", "overallScore": 78, "jobTitle": "Senior React Engineer", "createdAt": "…" }
  ],
  "recentSessions": [{ "id": "…", "overallScore": 81, "jobTitle": "…", "startedAt": "…" }],
  "scoreHistory": [{ "date": "2026-08-13", "matchScore": 72, "interviewScore": null }]
}
```

In `scoreHistory`, `null` means no score was recorded that day — the chart gaps rather than
interpolating.

| Status | Meaning           |
| -----: | ----------------- |
|    401 | Not authenticated |
|    500 | Query failed      |

## Error Reference

Every error response has the shape `{ "error": "<human-readable message>" }`, sometimes with an
extra field (`code`, `retryAfter`, `attemptsRemaining`).

| Status | When                                                                |
| -----: | ------------------------------------------------------------------- |
|    400 | Zod validation failed, malformed JSON, or a non-UUID path parameter |
|    401 | Missing or invalid session cookie                                   |
|    404 | Resource absent **or** owned by another user                        |
|    409 | Conflict — email already registered                                 |
|    422 | File uploaded but text could not be extracted (includes `code`)     |
|    429 | Rate limited — OTP cooldown or too many verification attempts       |
|    500 | Unexpected server error (logged server-side)                        |
|    503 | Upstream AI provider unavailable — safe to retry                    |

🔒 = requires an authenticated session cookie.
