# Test Report

Run on 2026-11-26, Node 26, PostgreSQL 19 (local, throwaway database).

## Summary

| Area | Check | Result |
|---|---|---|
| Backend | Lint (ESLint + Prettier) | Pass, 0 errors, 0 warnings |
| Backend | Type check (`tsc --noEmit`) | Pass |
| Backend | Build (`nest build`) | Pass |
| Backend | Unit tests (Jest) | **9 / 9 pass** (2 suites) |
| Backend | E2E tests (Jest + supertest, real Postgres) | **31 / 31 pass** (1 suite) |
| Backend | Migrations on an empty database, then seed | Pass (`InitialSchema`, `AddQuestions`, `AddAdminRole`; the role migration was also run on a database that already contained seeded data) |
| Backend | Compiled build (`node dist/main`) smoke test | Pass: `/health` 200, `/docs` 200, 401 without token, no password hash in `/courses` |
| Frontend | Lint (`--max-warnings 0`) | Pass |
| Frontend | Type check | Pass |
| Frontend | Production build (Vite) | Pass |

## What the tests cover

**Unit (9):** `AuthService` (password hashed, email lower-cased, default role student, duplicate email rejected, valid/invalid login) and `ProgressService` (enrollment ownership, module must belong to the enrolled course, completed only at 100%).

**E2E (31), grouped by feature:**
- **Auth:** health is public; registration never returns the password hash; duplicate email (409) and invalid input (400); wrong password (401) vs correct login; protected routes return 401 without or with a bad token; profile with a valid token.
- **Roles and ownership:** a student cannot create a course (403); an instructor can create a course and a module; another instructor cannot edit or delete the course or its modules (IDOR checks); a malformed UUID returns 400.
- **Visibility:** drafts are hidden from students in the list and detail (404); after publishing, the catalog shows the course and leaks no password hash.
- **Enrollment and progress:** lesson content is hidden before enrolling and visible after; enrolling twice returns 409; progress values of 150, -1 and "abc" are rejected (400); another student cannot read or update someone else's enrollment (404); completion and overall progress are computed correctly; `my-courses` leaks no hashes.
- **Q&A:** non-members (an unenrolled student, another instructor) get 403 on read and post; enrolled students can ask and an empty body is rejected; students and other instructors cannot answer (403); the course instructor can answer and students then see the answer.
- **Instructor analytics (2):** per-course students, average progress and unanswered-question counts; students get 403 and instructors only see their own courses.
- **Admin (7):** admin role cannot be chosen at registration; non-admins get 403 on every admin route and anonymous users 401; stats; user list with search and pagination (and a limit above 50 is rejected); role changes take effect immediately, invalid roles are rejected and admins cannot change their own role; course unpublish/delete moderation; deleting a user cascades, and admins cannot delete themselves.
- **Cleanup:** an instructor can delete their own course (this test found a real bug, a 500 caused by missing foreign-key cascades, now fixed).

## Not tested (be aware)

- **The UI was not exercised in a browser.** The frontend is verified only by lint, type check and build. There are no frontend unit or component tests. Manual check needed: log in as each demo role, create a course, enroll, mark a module complete, ask and answer a question, then log in as admin and use the Admin page (role change, unpublish, delete).
- **Docker / `docker compose up`:** files written, but Docker is not installed on this machine, so they have never been run.
- **GitHub Actions workflow:** written but not yet run on GitHub.
- **Neon and the deployed Render/Vercel setup:** not tested; no connection string was available. Neon needs SSL, which is handled in the config but unverified.
- **Load, performance and security scanning** (beyond `npm audit`) were not done.

## Known remaining risks

- `npm audit` (backend): 27 findings (26 moderate, 1 high), mostly in dev tooling (Jest/ESLint chains). Production dependencies have 3 moderate advisories (glob/minimatch).
- Anyone can register as an instructor (kept for the demo).
- The JWT lives in localStorage.
