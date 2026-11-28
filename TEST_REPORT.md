# Test Report

Run on 2026-11-27, Node 26, PostgreSQL (local, throwaway database).

## Summary

| Area | Check | Result |
|---|---|---|
| Backend | Lint (ESLint + Prettier) | Pass, 0 errors, 0 warnings |
| Backend | Type check, build | Pass |
| Backend | Unit tests (Jest) | **24 / 24 pass** (4 suites) |
| Backend | E2E tests (Jest + supertest, real Postgres) | **52 / 52 pass** |
| Backend | Migrations from an empty database, then seed (run twice to prove it is idempotent) | Pass: `InitialSchema`, `AddQuestions`, `AddAdminRole`, `AddQuizzes`, `AddQuizResponses`, `FixQuizResponseQuizId` |
| Backend | Compiled build smoke test (`node dist/main`, production mode) | Pass, see "Production smoke checks" |
| Frontend | Lint (`--max-warnings 0`), type check, production build | Pass |
| Frontend | UI tests (Vitest + Testing Library, jsdom), including a palette contrast test (WCAG AA, both themes) | **61 / 61 pass** (6 files) |
| ML | ruff lint + format, pytest (features, leakage, golden parity, pipeline on simulated data) | **8 / 8 pass** |

## What the tests cover

**Backend unit (24):** `AuthService` (hashing, lower-cased emails, default role, duplicate email, valid/invalid login), `ProgressService` (enrollment ownership, module must belong to the course, completion at 100%), `validateEnv` (JWT secret required, 32+ characters in production), and the mastery features (parity with the Python implementation through a shared golden file, model prediction, fallback estimate, confidence levels).

**Backend e2e (52):**
- **Auth:** public health check reports the database; registration never returns a password hash; duplicate email (409) and invalid input (400); wrong vs correct login; 401 without or with a bad token; admin role cannot be chosen at registration.
- **Roles and ownership:** students cannot create courses; other instructors cannot edit or delete a course or its modules (IDOR); only students can enroll; malformed UUIDs return 400.
- **Visibility:** drafts hidden from students; lesson content hidden until enrollment and for non-owner instructors; enrolled students keep access after a course is unpublished; admins can open any course with full content; the catalog leaks no password hashes.
- **Enrollment and progress:** double enrollment returns 409; progress values (150, -1, "abc") are rejected; other students' enrollments return 404; completion and overall progress are computed correctly.
- **Concurrency:** two simultaneous enrollments give one 201 and one 409; two simultaneous sign-ups with one email give one 201 and one 409 (never a 500).
- **Input safety:** `javascript:` module URLs are rejected with 400; empty URL fields are accepted and stored as null.
- **Q&A:** non-members get 403; enrolled students can ask; only the course instructor can answer.
- **Quizzes (5):** only the owner can create or edit; invalid answer keys and empty quizzes are rejected; students and the unenrolled never see `correctIndex`; submissions are validated (wrong count, out-of-range option, wrong type, wrong role); grading gives 100/50/0 correctly; attempt history is kept; updates replace questions; deletion returns 404 afterwards.
- **Quiz response logging (4):** skill tags are stored and default to the course title; one response row per question is written for every attempt (6 rows for 3 attempts x 2 questions, with correct flags and the selected option); editing a quiz keeps existing question ids and the history linked to them, while removed questions leave orphaned-but-intact rows (skill snapshot and result survive); malformed question ids are rejected.
- **Mastery (4):** per-skill mastery is reported weakest first as an estimate when no model is shipped (values checked by hand); switches to the model path when one is provided; private to enrolled students (401 / 403 for not enrolled and for instructors, 404 for unknown course); instructors see their class's weakest skills only once a skill has at least 5 answers.
- **Instructor analytics (2):** students, average progress and unanswered-question counts per course; scoped to the instructor's own courses; 403 for students.
- **Admin (8):** 403 for non-admins and 401 for anonymous users; stats; user search and pagination (limits above 50 rejected); role changes apply immediately, invalid roles rejected, no self role change; moderation (unpublish, delete); user deletion cascades and self-deletion is blocked.
- **Cleanup:** deleting a course with enrollments works (an earlier test found a 500 here, fixed with foreign-key cascades).

**Frontend (16):** error-message helper (API messages, validation arrays, plain strings, network failure); API client (token attached, a failed login does not reload the page, an expired session logs out and redirects); Login page shows the server's error message and its labels are linked to the inputs; quiz taker (hidden when no quiz, submit enabled only when everything is answered, result shown, errors shown); mastery panel (bands, early-estimate flag, estimate vs trained-model wording, empty and error states).

**ML (8):** hand-calculated feature values; no-history prior fallback; the vectorised training features equal a plain reference definition at every step; features never use future answers; golden-file consistency; the training pipeline runs end to end on simulated data with a student-level split and beats chance; a model trained on simulated data can never be exported; the simulator is reproducible.

## UI refresh: what is and is not verified

- **Verified:** every text/background token pair meets WCAG AA in light and dark (automated test that reads the real stylesheet and also checks the RGB channels match the documented hex values); no legacy palette, gradient, glass or emoji classes remain; lint, typecheck and production build pass; the real components render with the real built stylesheet.
- **Not verified:** the refresh has not been checked in a real browser at phone and desktop widths, and focus rings, hover states and the dark theme have not been inspected on the live pages. A manual pass through every page in both themes is still needed.

## Knowledge tracing (Plan B): what is and is not verified

- **Verified:** the feature definitions agree between Python and TypeScript; training/evaluation code runs correctly end to end; the API and UI behave correctly with and without a model; the demo seed is deterministic and idempotent.
- **Not yet done: real training.** The ASSISTments dataset was not available, so **no real-data metric exists yet** and none is published. The app currently ships no model and labels all mastery values as estimates. The simulated-data run (AUC around 0.71) only proves the pipeline works; it says nothing about real students.
- **Bug found by these tests:** `quiz_responses.quizId` was created as `varchar` without a foreign key (from the logging work), which broke any join to `quizzes`. Fixed with a data-preserving migration.

## Issues found and fixed in the final audit

| Issue | Impact | Fix |
|---|---|---|
| A wrong password reloaded the login page via the 401 interceptor | The error message was never visible | Interceptor ignores login/register requests |
| The login error text was always the generic "Login failed" | The server message was lost | Helper handles plain strings, errors, validation arrays |
| Network failures showed the generic fallback | A sleeping free-tier API looked like "wrong password" | Clear "cannot reach the server, it may be waking up" message |
| Rate limiting used the proxy's IP | On Render all users would share one login limit | `trust proxy` enabled |
| Helmet's CSP could break Swagger UI | `/docs` blank in browsers | CSP off for this JSON API |
| `FRONTEND_URL` with a trailing slash | Every API call blocked by CORS, silently | Origins normalized |
| `javascript:` URLs allowed in video/PDF links | XSS via iframe or `window.open` | http(s) validation; PDF opens with `noopener` |
| Simultaneous double-click enroll or sign-up | 500 error | Transaction plus 409 on unique violation |
| Enrollment was not atomic | Possible half-enrolled student | Single transaction |
| Unpublishing a course locked enrolled students out (404) | Broken "My courses" links | Enrolled students keep access |
| Other instructors could click lessons that were empty | Looked broken | Access based on ownership or enrollment |
| Opening a lesson auto-marked it complete | Misleading progress | Explicit "Mark as complete" button |
| Admin could not view drafts they moderate | Moderation without visibility | Admins see everything |
| Module order ties were nondeterministic | Lessons could reorder | Secondary sort on creation time |
| Password label not linked to the input (Login, Register) | Click-to-focus and screen readers broken | Control now wraps the input |
| Failed data loads showed an empty page | Looked like "no data" | Visible error banners |
| Well-known admin password on a public deployment | Anyone could log in as admin | Production seed skips admin unless `SEED_ADMIN_PASSWORD` is set |
| Short `JWT_SECRET` accepted in production | Weak tokens | App refuses to start below 32 characters |
| Passwords over 72 bytes silently truncated by bcrypt | Surprising behavior | Max length 72 |
| `%` and `_` in admin search acted as wildcards | Wrong results | Escaped |
| `/health` always returned OK | A broken database went unnoticed | Checks the database (503 when down) |

## Production smoke checks (compiled build, production mode)

- Refuses to start with a short `JWT_SECRET`.
- With `FRONTEND_URL=http://localhost:5173/` (trailing slash) the CORS header is `http://localhost:5173`.
- `/health` returns `{"status":"ok","database":"up"}`.
- `/docs` serves Swagger UI with no Content-Security-Policy header.

## Not tested (be aware)

- **The UI was not exercised in a real browser** (no browser tooling was available). Frontend behavior is covered by the jsdom tests above, lint, type checks and the production build. Manual check: log in as each demo role and walk the flows (create a course, add a quiz, enroll, take the quiz, ask and answer a question, use the Admin page).
- **Docker / `docker compose up`:** not run (Docker is not installed on the development machine). Verify in a Codespace.
- **GitHub Actions:** the workflow has not run on GitHub yet.
- **Neon, Render and Vercel:** not deployed or tested.
- **Load, performance and penetration testing** were not done.

## Known remaining risks

- Backend `npm audit`: production dependencies have 3 moderate advisories (glob/minimatch, via the Nest toolchain); no critical ones.
- Frontend `npm audit`: `react-router` 6 has two moderate advisories (open redirect via `<Link>`/`useNavigate` with attacker-controlled targets, and an SSR hydration issue). This app only navigates to hard-coded paths and does not use SSR, so they do not apply; the fix is a breaking upgrade to v7. Dev-only test tooling (Vitest chain) has advisories that never ship to users.
- Anyone can register as an instructor (a deliberate demo shortcut).
- The JWT lives in localStorage.
