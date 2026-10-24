# Project Handoff Notes

This file is the shared handoff log for the team. Update it whenever backend or
frontend modules change, or whenever a library/dependency is added, removed, or
upgraded. Record what changed, why, files/areas affected, verification performed,
and any setup or follow-up needed so the next teammate can continue without
repeating discovery work.

## Current project structure

### Backend

- Laravel 12 REST API, Sanctum bearer-token authentication.
- API entry point: `backend/routes/api.php`; module route files are loaded from
  `backend/routes/api/` (`auth`, `dashboard`, `students`, `teachers`, `classes`,
  `attendances`, `student-requests`, `settings`, and utilities).
- Controllers, Form Requests, and the Telegram service are organized under
  `backend/app/Http/Controllers/Modules/<Module>/` in `Controllers`, `Requests`,
  and `Services` subfolders.
- Eloquent models remain in `backend/app/Models/`.
- `DatabaseSeeder` calls `SchoolDemoSeeder` for demo data.

### Frontend

- React/Vite SPA.
- Feature code is grouped under `frontend/src/modules/` (`auth`, `dashboard`,
  `students`, `teachers`, `classes`, `attendance`, `student-requests`, `settings`,
  and `public`). Modules can contain `api`, `pages`, `components`, and feature
  specific state/helpers as needed.
- Cross-feature code is in `frontend/src/shared/`; route composition is in
  `frontend/src/app/router.jsx`.
- Use the `@/` import alias for paths rooted at `frontend/src`.
- See `frontend/ARCHITECTURE.md` for the folder responsibilities and conventions.

## Latest handoff entry — 2026-10-24

### Backend updates

- Split API route definitions into per-module files under `backend/routes/api/`;
  the route URLs and authentication middleware are preserved.
- Public student requests now use the configured `public-student-requests`
  rate limiter.
- Moved API controllers, Form Requests, and TelegramService into module folders;
  updated namespaces/imports. Models were not changed.
- Fixed `AttendanceController@index()` to return attendance records and scope
  teacher results to classes owned by that teacher.
- Added `SchoolDemoSeeder`: 10 students, 10 teacher profiles/accounts, 10 classes,
  10 attendance records, 10 student requests, an admin account, and 7 settings.
- Added `backend/tests/Feature/ApiEndpointsTest.php` to exercise API flows across
  modules.

### Frontend updates

- Reorganized pages, API clients, and feature components under `src/modules/`;
  shared UI, guards, layout, configuration, and Axios client are under `src/shared/`.
- Added the `@` alias in `vite.config.js` and `jsconfig.json`; documented the
  frontend conventions in `frontend/ARCHITECTURE.md`.
- Fixed the Axios client self-import; it now imports the `axios` package.
- Fixed the Font Awesome CDN integrity value in `frontend/index.html`.
- `ProtectedRoute` now redirects to `/admin/login`; `RoleRoute` redirects to
  `/admin/dashboard`.
- API base URL now reads `VITE_API_URL`, falling back to
  `http://127.0.0.1:8000/api`.
- Started a gradual TypeScript migration in the dashboard module. The API
  response, dashboard page state, and chart props now have explicit types; admin
  and teacher dashboard payloads use a discriminated union.
- Added the TypeScript dev dependency, `tsconfig.json`, and an `npm run typecheck`
  script. TypeScript migration notes are in `frontend/ARCHITECTURE.md`.

### Verification and setup notes

- `php artisan route:list --path=api` loaded 38 routes after the backend route
  and controller refactors.
- PHP syntax checks passed for the module controllers, requests, service, and
  endpoint test file.
- Full backend feature test did not reach endpoint assertions on this machine:
  PHP CLI is missing `pdo_sqlite`. The configured MySQL hostname `mysql` was also
  unavailable from the host, and Docker daemon access was denied. No project
  database migrations or seeds were run during that attempt.
- `npm run build` passed after the frontend updates. Vite reports the main JS
  bundle is above its 500 kB warning threshold; the build still succeeds.
- TypeScript was added as a frontend dev dependency; no other dependencies were
  added, removed, or upgraded. npm reported 16 existing dependency audit findings
  during installation (1 low, 3 moderate, 12 high); no audit remediation was run.
- `npm run typecheck` and `npm run build` both passed after the dashboard
  TypeScript conversion.

## Follow-up — Royal Purple dashboard UI (2026-10-25)

- Redesigned the admin dashboard with responsive metric cards, responsive
  Recharts panels, and a teacher class list while preserving the typed API data
  flow and role-specific data.
- Rebuilt the shared admin sidebar with the existing role-filtered menu, active
  route indication, mobile drawer/backdrop, user profile summary, and sign-out.
- Added a persisted light/dark theme toggle in the admin header. Theme styles are
  scoped to `.admin-shell` and stored in localStorage.
- Replaced Vite starter global styles that constrained the app root width with a
  responsive base and theme tokens.
- Updated the notification bell to an accessible themed button.
- Verified with `npm run typecheck` and `npm run build`; both passed. The build
  still reports the known large JavaScript chunk warning.

## Follow-up — Tailwind CSS styling (2026-10-25)

- Added `tailwindcss` and the official `@tailwindcss/vite` plugin, using the
  current Vite integration documented at
  https://tailwindcss.com/docs/installation/using-vite.
- Converted the Royal Purple dashboard, admin topbar, responsive sidebar,
  notification button, and responsive chart wrappers to Tailwind utility
  classes. Theme tokens remain CSS variables in `frontend/src/index.css`; a
  custom `dark` variant follows the persisted `data-theme` selection.
- Added the global Tailwind stylesheet import in `frontend/src/main.jsx` and
  removed the temporary dashboard/layout CSS files.
- Moved the signed-in admin profile from the sidebar into the header, directly
  beside the light/dark toggle; the sidebar now focuses on navigation and sign
  out. The profile text collapses to initials on small screens.
- Tightened header and dashboard horizontal/vertical spacing, reduced chart/card
  padding and chart heights, and increased small dashboard labels slightly for
  readability.
- Expanded the main content max width to 1800px and removed hover movement,
  transition, and hover border/shadow changes from statistic count cards.
- Increased the header notification bell contrast with a lavender surface and
  purple icon in light mode, plus a matching dark-mode treatment.
- `npm run typecheck` and `npm run build` passed after the Tailwind conversion.
- npm reported 16 dependency audit findings during Tailwind installation (1 low,
  3 moderate, 12 high); no audit remediation was run.
- Fixed the running Compose frontend's CSS 500: its separate `node_modules`
  volume was stale and its Vite process had started before Tailwind was installed.
  Ran `docker compose exec -T frontend npm install`, restarted the frontend
  service, and confirmed `/src/index.css` now returns HTTP 200.

### Demo login

After migrations, run `cd backend && php artisan db:seed` to seed demo records.
Both demo account types use password `password`:

- Admin: `admin@example.com`
- Teacher: `teacher1@example.com`

Do not use `migrate:fresh` on a database containing data that should be kept.
