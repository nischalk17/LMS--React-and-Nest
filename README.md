# LMS: Learning Management System

A full-stack learning platform where instructors publish courses made of text, video and PDF modules, and students enroll and track their progress. Built with React, NestJS and PostgreSQL, with role-based access and a documented REST API.

## Features

- **Auth with three roles:** register as a *student* or an *instructor* (admins are created by the seed or promoted by another admin); JWT-protected API; bcrypt password hashing; login/register rate limiting.
- **Instructors:** create, edit, publish/unpublish and delete their own courses; add, edit and delete text, video (YouTube embed) and PDF-link modules. Ownership is enforced on every write.
- **Students:** browse the published catalog, enroll, open lessons, mark modules complete, and see per-course progress on a dashboard.
- **Instructor analytics:** per course, enrolled students, average progress and unanswered questions.
- **Admin:** a dashboard with platform stats, a searchable and paginated user list (change roles, delete users) and course moderation (unpublish, delete). Admins cannot change or delete themselves.
- **Quizzes:** instructors build one multiple-choice quiz per course (passing score, 2-6 options per question); enrolled students take it, get an instant score and per-question feedback, and keep an attempt history. The answer key never reaches students.
- **Course Q&A:** enrolled students ask questions on a course; only that course's instructor can answer. Non-members get a 403.
- **Access rules:** drafts are visible only to their owner and admins; lesson content stays hidden until the student enrolls (students keep access if a course is later unpublished).
- **Hardening:** password hashes never leave the API, module links must be http(s) (blocks `javascript:` URLs), validated UUID params, rate limiting that works behind a proxy, Helmet, atomic enrollment with proper 409s on double-clicks, and a required 32+ character `JWT_SECRET` in production.
- **Dark mode**, form validation (zod + React Hook Form), password visibility toggle.
- **API docs:** Swagger UI at `/docs`; `/health` also checks the database.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Redux Toolkit, React Router, Tailwind CSS, React Hook Form + zod, Axios |
| Backend | NestJS 11, TypeORM, Passport JWT, class-validator, Swagger, Helmet, Throttler |
| Database | PostgreSQL 16 (migrations + seed script) |
| Tooling | Jest (unit + e2e with supertest), ESLint, Prettier, Docker Compose, GitHub Actions |

## Architecture

```mermaid
flowchart LR
  B[Browser<br/>React SPA] -- "HTTPS + Bearer JWT" --> A[NestJS API]
  A --> G{Global guards<br/>Throttler, JWT, Roles}
  G --> M[Auth / Courses / Enrollments / Progress]
  M -- TypeORM --> D[(PostgreSQL)]
```

## Data model

```mermaid
erDiagram
  USER ||--o{ COURSE : "teaches (instructor)"
  COURSE ||--o{ MODULE : contains
  USER ||--o{ ENROLLMENT : "enrolls (student)"
  COURSE ||--o{ ENROLLMENT : has
  ENROLLMENT ||--o{ PROGRESS : tracks
  COURSE ||--o{ QUESTION : "Q&A"
  USER ||--o{ QUESTION : asks
  COURSE ||--o| QUIZ : has
  QUIZ ||--o{ QUIZ_QUESTION : contains
  QUIZ ||--o{ QUIZ_ATTEMPT : "graded attempts"
  USER ||--o{ QUIZ_ATTEMPT : takes
  MODULE ||--o{ PROGRESS : "progress on"
  USER {
    uuid id PK
    string email UK
    string password
    enum role "student, instructor, admin"
  }
  COURSE {
    uuid id PK
    string title
    text description
    bool isPublished
  }
  MODULE {
    uuid id PK
    string title
    enum type
    int order
  }
  ENROLLMENT {
    uuid id PK
    uuid studentId
    uuid courseId
  }
  QUESTION {
    uuid id PK
    text body
    text answer
    timestamp answeredAt
  }
  QUIZ {
    uuid id PK
    string title
    int passingScore
  }
  QUIZ_QUESTION {
    uuid id PK
    text text
    jsonb options
    int correctIndex
  }
  QUIZ_ATTEMPT {
    uuid id PK
    int score
    bool passed
  }
  PROGRESS {
    uuid id PK
    bool isCompleted
    float completionPercentage
  }
```

`ENROLLMENT (studentId, courseId)` and `PROGRESS (enrollmentId, moduleId)` are unique pairs.

## Quick start

Requires Node 22+ and a PostgreSQL database (a free [Neon](https://neon.tech) project works, no local install needed).

```bash
# API
cd backend
cp .env.example .env        # set JWT_SECRET and either DATABASE_URL (Neon) or DB_* (local Postgres)
npm ci
npm run migration:run       # create tables
npm run seed                # demo users and courses
npm run start:dev           # http://localhost:3000  (Swagger UI: /docs)

# Web (second terminal)
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:3000
npm ci
npm run dev                 # http://localhost:5173
```

### Optional: Docker

If you have Docker, one command starts Postgres, the API and the web app (migrations and the demo seed run on first boot):

```bash
docker compose up --build
```

Web: <http://localhost:5173> · API: <http://localhost:3000> · Swagger: <http://localhost:3000/docs>

No local Docker? Open the repo in a GitHub Codespace (green **Code** button, then **Codespaces**), which has Docker preinstalled, and run the same command in its terminal.

## Demo credentials

Created by the seed script (password for both: `Password123!`):

| Role | Email |
|---|---|
| Instructor | `instructor@lms.dev` |
| Student | `student@lms.dev` |
| Admin | `admin@lms.dev` (created locally; in production only when `SEED_ADMIN_PASSWORD` is set) |

Anyone can also register as a student or an instructor. Choosing the instructor role at sign-up is a demo shortcut; a production system would not allow it. The admin role cannot be chosen at registration.

## Testing

```bash
cd backend
npm run lint && npm run typecheck
npm test                    # unit tests (auth, progress, env validation)
npm run test:e2e            # API flows against a real Postgres (TEST_DB_* env vars, default lms_test on localhost:5432)
cd ../frontend && npm run lint && npm test && npm run build   # UI tests: Vitest + Testing Library
```

The e2e suite covers registration/login, role checks, ownership (IDOR) checks, draft visibility, enrollment, content gating, progress tracking, quizzes (grading, answer-key secrecy), Q&A permissions, instructor analytics, admin moderation, and concurrency edge cases (double enroll, double sign-up). CI runs all of the above on every push.

## Deployment (free tier)

- **Database:** Neon (free Postgres). Use its connection string as `DATABASE_URL`.
- **API:** Render web service, root `backend`, build `npm ci && npm run build`, start `node dist/seed.js && node dist/main`. Env: `DATABASE_URL`, `JWT_SECRET` (32+ characters), `FRONTEND_URL` (your Vercel URL), `NODE_ENV=production`, and optionally `SEED_ADMIN_PASSWORD` to create `admin@lms.dev` (skipped otherwise, so a public site never ships a well-known admin password). Health check path: `/health`. The free tier sleeps when idle, so the first request can take about a minute.
- **Web:** Vercel, root `frontend`, framework Vite, env `VITE_API_URL` set to the Render URL.

## What I'd do next

- Refresh tokens in httpOnly cookies instead of a token in localStorage (needs `SameSite=None` cookies and CSRF handling because the web app and API live on different domains).
- File uploads for PDFs and thumbnails (needs external object storage; free hosts have ephemeral disks).
- Notifications when a question is answered, and threaded Q&A replies.
- Server-side pagination for the public catalog (search and paging currently run in the browser, which is fine at this size).
- Playwright end-to-end tests for the full browser flows.

## License

MIT, see [LICENSE](LICENSE). Copyright (c) 2026 Nischal Dhoj Kunwar ([@nischalk17](https://github.com/nischalk17)).
