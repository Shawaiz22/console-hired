# HackInMotion — AI Resume Analyzer & Mock Interview Platform

## Execution Roadmap (12–15 Aug 2026)

**Legend:** `[ ]` pending · `[~]` in progress · `[x]` done · `[!]` blocked
**Owners:** **S** = Shawaiz (shell, auth, design system, analysis UI, dashboard, pitch) · **B** = Ingestion & Scoring · **C** = Interview, Voice & Video

> Commit convention: `[B-04] Implemented DOCX text extraction with mammoth`
> Task IDs in commit messages make the daily Git evaluation trivially easy for the committee to read.

---

## Milestone Gates (the only dates that matter)

| Gate   | When          | Must be true                                             |
| ------ | ------------- | -------------------------------------------------------- |
| **M0** | 12 Aug, +2h   | Repo live, contracts frozen, everyone unblocked          |
| **M1** | 12 Aug, night | Deployed URL with working auth + DB. Anyone can sign up. |
| **M2** | 13 Aug, night | End-to-end walkthrough works with **fake** intelligence  |
| **M3** | 14 Aug, noon  | Real parsing + real scoring engine live                  |
| **M4** | 14 Aug, night | Real interview module live. **FEATURE FREEZE.**          |
| **M5** | 15 Aug, 10:00 | Bonus features in or cut. No new code after this.        |
| **M6** | 15 Aug, noon  | Docs, seed data, deck done. 3 rehearsals complete.       |

**Rule:** if a gate slips, cut scope — never slip the gate. The cut list is at the bottom.

---

# PHASE 0 — Contracts (12 Aug, first 2 hours, ALL THREE TOGETHER)

Do not split up before this is done. Two hours here saves ten hours of integration pain later.

- [ ] `[P-01]` **S** — Create repo `HackInMotion-<TeamCode>`, add both members as contributors, push Next.js scaffold. **Do this in the first hour** — "repo created only on final day" is a listed disqualifier.
- [ ] `[P-02]` **S** — `main` + 3 feature branches. Protect `main`, require PR to merge.
- [ ] `[P-03]` **All** — Write `src/lib/schemas.ts`: `ResumeSchema`, `JDSchema`, `AnalysisResult`, `InterviewQuestion`, `AnswerEvaluation`, `ATSReport`, `DeliveryMetrics`, `BodyLanguageReport`. **This is the single most important file in the project.**
- [ ] `[P-04]` **All** — Write `src/lib/fixtures/*.json`: one hardcoded valid example per schema. Everyone builds against these until real data exists.
- [ ] `[P-05]` **B** — DB schema: `users`, `resumes`, `job_descriptions`, `analyses`, `interview_sessions`, `interview_answers`. Push migration.
- [ ] `[P-06]` **S** — Empty `README.md` with all 15 required headings from Section 8, committed. Fill progressively, never at the end.
- [ ] `[P-07]` **All** — `.env.example` committed. Share real keys over a private channel.

**Gate M0:** three people can now work for 8 hours without talking to each other.

---

# PHASE 1 — Skeleton (12 Aug, rest of day → night)

Goal: **a deployed URL where a stranger can sign up.** Ugly is fine.

### Lane S — Shell & Auth

- [ ] `[S-01]` Next.js App Router + Tailwind + shadcn/ui installed, 8–10 base components pulled
- [ ] `[S-02]` NextAuth (credentials + Google), session wired to DB
- [ ] `[S-03]` Route protection middleware — `/dashboard/*` requires session
- [ ] `[S-04]` App shell: sidebar, header, user menu, mobile nav
- [ ] `[S-05]` Deploy to Vercel + Neon. **Get the live URL today.**
- [ ] `[S-06]` Design tokens locked: colour scale, type scale, spacing. Encouraging + professional, not clinical.

### Lane B — Ingestion pipeline

- [ ] `[B-01]` `POST /api/v1/resumes` — multipart upload, 5MB cap, MIME allowlist
- [ ] `[B-02]` PDF text extraction with `unpdf` _(not `pdf-parse` — it crashes on Vercel)_
- [ ] `[B-03]` DOCX extraction with `mammoth`
- [ ] `[B-04]` Guard: extracted text < 200 chars → typed error "looks like a scanned image"
- [ ] `[B-05]` Persist raw text + SHA-256 hash (hash enables parse caching later)

### Lane C — Interview scaffolding

- [ ] `[C-01]` Vercel AI SDK installed, Gemini + Groq providers configured, keys verified with a hello-world call
- [ ] `[C-02]` `POST /api/v1/interviews` — creates a session from fixtures, returns questions
- [ ] `[C-03]` Interview UI shell: question card, textarea, next/submit, progress bar
- [ ] `[C-04]` Session state machine: `pending → in_progress → complete`, resumable on refresh

**Gate M1:** live URL, sign up, land on an empty dashboard. Everyone has ≥3 commits.

---

# PHASE 2 — Vertical Slice (13 Aug)

Goal: **the whole user journey clicks end to end using fixture data.** No real AI yet. This is the day that decides whether you finish.

### Morning — wire the fake path

- [ ] `[S-07]` Upload page: dropzone, file validation, progress, error states
- [ ] `[S-08]` JD input page: paste textarea + file upload, min-length validation
- [ ] `[S-09]` Analysis results page rendering **fixture** `AnalysisResult` — score ring, requirement checklist, gap list, suggestions
- [ ] `[B-06]` `POST /api/v1/job-descriptions` — store + return ID
- [ ] `[B-07]` `POST /api/v1/analyses` — returns fixture result, `status: complete`
- [ ] `[C-05]` Answer submit → returns fixture `AnswerEvaluation` → renders feedback card

### Afternoon — real structured extraction begins

- [ ] `[B-08]` `generateObject` + `ResumeSchema` → real parsed resume. **First real AI win.**
- [ ] `[B-09]` `generateObject` + `JDSchema` → required skills, nice-to-haves, seniority, responsibility bullets
- [ ] `[B-10]` Parse cache keyed on text hash (saves your free tier during 3 days of testing)
- [ ] `[C-06]` Real question generation grounded in parsed resume + JD, with `whyAsked` field
- [ ] `[C-07]` Persist questions upfront — session survives a refresh mid-demo
- [ ] `[S-10]` Dashboard: list of past analyses + sessions (empty states designed, not blank)

### Night

- [ ] `[S-11]` Loading/skeleton states everywhere. No unstyled spinners.
- [ ] `[ALL]` Merge day: all three branches into `main`, cross-review PRs, deploy, smoke test

**Gate M2:** click through upload → JD → results → interview → history without touching code. Everyone ≥6 commits.

---

# PHASE 3 — Real Intelligence (14 Aug)

Goal: replace every fixture with real logic. **Hardest day — protect it from scope creep.**

### Lane B — The scoring engine _(your differentiator)_

- [ ] `[B-11]` Skill normaliser + alias map (~80 entries: `js→javascript`, `k8s→kubernetes`, `postgres→postgresql`)
- [ ] `[B-12]` Skill coverage — exact → alias → embedding match ≥0.75. Required weighted 2× nice-to-have. **(40%)**
- [ ] `[B-13]` Experience/seniority fit — pure arithmetic on date ranges vs JD range **(20%)**
- [ ] `[B-14]` Embed JD responsibilities + resume bullets (`text-embedding-004`), batch call, store as JSONB
- [ ] `[B-15]` Cosine similarity matrix → best resume bullet per JD requirement; <0.55 = **unevidenced** **(30%)**
- [ ] `[B-16]` Weighted final score + per-component breakdown returned to UI
- [ ] `[B-17]` LLM pass for qualitative output only: rewritten bullets + gap explanations

### Lane C — Real evaluation

- [ ] `[C-08]` Rubric prompt with explicit anchors (what a 2 vs a 4 looks like) → clarity / relevance / completeness / specificity
- [ ] `[C-09]` STAR detection for behavioural answers → 4 chips, missing ones greyed out
- [ ] `[C-10]` Adaptive follow-up question when a score is low
- [ ] `[C-11]` End-of-session performance summary + per-question breakdown

### Lane S — The screens judges look at

- [ ] `[S-12]` Requirement checklist UI: each JD requirement + the exact resume line evidencing it (green) or "no evidence found" (red). **This is the demo money shot.**
- [ ] `[S-13]` Score breakdown UI — show the four weighted components, not just one number
- [ ] `[S-14]` `streamObject` wired so score → gaps → suggestions populate progressively
- [ ] `[S-15]` Progress chart over time (recharts) — match score + interview score trend
- [ ] `[S-16]` Full mobile pass on every screen

### Evening — bonus round (ONLY if the above is genuinely done)

- [ ] `[B-18]` **ATS checker** — `pdfjs-dist` `getTextContent()`, cluster x-positions for multi-column, detect header/footer contact info, non-standard headings, tables
- [ ] `[S-17]` ATS side-by-side view: rendered resume vs the garbled linear text an ATS actually sees
- [ ] `[C-12]` **Voice input** — Web Speech API, `continuous` + `interimResults`; Groq Whisper fallback for Safari
- [ ] `[C-13]` Delivery metrics: WPM, filler-word regex, pause count, time-to-first-word

**Gate M4 — FEATURE FREEZE at end of day.** Everyone ≥9 commits.

---

# PHASE 4 — Stretch & Polish (15 Aug, morning only)

### Optional — video, only if M4 landed clean

- [ ] `[C-14]` `@mediapipe/tasks-vision` — FaceLandmarker + PoseLandmarker, sample at 5–8fps
- [ ] `[C-15]` Eye contact from `facialTransformationMatrix` yaw/pitch, ±20° = on-camera
- [ ] `[C-16]` Posture from shoulder-line angle + nose-to-shoulder distance drift
- [ ] `[C-17]` Smile % from blendshapes; fidget = rolling variance of nose/wrist landmarks
- [ ] `[S-18]` Eye-contact timeline chart per question (the dip on the hard question tells a story)
- [ ] `[S-19]` Privacy banner: "all video analysis runs in your browser — nothing is uploaded." Say this in the pitch too.

### Non-negotiable finishing tasks

- [ ] `[F-01]` **B** — Seed demo account with 4–5 prior sessions so the progress chart has a real upward curve. _An empty chart reads as a broken feature._
- [ ] `[F-02]` **All** — Deliberate failure-path test: corrupt PDF, scanned image, empty JD, API timeout. Each shows a helpful message.
- [ ] `[F-03]` **S** — `architecture-diagram.png`
- [ ] `[F-04]` **B** — `api-documentation.md` — every `/api/v1/*` route with request/response
- [ ] `[F-05]` **C** — README section: which AI services, **why chosen**, how integrated _(explicitly required by the problem statement)_
- [ ] `[F-06]` **S** — Complete README (all 15 sections) + screenshots
- [ ] `[F-07]` **S** — `presentation.pptx`
- [ ] `[F-08]` **All** — 3 timed rehearsals of the demo, out loud

---

## Demo Script (rehearse this exact sequence, <4 min)

1. Log in to the seeded account — history already visible
2. Upload a **real** resume + a **real** job posting
3. Streaming analysis: score appears, then gaps, then suggestions
4. Requirement checklist — point at one green evidenced line and one red gap
5. One rewritten bullet, before/after
6. ATS side-by-side — the garbled text lands hard
7. Two interview questions, one answered by voice
8. Feedback card with STAR chips
9. Progress chart trending up
10. Trigger one error deliberately, show graceful recovery

No dead air. Every person speaks about the part they built.

---

## Cut List (sacrifice in this order)

1. Video / body language `[C-14…C-17]`
2. Whisper fallback `[C-12 fallback]`
3. Adaptive follow-ups `[C-10]`
4. Resume rewriter `[B-17]` — degrade to gap list only
5. ATS checker `[B-18]`

**Never cut:** auth, the scoring engine, the requirement checklist, history/progress, README, deployment.

---

## Daily Ritual

**Morning (15 min):** each person states yesterday's done / today's target / blockers. Update this file, commit it.
**Evening (30 min):** merge all branches to `main`, cross-review PRs, deploy, smoke test the full journey on the live URL.

**Push at the end of every working block.** The committee reviews daily — a repo that visibly grows each day earns "development consistency" for free. 10+ meaningful commits each, spread across all three days.

---

## Viva Prep — each person must be able to explain

| Owner | Must defend                                                                                                                                                             |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S** | Auth flow, session strategy, route protection, why App Router, streaming UI, responsive strategy                                                                        |
| **B** | Why hybrid scoring beats "ask the LLM for a number", the 4 weights, cosine threshold choice, embedding model choice, scaling answer (**pgvector + HNSW index on Neon**) |
| **C** | Rubric anchor design, why Groq for evaluation vs Gemini for extraction (latency profile), Web Speech vs Whisper tradeoff, client-side inference privacy argument        |

Everyone should be able to sketch the architecture diagram from memory.
