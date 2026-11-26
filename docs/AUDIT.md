# LMS Audit (Phase 1, read-only)

Status: partial. Backend build, lint, tests and `npm audit` are NOT run yet: `backend/node_modules` is missing (new laptop), and installing needs approval.

## 1. What exists
**Backend (NestJS 11, TypeORM, Postgres)**
- Entities: User (roles: student, instructor), Course, Module (text/video/pdf), Enrollment, Progress.
- Endpoints:
  - Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/profile`
  - Courses: `GET /courses`, `GET /courses/:id`, `POST`, `PATCH`, `DELETE`, and module add/update/delete (instructor only, ownership checked)
  - Enrollments: `POST /enrollments/courses/:id`, `GET /enrollments/my-courses`, `GET /enrollments/:id/progress`
  - Progress: `PATCH` and `GET /progress/:enrollmentId/modules/:moduleId`
- Global JWT guard with `@Public()` opt-out; RolesGuard on instructor routes.

**Frontend (React 18, Vite, Redux Toolkit, Tailwind, RHF + zod)**
- Pages: Login, Register, Dashboard, CourseCatalog, CourseDetail, InstructorCourses, CreateCourse, EditCourse. Dark mode, password eye icon.

| Feature | State |
|---|---|
| Auth + roles | Works in code. Role is self-chosen at register. |
| Courses / modules CRUD | Complete |
| Enrollment + progress | Complete in API. UI use of progress is still to verify. |
| Q&A (QuestionsSection) | **Fake**: stored in the browser's localStorage, no backend. Cut or build. |
| Quizzes | Don't exist |
| Admin role | Doesn't exist |

## 2. Does it run?
- Machine has Node 26, npm 11, git. **No Docker, no psql/Postgres.** No `.env` and no `.env.example` anywhere.
- Needed env vars (from code): `DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME, JWT_SECRET, FRONTEND_URL, PORT, NODE_ENV`; frontend `VITE_API_URL`.
- No migrations: `synchronize: true` in every env except `production`. No seed script.
- Frontend `tsc --noEmit`: **passes**. Frontend lint: not run (no ESLint config file found in the repo, so `npm run lint` probably fails).
- Backend: not built yet. The one e2e test is the Nest boilerplate (expects "Hello World!" and needs a live DB). `app.controller.spec.ts` is boilerplate. No real tests.
- Backend `lint` script uses `--fix`, which modifies files.
- Node 26 is very new; `bcrypt` (native module) may fail to install. Plan: use Node 22 LTS, or switch to `bcryptjs`.

## 3. Security
Git history: no `.env` or key file was ever committed. Only placeholder values appear in docs (`postgres`, `your-super-secret-jwt-key...`). **Nothing to rotate.**

| Severity | Issue |
|---|---|
| **High** | Password hashes leak: `GET /courses` and `/courses/:id` (public) load the `instructor` relation with the full User row, including `password`. Same for `/enrollments/my-courses`. |
| **High** | JWT secret falls back to `'your-secret-key'` if `JWT_SECRET` is unset (auth.module, jwt.strategy). Tokens are forgeable. |
| Med | `RegisterDto` lets anyone choose `role` (instructor). Fine for a demo, but document it. |
| Med | Unpublished courses are returned by `GET /courses` (without `?published=true`) and `GET /courses/:id` to anyone. Course `isPublished` defaults to **true**. |
| Med | No enrollment check on module content: all module content/videos are public. |
| Med | Progress: `completionPercentage` has no validation (negative, NaN, >100). `moduleId` is not checked to belong to the enrollment's course (allows junk rows). |
| Med | No rate limiting (login brute force), no helmet, 7-day JWT stored in localStorage. |
| Low | Password min length 6; bcrypt cost 10 (OK). |
| Low | `:id` params are not UUID-validated. A malformed id gives a 500 from Postgres. |
| Low | `synchronize: true` outside production. |
| OK | TypeORM calls are parameterized (no SQL injection found). Enrollment/progress queries filter by `studentId` (no IDOR found). Course/module edits check ownership. CORS is limited to `FRONTEND_URL`. ValidationPipe whitelists and rejects unknown fields. |

## 4. Code quality
- `any` on `@Request() req` and `payload`; no typed request user.
- Duplicate role/ownership checks scattered in the service. `Partial<CreateModuleDto>` is used instead of an `UpdateModuleDto`. The module update/delete routes sit under `/courses/modules/:id`.
- JwtAuthGuard is both global and repeated with `@UseGuards` on controllers (harmless duplication). RolesGuard uses `getHandler()` only (not class-level roles).
- Unused: `app.controller/service` boilerplate, unused `RolesGuard` import in the enrollments controller, `UserRole` import in the same file.
- Prettier formatting is inconsistent in the backend (long lines in auth.service).
- 7 overlapping markdown files at the root (README, SETUP, QUICK_START, RUN_ME_FIRST, COMMANDS, FIXES_APPLIED, CHANGELOG) plus 6 in `docs/`. Per your instruction these are now gitignored.
- `npm outdated` / `npm audit`: pending (needs install approval). Visible: `@nestjs/jwt ^10` and `@nestjs/passport ^10` / `@nestjs/typeorm ^10` with Nest 11 core, `jest ^30` with `ts-jest ^29` (version mismatch), frontend ESLint 8 + typescript-eslint 6 (old).

## 5. Repo hygiene
- **`frontend/node_modules` is committed: 12,762 files.** Must be removed from git (`git rm -r --cached`), and the history is bloated (not rewritten yet; decide whether to squash/rewrite or just untrack).
- No root `.gitignore` before this audit; no frontend `.gitignore` (so `dist/`, `.env` are not ignored). Backend `.gitignore` doesn't list `.env`.
- No LICENSE, no CI, no docker files, no `.env.example`, no screenshots.
- Done in Phase 1 at your request: a root `.gitignore` was created ignoring the AI-style md files (CHANGELOG, COMMANDS, FIXES_APPLIED, QUICK_START, RUN_ME_FIRST, SETUP, `docs/*` except AUDIT.md). **Note:** `.gitignore` doesn't affect files git already tracks. They also need `git rm --cached <files>`, which I'll leave in Phase 3 (or you run it).

## Deployment (free tier) recommendation
- **Frontend:** Vercel (or Netlify). Set `VITE_API_URL`; add a `vercel.json` SPA rewrite to `index.html`.
- **Backend:** Render free Web Service (sleeps after ~15 min idle, ~30–60 s cold start; mention it in the README).
- **Database:** Neon free Postgres (recommended: it doesn't expire). Render's free Postgres expires after about 30 days. Needs `ssl` enabled in the TypeORM config.
- **Alternative:** Koyeb or Fly.io, but they need a card. Stick with Vercel + Render + Neon.
- Caveat: with `synchronize` off in production you need the migration/seed step to run once on Neon.
