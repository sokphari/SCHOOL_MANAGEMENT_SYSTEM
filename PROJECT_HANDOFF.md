# Project Handoff Notes

This file is the shared handoff log for the team. Update it whenever backend or
frontend modules change, or whenever a library/dependency is added, removed, or
upgraded. Record what changed, why, files/areas affected, verification performed,
and any setup or follow-up needed so the next teammate can continue without
repeating discovery work.

## Current project structure

### Backend

- Laravel 12 REST API, Sanctum first-party SPA session authentication with
  server-side sessions and HttpOnly cookies.
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

## Follow-up — Student sidebar submenu (2026-10-25)

- Changed the Students sidebar item into an expandable submenu with links to
  View Students and Create Student. It opens automatically while viewing any
  student route and uses a 300 ms expand/collapse transition.
- Kept Create Student visible to admins only; both admin and teacher roles can
  open the student list. This is navigation only and does not add a student
  duration field.
- Added the missing React Router `useLocation` import required by the submenu.

## Follow-up — Student list UI and pagination (2026-10-25)

- Refreshed the View Students screen with the Royal Purple theme, responsive
  search/status/gender filters, a compact directory header, a horizontally
  scrollable table, and clearer empty/loading states. Existing QR, edit, delete,
  filtering, and role permissions remain available.
- Student requests include `per_page` matching the frontend page size. The list
  footer displays the visible record range and current page size.
- Restyled shared input, select, table, and pagination components with the app's
  theme tokens. Pagination now shows a compact page window for long lists.
- Student filters now fetch automatically without Search or Reset buttons or a
  page reload. Text search is debounced by 300 ms; changing status/gender applies
  immediately and resets pagination to the first page.
- Combined the student filters and list in one card and tightened vertical
  spacing; shared input/select components accept an optional container class to
  support compact layouts.
- Removed the student list title/description/count strip and visible filter
  labels for a more compact toolbar. Select controls now accept a placeholder,
  showing “All statuses” and “All genders” when no filter is active.
- Replaced the student database ID column with a sequential row number that
  continues across paginated pages.
- Kept Previous/Next pagination controls visible on the student list even when
  only one page exists; the controls are disabled until additional pages exist.
- Replaced student row action text with accessible icon buttons for View, QR,
  Edit, and Delete. View loads the existing student detail endpoint in a
  dedicated profile page with student contact, guardian, enrollment, and status
  fields; role restrictions for edit/delete are unchanged.
- Added the `/admin/students/:id` details route for both admins and teachers;
  the profile page offers an admin-only edit action and a link back to the list.
- Expanded the student profile page to the shared 1800px maximum content width so
  it uses the available dashboard content area instead of a narrow centered card.
- Expanded the Personal information section into responsive full-width detail
  cards, with a clearer section heading and supporting description.
- Redesigned the student edit page with the full available student, guardian,
  and enrollment fields in responsive form sections; added API validation error
  display, save state, and back/cancel navigation to the student's profile.
- Tightened the edit form header, field gaps, and section padding so the complete
  form is more likely to fit on screen without scrolling on desktop; smaller
  screens retain natural page scrolling.
- Redesigned Create Student to match the compact responsive edit form with
  personal, guardian, and enrollment sections, validation feedback, and save
  state handling.
- Improved form readability in dark mode by increasing shared field-label size
  and weight, strengthening input borders, and giving Create Student sections
  and field rows clearer spacing.
- Kept the Create Student layout compact, increased the title icon to a larger
  accent tile, and made its Back to students button more visible with a branded
  border and surface.
- Tightened the Create Student page's desktop vertical footprint and used the
  surrounding main-area padding so it fits shorter viewports more easily;
  smaller screens preserve normal scrolling.
- Migrated all Student feature API, pages, and QR card files from JavaScript to
  TypeScript (`.ts`/`.tsx`). Added Student/domain, form, pagination, filter, and
  validation-error types, and typed API response/request contracts.
- Converted shared input, select, table, pagination, modal, and button
  components used by the feature to TypeScript with typed props. TypeScript
  strict checking passes across the application.
- Fixed Vite development imports after renaming Student pages to `.tsx`: router
  imports now name the TSX paths explicitly, and the edit route imports the edit
  page component rather than the details page.
- Updated every existing module import of the renamed shared `.tsx` components
  and Student API `.ts` file, including Teacher, Class, and Student Request
  pages, fixing Vite 404s that still requested the old `.jsx`/`.js` paths.
- Added an auth restoration loading state to AuthContext and made protected/role
  guards wait for `/me` before redirecting. Refreshing a valid nested route such
  as Student View or Create now keeps the current route instead of redirecting
  to Dashboard while the user is being restored.
- Migrated Teacher list/create/edit pages and API to `.tsx`/`.ts`, with typed
  teacher records, filters, pagination, form payloads, validation errors, and
  Axios response contracts. The forms now match the shared responsive Royal
  Purple form layout.
- Updated the router to explicit Teacher TSX paths and corrected Teacher Add/Edit
  navigation to `/admin/teachers/...` so the links match registered routes.
- Updated Class Create/Edit imports of the migrated Teacher API to explicitly
  load `teacherApi.ts`, eliminating remaining requests for the removed `.js` file.
- Added an expandable Teachers sidebar menu with View Teachers and Create
  Teacher links, automatic expansion on Teacher routes, and the same 300 ms
  transition used by the Students submenu.
- Replaced the legacy inline-styled Teacher list with a responsive Royal Purple
  list matching Student directory UI, including automatic search/status/gender
  filters, icon actions, empty/loading states, and 10-row pagination.
- Added an expandable Classes sidebar menu with View Classes for Admin/Teacher
  and Create Class for Admin, linked to the existing class list/create routes.
- Added Card/Table view switching to the Classes list. The card layout shows
  class ID, name, section, academic year, room, assigned teacher, status, and
  description when present; view/edit/delete actions follow existing role access.
- Set Classes list pagination to 8 records per page in the frontend and Laravel
  endpoint for both card and table views.
- Redesigned Create Class to match the compact Royal Purple create forms, with
  grouped class/teaching details, optional teacher assignment, responsive
  fields, API validation messages, save state, and back/cancel navigation.
- Redesigned Class Details / students-in-class page with a class summary,
  student count, assignment controls, responsive student table, and empty/loading
  states while retaining the existing assign/remove behavior.
- Styled Student Code as a brand badge and Male/Female values as distinct color
  badges in the students-in-class table.
- Added View, Admin-only Edit, and Remove from class actions to the class roster.
  Student details now include real attendance counts/rate and enrolled class
  data; score and schedule time display explicit not-configured placeholders
  because no score/timetable fields or modules exist yet. The student detail API
  now includes attendance counts without changing the Student model.
- Added an authenticated paginated student attendance-history endpoint and a
  Student Details attendance table showing date, class, status, and note, with
  10 records per page.
- Updated View Students to display 15 records per page in both the React list
  and Laravel student endpoint; row numbering and pagination follow the new size.
- Redesigned Edit Class to match the compact Royal Purple Create Class form, with
  grouped fields, teacher/status selection, inline API validation, save state,
  and back/cancel navigation to class details. Tightened vertical spacing to
  keep the edit form compact on desktop.
- Migrated the Classes module API and its list/create/edit/details pages from
  JavaScript to TypeScript (`classApi.ts`, typed `.tsx` pages) and added shared
  class, form, pagination, roster, and validation types. Updated router imports
  to the TypeScript pages, and restored the requested 8 classes per page.
- Changed all remaining Classes API imports, including Attendance, to explicitly
  reference `classApi.ts` so Vite does not request the removed `classApi.js` path.
- Added compact badges for class name, section, and assigned teacher in both
  Class table and card views; class/section/teacher use distinct theme colors.
- Increased Section badge contrast with a stronger emerald background, border,
  and text color for both light and dark modes.
- Added enrolled-student totals to Class cards using Laravel's `students_count`
  aggregate, so the card shows live relationship counts instead of placeholder
  values.
- Replaced the student selector/Add Student controls on Class Details with a
  Track Attendance button; roster removal remains available.
- Replaced the per-student attendance status dropdown with four selectable
  buttons: Present, Absent, Permission, and Late. Permission maps to the
  backend's existing `excused` status so the API contract remains compatible.
- Added an Attendance column to each student row on Class Details, with the same
  four status buttons. It loads today's saved status and stages changes before
  submitting them through the existing class/date attendance API.
- Defaulted unmarked student rows to Present in the Attendance column and
  enlarged the four status buttons with consistent widths and touch-friendly
  height for easier reading and selection.
- Made Class Details require an explicit Track Attendance click before status
  buttons are enabled. Unmarked students default to Present; a separate Save
  Attendance action submits the entire class roster for the current day. After
  saving, editing locks and the action changes to Edit Attendance; reopening it
  allows admin changes that must be saved again. Teachers see “Tracked already”
  after submission, and the attendance API rejects a second teacher submission
  for the same class and date.
- Permission/`excused` can be recorded by Admin or Teacher for a student's
  in-person request. Teachers are limited to one permission for each student
  per Monday-to-Sunday week. Availability is shown per student in Class Details
  and Attendance, and both single and bulk attendance APIs enforce the limit.
- Added an Admin-only date-range permission action to Attendance. Admins can
  search and select a student from the chosen class, set an inclusive date
  range, provide a required reason, then grant Permission for each date. Admins
  are not restricted by the teacher weekly limit.
- Rebuilt the Attendance page with the Royal Purple Tailwind UI, responsive
  class/date filters, status summary cards, student codes, status buttons,
  notes, save feedback, and a read-only submitted state for teachers. Migrated
  its page, API, and types to `.tsx`/`.ts` and updated route imports.
- Updated Attendance's class chooser to look like a regular select control;
  opening it reveals a search field inside the dropdown and filters by class
  name/section. Enter/Escape work in the search field, and selecting a class
  clears the loaded roster.
- Removed student-name search from the Attendance table. Attendance summary
  cards now appear below the page title and above Choose class on initial load,
  and update when a class is selected. Removed the Save Attendance button;
  status selections save automatically and notes save when focus leaves the field.
  Grant Permission immediately records the selected date range.
- Removed the Attendance Load Students button. Selecting a class now
  automatically reloads the roster and current-day attendance, with
  loading/loaded feedback and stale-request protection.
- Removed the daily Date picker from Attendance filters; the page now records
  for the current local date automatically. Admin permission ranges retain
  separate start/end date inputs.

## Follow-up — Student Requests UI (2026-10-25)

- Redesigned the admin Student Requests list in the Royal Purple Tailwind style
  with responsive search/status/category filters, status and priority badges,
  student code, received date, row numbering, loading/error/empty states, and
  pagination. Search and filters update automatically without Search/Reset
  buttons.
- Redesigned request details with student and request information cards, a
  responsive status/admin-note form, inline save feedback, and back navigation.
- Migrated the admin request list/detail pages and request API from JavaScript
  to TypeScript, adding typed request records, filters, paginator data, and
  update payloads. Updated router imports and the notification bell API import
  to the new `.tsx`/`.ts` files.
- Fixed request detail navigation to use `/admin/student-requests/:id`, matching
  the nested admin routes.
- No dependencies were added or changed. `npm run typecheck` was run after the
  migration.

## Follow-up — Settings UI (2026-10-25)

- Rebuilt the admin Settings page in the Royal Purple Tailwind style, grouping
  school contact data, Telegram notifications, and logo/banner branding into
  responsive sections. Added URL image previews, unsaved-change indication,
  discard/save actions, inline validation and API feedback, and a retry state
  when settings cannot load; the existing API fields and behavior are retained.
- Migrated SettingsPage and settingApi to TypeScript with typed settings and
  field validation contracts, and updated the router to its `.tsx` path.
- Expanded Settings content to use the full available main-content width.
- No dependencies were added or changed. `npm run typecheck` passed after the
  migration.

## Follow-up — Login UI (2026-10-25)

- Rebuilt the login form with a responsive Royal Purple sign-in layout, accessible
  email/password fields, show/hide password control, inline authentication and
  rate-limit errors, and a disabled/loading submit state. Existing auth context
  login and dashboard navigation remain in use.
- Added a Light/Dark toggle to Login and persisted the selection using the same
  `school-management-theme` localStorage key as the admin layout. Extended the
  dark theme token scope to the standalone login shell.
- Expanded the login form to a 560px maximum width with larger field sizing and
  card padding for easier reading and use.
- Increased the Login card's vertical spacing and minimum height to 370px
  (400px on larger screens), keeping it centered in the available viewport.
- Fixed Login input changes by reading the input value before the deferred state
  updater, preventing `currentTarget.value` from being read after the event ends.
- Migrated LoginPage to TypeScript and updated its router import to `.tsx`.
- No dependencies were added or changed. `npm run typecheck` passed after the
  migration.

## Follow-up — Public Home UI (2026-10-25)

- Replaced the old inline-styled Public Home page with a responsive Royal Purple
  landing page, school identity header, hero/banner, school overview, values,
  dynamic contact cards, and links to student requests and staff login.
- The page continues to load school name, contact details, logo, and banner from
  `GET /api/public/settings` through the shared API client; fallback content is
  shown if the request fails.
- Migrated HomePage and publicSettingApi to TypeScript and updated the router
  import. No dependencies were added or changed. `npm run typecheck` passed.

## Follow-up — Class card actions (2026-10-26)

- Added an Admin-only vertical-more menu beside each Class card's status badge
  with Add student, Edit class, and Delete class actions. Removed the duplicate
  edit/delete icon buttons from the card footer; View class remains available.
- Add student opens a class-specific dialog, loads active students, excludes
  students already enrolled, and identifies one student by exact name, gender,
  and telephone number before using the existing class assignment API. It asks
  for correction if there is no unique match. The class list refreshes after a
  successful assignment.
- No dependencies were added or changed. `npm run typecheck` passed.

## Follow-up — Class end lifecycle (2026-10-26)

- Replaced class deletion actions in the Class list UI with End Class scheduling
  and Pre-End actions. End Class opens a date picker; tracking is allowed only
  through the chosen final attendance date, then stops. Pre-End stops tracking
  immediately. Ended/Pre-End classes
  show lifecycle badges, and admins can resume a class to clear its pre-end and
  scheduled end date.
- Added nullable `end_date` and `pre_end_at` fields through a new migration and
  typed class API fields/actions. Class Details and the Attendance page disable
  attendance tracking for inactive, pre-ended, or ended classes.
- Added backend guards to bulk/single attendance and permission-range writes so
  closed classes cannot receive attendance records, even if a client bypasses
  the disabled controls.
- `npm run typecheck`, `git diff --check`, and PHP syntax checks passed. The
  migration was not applied here: `php artisan migrate:status` could not resolve
  the configured MySQL host `mysql`, and Laravel could not append to its log.
  Apply the migration when the project's database service is running:
  `cd backend && php artisan migrate`.

## Follow-up — Transfer students between classes (2026-10-26)

- Added an Admin-only transfer action to each student row in Class Details. The
  dialog identifies the source class and accepts a destination class ID; it
  confirms the matching eligible class by name and section before transfer.
- Added an authenticated API endpoint that takes the source class ID and student
  ID from the route and the destination class ID from the request. The backend
  validates enrollment and destination eligibility, then atomically removes
  the source enrollment and adds the destination enrollment.
- Attendance records in the source class remain unchanged as historical data.
- No dependencies or database migrations were added.

## Follow-up — Switch class teacher (2026-10-26)

- Added an Admin-only “Switch teacher” action to the class card's More menu.
  The dialog shows the class ID and accepts a teacher ID; the backend validates
  that teacher exists before assigning them to the class.
- Added an authenticated class teacher assignment endpoint. The class list
  refreshes after a successful change so the updated teacher is visible.
- No dependencies or database migrations were added.

## Follow-up — Class card schedule and location fields (2026-10-26)

- Added Course, Building, Floor, Term, and Time to class cards and removed
  Description from the card view. Location names initially used defaults until
  the location management module was implemented below.

## Follow-up — Class course, mode, location, and schedule fields (2026-10-26)

- Added Course, Lesson, Class type (Physical, Hybrid, Online), Building, Floor,
  Room, Term, and Time to Create/Edit Class. Class type is stored separately
  from the existing Active/Inactive lifecycle status.
- Added nullable database columns, model fillable fields, and request validation.
  Class cards now display saved values (with defaults for older rows), and no
  longer show the description.
- No dependencies were added. Apply pending database migrations with
  `cd backend && php artisan migrate` when the database service is available.

## Follow-up — Facilities management (2026-10-26)

- Replaced separate Building, Floor, and Room sidebar sections with one Admin-
  only Facilities page at `/admin/facilities`. Previous paths redirect there.
- The page uses one eager-loaded Buildings → Floors → Rooms tree for selection,
  floor accordions, room search/type/status filters, and real record details.
  Statistics are computed from real records, including total
  room capacity when available. Child locations/class assignments prevent
  deleting their parent.
- Building, floor, and room create/edit actions navigate to full pages with
  complete forms, inline API validation, saving states, and context-aware return
  navigation. Room details also have a dedicated page; no Facilities forms or
  detail views use modal dialogs.
- Added floor number and room type fields with server validation. Room type
  options include Classroom, Computer lab, Office, Meeting room, Library, and
  Other. Building/floor/room relationships are checked by the API.
- Create/Edit Class selects active Building → Floor → Room relationships; the
  backend persists foreign keys and keeps readable location name snapshots.
- No dependencies were added. Apply pending migrations with
  `cd backend && php artisan migrate` when the database service is available.
- Verification for this follow-up: `frontend/npm run typecheck` and
  `frontend/npm run build` passed. `git diff --check`, PHP syntax checks for the
  location models/controller and migrations, and
  `php artisan route:list --path=locations --except-vendor` passed (12 routes).
  `php artisan test --filter=ApiEndpointsTest` could not execute assertions
  because this PHP environment does not have the PDO SQLite driver installed;
  enable `pdo_sqlite` or run the suite in the project's configured test
  environment before relying on runtime database coverage. The production build
  still reports the existing large JavaScript chunk warning (>500 kB).

## Follow-up — Facilities page spacing (2026-10-28)

- Reworked the Facilities overview to follow the supplied template: a building
  selector sidebar with status and floor/room counts, metric cards, selected
  building summary/actions, compact floor rows, and room cards.
- The building selector becomes a horizontal scroller on smaller screens. Kept
  the existing theme, filters, CRUD routes, dependency checks, and notifications.
- Tightened vertical spacing and card padding to reduce the page height while
  keeping labels and controls readable.
- `frontend/npm run typecheck` and `git diff --check` passed.

## Follow-up — Courses and Lessons module (2026-10-29)

- Added an Admin-only Courses catalog with full-page create/edit forms, course
  detail pages, and full-page create/edit lesson forms. Courses store name,
  optional code and description, status, and lesson/class counts. Lessons are
  owned by a course and include optional order number, description, and status.
- Added authenticated course/lesson CRUD APIs. Deletion is blocked when a course
  has lessons or class assignments, and when a lesson is assigned to a class.
- Added `courses`/`lessons` tables and nullable relationship IDs on
  `school_classes`. The migration backfills distinct existing course and lesson
  text into records and links existing classes without removing their text
  values. Existing API clients may continue to submit the legacy text fields;
  new Class forms submit relational IDs and display canonical names.
- Create/Edit Class now loads active courses, then lists lessons for the chosen
  course. The Classes list/detail pages prefer the related names and fall back
  to existing text snapshots.
- Demo seeder now creates five courses and ten lessons, and assigns the ten demo
  classes to them. No dependencies were added. Apply the migration with
  `cd backend && php artisan migrate` before using the module.
- Verification: frontend TypeScript check and production build passed, PHP
  syntax checks and course/lesson route discovery passed. The API feature test
  could not reach assertions because this PHP installation lacks PDO SQLite;
  the Courses migration was applied to the local Compose database and the demo
  seeder created five courses and ten lessons. The production bundle still
  reports the known >500 kB chunk warning.

## Follow-up — Grades and term scores (2026-10-29)

- Added Grades navigation for admins and teachers. Teachers can view and update
  scores only in their assigned classes; only admins can create grading terms.
- A grading term belongs to one class and has a name plus inclusive start/end
  dates. Each roster row shows attendance /40, manually entered Activity /30,
  manually entered Exam /40, and the computed total /110.
- Attendance is calculated from saved class attendance records within that
  term: start at 40; subtract 1 per absent record and 0.5 per permission
  (`excused`) record, never below zero. Present and late records do not reduce
  the score. Activity and Exam are nullable until entered and are saved per
  student and term.
- Added `grading_terms` and `term_scores` tables. Migration
  `2026_10_29_000007_create_grading_terms_and_scores_tables` has been applied
  to the configured Docker database. No new dependencies were added.
- Frontend TypeScript check passed. PHP Pint, PHP syntax checks, and route
  discovery passed. Runtime API/database checks have not been run for this
  change.

## Follow-up — Weekly timetable (2026-10-30)

- Added a recurring Monday-to-Sunday timetable for admins and teachers. Teachers
  can view sessions for their assigned classes; admins can create, edit, and
  remove sessions through full pages.
- Sessions are linked to a class, so course, lesson, teacher, room, and building
  details come from the existing class record. Each session stores weekday,
  start time, and end time.
- `SchoolDemoSeeder` adds one example session for each of its ten demo classes.
- The API blocks overlapping sessions when the same class, assigned teacher, or
  room is already scheduled that weekday. Admin-only writes are enforced on the
  backend. Class options are limited to active classes and filtered by the
  selected weekday/time, so unavailable classes are not offered in the form.
- Added `timetable_sessions`; migration
  `2026_10_30_000001_create_timetable_sessions_table` has been applied to the
  configured Docker database. No dependencies were added.
- Verification: frontend TypeScript check, PHP Pint/syntax, route discovery, and
  `git diff --check` passed. No API/database runtime checks have been run yet.

## Follow-up — Security hardening (2026-10-30)

- Login now authenticates admin/teacher accounts with Laravel's web session.
  The session ID rotates after login, the server-side session expires after
  120 minutes idle or 8 hours absolute, and logout invalidates the session.
  The browser receives an HttpOnly session cookie; the frontend stores
  no bearer credential. Legacy bearer tokens are rejected on protected browser
  routes.
- Enabled Sanctum's stateful API middleware and CSRF cookie flow. Credentialed
  CORS is enabled only for the explicit frontend origin allowlist; production
  must set the exact HTTPS frontend origin and `SESSION_SECURE_COOKIE=true`.
- React now requests `/sanctum/csrf-cookie` before login and uses credentialed
  Axios requests with the `X-XSRF-TOKEN` header. Protected routes restore auth
  from `/api/me`; an API 401 clears the in-memory user state. Old browser bearer
  tokens are cleared and are no longer sent.
- Session lifetime middleware enforces both the idle timeout and the absolute
  lifetime on protected browser API routes. `SESSION_DRIVER` is server-side;
  the sample uses the database driver, while local `.env` may choose file.
- Added backend role middleware and applied role boundaries to API route groups.
  Admin-only changes now include student/teacher/class CRUD, class enrollment,
  location/catalog/settings management, timetable writes, permission grants,
  and attendance deletion. Teachers only see students, class details, attendance,
  and timetable records associated with their assigned classes.
- Attendance endpoints now verify class ownership and student enrollment.
  Removed the unauthenticated Telegram test endpoint, rate-limited public student
  lookup, capped public request text, and added timeouts to Telegram requests.
- Added security response headers, input limits for school settings, and a
  production guard that skips demo seeding unless `SEED_DEMO_DATA=true` is
  deliberately configured.
- Restricted credentialed CORS to configured frontend origins; configure
  `CORS_ALLOWED_ORIGINS` and `SANCTUM_STATEFUL_DOMAINS` for the production
  website before deployment. Keep frontend and API on the same site where
  possible so `SameSite=Lax` cookies work without cross-site cookie settings.
- React's normal JSX rendering escapes text, and a source scan found no
  `dangerouslySetInnerHTML` usage. Continue avoiding raw HTML injection and set
  a frontend Content-Security-Policy at the web host as an additional XSS layer.
- Vite production builds explicitly disable source maps. Build and serve the
  generated `frontend/dist` assets in production; do not expose the Vite dev
  server. Set `APP_DEBUG=false` in the production Laravel environment.
- Earlier role-boundary API checks confirmed teacher access limits before the
  cookie-auth migration; the temporary test token was deleted afterward.
- Expanded `ApiEndpointsTest` to cover session login/logout, public requests,
  CRUD across all modules, permission date ranges and weekly teacher limits,
  attendance scoring, grade terms/scores, timetable conflicts, class lifecycle,
  student transfer, and teacher switching. Laravel tests pass: 4 tests and 118
  assertions using the isolated in-memory SQLite test database.
- Live cookie smoke check passed against the running app: CSRF endpoint `204`,
  login without CSRF `419`, login `200`, `/api/me` `200`, logout `200`, and
  `/api/me` after logout `401`.
- The tests exposed and fixed an ambiguous `status` column in public student
  lookup by qualifying the school-class status column.
- Current verification: Laravel Pint, PHP syntax, route discovery, frontend
  lint, TypeScript checking, production build, and `git diff --check` pass. The
  production build still reports the existing large JavaScript chunk warning.

## Follow-up — Audit log (2026-10-30)

- Added an append-only `audit_logs` table and backend audit service for API
  mutations plus successful/failed login and logout events. Entries record the
  actor, action, module, route/method, result code, IP, user agent, and optional
  safe metadata; request bodies, passwords, and tokens are never captured.
- API audit listing is available at `GET /api/audit-logs`, restricted to
  authenticated admins. The admin-only `/admin/audit-logs` page supports search,
  module/date filters, and pagination.
- Failed audit writes are logged without interrupting the user action. Apply
  the new migration with `php artisan migrate` before expecting the audit list
  or login/logout audit events to persist.
- Audit rows now provide a details view with the event actor, request, result,
  IP address, and a field-by-field before/after comparison when available.
  Change snapshots use model-specific allowlists; credentials and request bodies
  are not stored. Sign-ins and older events can show no field diff.
- Successful normal GET page/data views are no longer added to the audit log;
  state-changing mutations and security/failure events remain recorded. Existing
  page-view rows are retained as historical records.
- The audit table's User column displays only the actor role badge, without the
  redundant account display name. Admin, Teacher, and System use distinct
  higher-contrast badge colors in light and dark themes.
- The Users & Account page now supports full-page account editing (name/email),
  blocking/unblocking, and deletion. Account status is enforced at login and on
  subsequent authenticated API requests. Self-blocking/deletion and removal of
  the last active admin are prevented. Run `php artisan migrate` to add the
  `users.is_active` field before using the new account controls.
- Verification for this change: PHP syntax, Pint on changed PHP files, API
  route discovery, frontend lint, TypeScript checking, and production build
  passed. Local PHP feature tests could not connect to SQLite because the local
  PHP runtime lacks the SQLite PDO driver; Docker-based test execution was also
  unavailable because this session cannot access the Docker socket. The build
  retains the existing large JavaScript chunk warning.
- The admin sidebar now groups only implemented modules under Overview,
  Academic management, Staff management, Operations, and Administration. Its
  expandable Students, Teachers, Classes, and Audit log links retain their
  existing routes and role/feature checks. Increased its desktop width to 288px
  and enlarged the navigation labels/icons for readability; the main layout
  offset matches the new width. Updated the product label and icons to match the
  school management workspace.
- Expandable Students, Teachers, and Classes navigation rows now link directly
  to their list page when their label/icon is clicked; the separate chevron
  only expands or collapses the submenu. Removed duplicate “View …” submenu
  links; the submenu now contains only the create action.
- Student, Teacher, and Class create forms now use clearer grouped sections,
  three-column desktop field layouts, larger field spacing, and visible required
  markers. Required inputs/selects use native browser validation. Teacher account
  ID now explains that it is for an already-existing teacher login account.
- Updated the sidebar navigation scrollbar to a slim rounded violet thumb with
  a low-contrast track and a brighter hover state. Styling supports Firefox and
  Chromium-based browsers without changing the sidebar's scrolling behavior.
- Audit event details now use color-coded badges for the module, action type,
  actor role, result status, request method, and record type. The field-change
  section shows each changed field in paired Before and After value cards and
  includes a count of changed fields.
- Failed mutation audit entries now keep the attempted operation in the action
  label (for example, `students.delete_failed`). Existing generic failure rows
  are displayed using their HTTP method, so older DELETE failures read `delete
  failed` instead of the ambiguous `action failed`.
- The admin notification bell now opens an in-place dropdown with pending
  student requests, successful/failed logins, logouts, blocked API access, and
  rate-limited API attempts from today. Navigation happens only when an admin
  clicks a notification's View button or list link; the bell itself does not
  redirect. Teachers do not see this admin-only bell.
- Fixed an audit service defect that built audit rows without calling `save()`,
  which left the Audit Log and security notifications empty. The API middleware
  now also records rejected/rate-limited API requests while avoiding duplicate
  failed-login entries. Feature assertions cover login, logout, rejected access,
  and failed login events.
- Reworked the Audit Log submenu's Users feature into an admin/teacher account
  directory with role, email, and last recorded activity. Added a Roles feature
  where admins can allow/deny teachers access to Dashboard, Attendance,
  Students, Classes, Timetable, and Grades. Admin permissions stay unrestricted.
- Teacher module access is stored in `role_module_permissions`, exposed through
  `/api/role-permissions/teacher`, returned on login and `/api/me`, reflected in
  the sidebar/routes, and enforced by backend role middleware on every teacher
  module request. Default teacher access preserves the existing six modules.
- Added feature-level teacher permissions in `role_feature_permissions`. Each
  module exposes its own feature checkboxes, and the API authorization middleware
  checks both the module permission and the specific feature before serving a
  teacher request. The login and `/api/me` payloads include allowed feature keys
  for the frontend to hide unavailable actions. Run `php artisan migrate` to
  apply `2026_10_31_000001_create_role_feature_permissions_table`.
- Roles UI now allows enabling/disabling a whole module or individual features.
  Turning off a module disables all of its features; turning it back on enables
  them again. Admin access remains fully enabled and read-only.
- Attendance recording and grade entry features require their related view
  features to remain enabled. Student list/details/history, class list/details,
  class creation, attendance viewing/recording, timetable viewing, and grade
  viewing/entry are enforced separately. Teachers can create a class only when
  `classes.create` is allowed; the backend assigns the new class to the logged-in
  teacher regardless of any submitted teacher ID. Teacher class creation options
  include active course and building data. The new migration
  `2026_10_31_000002_add_teacher_create_class_permission` enables that feature
  by default for existing teacher roles. Focused Laravel permission and class
  creation tests passed (21 assertions total); frontend TypeScript checking and
  ESLint passed after the update.
- Teachers can now receive independent permissions for the class card actions:
  Add student, Switch teacher, Edit class, Schedule end, Pre-End, and Resume.
  The Roles screen exposes each permission; administrators remain unrestricted.
  The API enforces the matching feature permission and limits teacher mutations
  to classes assigned to their teacher profile. The available-students endpoint
  also uses the class permission, so Add student does not depend on access to
  the full Students module. Run `php artisan migrate` to apply
  `2026_10_31_000003_add_teacher_class_management_permissions`.
- Added `/api/system-users` for the admin/teacher account directory. The new
  migration `2026_10_30_000003_create_role_module_permissions_table` must be run
  before using Users/Roles or teacher module access controls.
- Updated the Roles page with Admin and Teacher role selectors. Admin module
  access is displayed as enabled and locked; Teacher module access remains
  editable. Saving teacher permissions now reloads them from the API so the UI
  confirms persisted values. Teacher access includes module-level and
  feature-level controls, with related view permissions required by dependent
  actions.
- Redesigned the Roles & permissions page with role tabs, an admin/teacher role
  summary, module search, and horizontal module rows. Each row places the module
  details first, its access switch next, and the configured feature checkboxes
  alongside it. Save actions stay compact at the top of the page. The existing
  sidebar, route structure, permission dependencies, and save/reload flow are
  unchanged.

### Demo login

After migrations, run `cd backend && php artisan db:seed` to seed demo records.
Both demo account types use password `password`:

- Admin: `admin@example.com`
- Teacher: `teacher1@example.com`

Do not use `migrate:fresh` on a database containing data that should be kept.

### Student QR registration (2026-10-31)

- Added a public `/student-registration` form that requires an admin-issued QR from `/admin/students/registrations`. The existing per-student QR still opens `/request-scan` for current students and is unchanged.
- Admin-issued QR tokens are random, stored only as SHA-256 hashes, expire after 24 hours, and can submit one application exactly once. The token is locked and consumed in the same transaction as application creation. The public page checks token status and shows an expired/used message. To allow another attempt, an admin must issue a fresh QR.
- Public applications are rate-limited and stored as `pending`; no student record is created at submission. Admins can filter/search applications and approve or reject them. Approval transactionally creates an active student with a generated `STU-<year>-<random>` code.
- New API routes: `POST /api/student-registrations/qr-tokens` (admin issue), `GET /api/public/student-registrations/qr-status`, `POST /api/public/student-registrations`, `GET /api/student-registrations`, and admin `POST /api/student-registrations/{id}/approve|reject`.
- Applied `2026_10_31_000004_create_student_registrations_table` and `2026_10_31_000005_create_student_registration_tokens_table` to the local Docker database. For another environment, run `cd backend && php artisan migrate`. No dependency was added.
- Verification: frontend `npm run typecheck`, `npm run lint`, and `npm run build`; PHP syntax checks, Laravel route discovery, Pint formatting, and `git diff --check` pass. No feature tests were run. Existing large-bundle warning remains on the production build.
- Admin notification bell now includes pending student registrations and routes View actions to the registration review page. It refreshes automatically every 10 seconds and immediately when the browser tab regains focus; this is near-real-time polling and does not require a page reload. Sound is off by default and can be enabled in the notification panel; enabled sound plays one brief chime when newly detected registration IDs arrive, not on every poll. The sound preference and dismissed notification history are stored in localStorage per admin user. “Clear history” only dismisses notification entries from this browser; it does not delete applications, requests, or audit logs. No broadcasting/WebSocket service was added.
- Restyled `StudentQrCard` as a reusable QR dialog: it supports both current-student request QR codes and one-time registration QR codes, with copy and print actions. The QR registrations page now uses the screenshot-inspired full-width application list; admins generate registration QR codes from the page header and view/share them in the dialog.
- Registration approve/reject actions use consistent semantic button sizes, keyboard focus rings, and action-specific pending labels. Both actions are disabled while one is in progress for that application.
- Removed per-student QR buttons from the Students table actions. The page-level Registration QR action remains available for admin-issued enrollment codes.
- Expanded audit logging to record successful authenticated admin/teacher GET page-data views as `<module>.viewed`, successful mutations, failed authenticated mutations as `<module>.action_failed`, plus existing login/security events. Audit-log reads, `/api/me`, public reads, and the notification bell's explicitly marked background polls are excluded to prevent noisy self-logging; normal user visits to student request/registration lists are still recorded. The Audit Log page now filters by Admin or Teacher role and explains the captured event types. No request bodies, passwords, or tokens are recorded.
- Audit Log filters default to the Today preset while the two calendar inputs remain blank. Presets include Today, Yesterday, This week (Monday through today), Custom range, and All time. Calendar values are only used for the Custom range preset.
- Class cards now display the course name in the top badge; class name and ID remain in the subtitle. Removed the duplicate Course detail row, and the Class teacher row shows the assigned teacher's full name.
