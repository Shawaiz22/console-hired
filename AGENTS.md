# Developer & Agent Guidelines — console.hired

This document defines the mandatory workflow rules, architectural standards, file structure conventions, and security policies for all developers and AI pair-programming agents working on this codebase.

---

## 🚨 MANDATORY WORKFLOW RULES

### 1. Step-by-Step Execution & Review

- **Incremental Progress**: Implement features in **small, focused, reviewable steps**.
- **Manual Review Gate**: After completing each step, run all verification commands (`npm run test`, `npm run lint`, `npm run format:check`). Summarize your changes clearly and wait for explicit human approval before moving to the next step.

### 2. Git & Branching Conventions

- **Branch Naming Strategy**:
  - `feat/<feature-name>` for new features (e.g. `feat/auth-system`, `feat/resume-upload`)
  - `fix/<fix-description>` for bug fixes (e.g. `fix/pdf-extractor-timeout`)
  - `refactor/<scope>` for code refactoring
  - `chore/<tooling>` for dependency updates or dev tooling setup
- **Commit Messages**: Use clean, descriptive commit messages that clearly explain _what_ changed and _why_ (e.g. `feat(auth): setup NextAuth session provider with Drizzle adapter`, `fix(ui): adjust dashboard responsive sidebar breakpoint`).

---

## 🏗️ ARCHITECTURE & MODULE STRUCTURE

### Tech Stack & Core Services

- **Framework**: Next.js App Router (React 19, TypeScript).
- **Styling & UI**: Tailwind CSS v4 + shadcn/ui components + Lucide Icons.
- **Database & ORM**: **Neon PostgreSQL** + **Drizzle ORM** (with native `pgvector` helper support for embeddings).
- **Authentication**: **NextAuth.js (Auth.js v5)** with `@auth/drizzle-adapter`.
- **Testing**: **Jest** + **React Testing Library (`@testing-library/react` & `@testing-library/jest-dom`)**.

### Feature-Based Module Organization (`modules/`)

Code must be organized by domain feature modules rather than dumping everything into monolithic global folders.

```
src/
├── modules/
│   ├── auth/
│   │   ├── components/       # Auth forms, user avatar, session status
│   │   ├── hooks/            # Custom hooks (e.g. use-session-user.ts)
│   │   ├── utils/            # Auth helpers & token handlers
│   │   └── schemas/          # Auth validation schemas
│   ├── resume-analyzer/
│   │   ├── components/       # Dropzone, requirement checklist, score ring
│   │   ├── hooks/            # File upload & parsing hooks
│   │   ├── utils/            # Scoring algorithm & text normalizer
│   │   └── schemas/          # Zod schemas for resume & JD
│   ├── interview/
│   │   ├── components/       # Question card, voice recorder, feedback card
│   │   ├── hooks/            # Audio recording & session state hooks
│   │   └── utils/            # Speech metrics & STAR criteria evaluator
│   └── dashboard/
│       ├── components/       # Recent analyses list, metrics chart
│       └── utils/            # Data transformers for history view
├── components/
│   └── ui/                   # Shared UI primitives (shadcn components: button, card, dialog)
├── lib/                      # Global singletons (db.ts, auth.ts, env.ts)
└── app/                      # Next.js App Router pages & API handlers
```

### File & Component Conventions

- **`kebab-case` Naming**: All files and directories **must** use `kebab-case` (e.g., `resume-score-card.tsx`, `use-audio-recorder.ts`, `skill-normalizer.ts`).
- **Small & Modular FE Components**: Keep components concise and single-responsibility. Never write mega-components (>150 lines). Break complex screens into small composable primitives.
- **DRY Principles**: Avoid code duplication. Shared UI elements belong in `components/ui/` or module-specific component helpers.

---

## 🛡️ SECURITY & ENGINEERING BEST PRACTICES

1. **Strict Input Validation**:
   - Validate every API payload and user input using Zod schemas.
   - Sanitise raw text from resumes/JDs before rendering or processing.
2. **File Upload Security**:
   - Enforce explicit MIME allowlists (`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
   - Limit file upload size to 5MB max on both client and server.
   - Reject empty or corrupt file inputs gracefully.
3. **Database & API Security**:
   - Use Drizzle ORM parameterized queries to prevent SQL injection.
   - Protect all private endpoints `/api/v1/*` and routes `/dashboard/*` via server-side NextAuth middleware.
   - Never expose API keys or secrets in client-side code; isolate all AI calls to server routes.
4. **Code Quality**:
   - Code structure, naming, comments, and documentation must read like clean. Avoid generic AI boilerplate, excessive repetitive comments, or dummy implementations.

---

## ⚙️ DEVELOPMENT SCRIPTS & VERIFICATION

Run and verify these commands before declaring any step complete:

```bash
npm run test         # Runs Jest unit test suite
npm run lint         # Runs ESLint checks
npm run format:check # Verifies Prettier code style formatting
npm run build        # Verifies Next.js compilation & TypeScript build
```
