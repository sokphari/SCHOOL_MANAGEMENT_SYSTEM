# Backend Scope Project - School Management System

## 1. Project Overview
- **Project Type:** REST API for School Management (Laravel 12 backend, React frontend consuming API)
- **Purpose:** Manage students, teachers, classes, attendance, student requests/inquiries, settings, authentication/authorization
- **Location:** `backend/` (this repo)
- **API Style:** RESTful (routes under `/api`, auth via Laravel Sanctum bearer tokens)
- **Notes:** No CORS config file present; frontend calls `http://127.0.0.1:8000/api` by default.

## 2. Current Backend Architecture
- **Framework:** Laravel 12.28.1 (per composer.json)
- **PHP:** ^8.2 (environment PHP 8.3.6)
- **Auth:** Laravel Sanctum 4.3 (token-based API auth). `User` uses `HasApiTokens`.
- **API Routes:** Defined in `routes/api.php`. Web routes minimal (`/` -> welcome view).
- **Controllers:** API controllers under `app/Http/Controllers/Api/` (8 controllers)
- **Models:** Eloquent models in `app/Models/` (8 models)
- **Requests:** Form Requests for validation (`app/Http/Requests/`)
- **Services:** `app/Services/TelegramService.php` for Telegram notifications
- **Middleware:** `app/Http/Middleware/RoleMiddleware.php` exists but is empty (no logic implemented). Authorization is mostly done inline in controllers.
- **Rate limiting:** `throttle:login` applied to `POST /api/login` and `POST /api/public/student-requests` (defined in `bootstrap/app.php` defaults; no explicit RateLimiter config shown).
- **Tests:** Basic examples only (`tests/Feature/ExampleTest.php`, `tests/Unit/ExampleTest.php`).

## 3. Technology Stack and Versions
**Backend (`backend/composer.json`):**
- laravel/framework ^12.0
- laravel/sanctum ^4.3
- laravel/tinker ^2.10.1
- phpunit/phpunit ^11.5.50, laravel/pint ^1.24, etc.

**Other:** Vite present in backend (`vite.config.js`) but Laravel frontend assets appear minimal; main frontend is in `../frontend/`.

## 4. Folder Structure Explanation
```
backend/
├── app/
│   ├── Http/Controllers/Api/  # API controllers
│   ├── Http/Middleware/       # Middleware (RoleMiddleware empty)
│   ├── Http/Requests/         # Form request validation classes
│   ├── Models/                # Eloquent models
│   ├── Providers/             # Service providers
│   └── Services/              # TelegramService
├── bootstrap/                 # App bootstrap (Laravel 11+ style)
├── config/                    # Config files (auth, sanctum, database, etc.)
├── database/
│   ├── factories/             # UserFactory
│   ├── migrations/            # All migrations
│   └── seeders/               # DatabaseSeeder
├── public/                    # Public web root
├── routes/api.php, web.php    # Routes
├── tests/                     # PHPUnit tests
└── system_shools              # SQLite DB file present in repo
```

## 5. Database Design and Relationships
**Migrations present (in order):**
1. `0001_01_01_000000_create_users_table.php` - users, password_reset_tokens, sessions
2. `0001_01_01_000001_create_cache_table.php` - cache, cache_locks
3. `0001_01_01_000002_create_jobs_table.php` - jobs, job_batches, failed_jobs
4. `2026_03_27_021853_create_personal_access_tokens_table.php` - Sanctum tokens
5. `2026_03_27_022045_create_students_table.php` - students
6. `2026_03_27_022046_create_teachers_table.php` - teachers (FK to users nullable)
7. `2026_03_27_030315_create_school_classes_table.php.php` - school_classes (FK to teachers nullable)
8. `2026_03_27_030448_create_attendances_table.php` - attendances (FKs to students, school_classes, users; unique on student_id, school_class_id, attendance_date)
9. `2026_03_27_030559_create_class_student_table.php` - pivot class_student (FKs to school_classes, students; unique pair)
10. `2026_03_29_075421_add_role_to_users_table.php` - adds `role` enum('admin','teacher') default 'teacher' to users
11. `2026_04_04_063151_create_student_requests_table.php` - student_requests
12. `2026_04_05_055559_create_settings_table.php` - settings (key/value)

**Relationships (from models):**
- User: HasApiTokens, Notifiable; `role` field added
- Teacher: `belongsTo(User)`, `hasMany(SchoolClass)`
- SchoolClass: `belongsTo(Teacher)`, `belongsToMany(Student)` via `class_student` with pivot `joined_at`, `status` + timestamps, `hasMany(Attendance)`
- Student: `belongsToMany(SchoolClass)`, `hasMany(Attendance)`
- Attendance: `belongsTo(Student)`, `belongsTo(SchoolClass)`, `belongsTo(User, marked_by)`
- StudentRequest: `belongsTo(Student)` (nullable FK)
- Setting: simple key/value

**DB state (from repo):** SQLite file `backend/system_shools` exists. Schema inspection showed users table has id/name/email/email_verified_at/password/remember_token/created_at/updated_at (no `role` column visible in that inspected copy) and migrations table has 9 entries; students/teachers/school_classes/attendances/class_student exist as tables. `student_requests` and `settings` tables reported as missing in that inspected copy (possible schema divergence between migrations/history and current DB file). Treat with caution.

## 6. Authentication and Authorization
- **Login:** `POST /api/login` (throttled). AuthController uses `Auth::attempt` with email/password, creates Sanctum token via `$user->createToken('api-token')->plainTextToken`. Returns `{user, token}`.
- **Me:** `GET /api/me` (auth:sanctum) returns user.
- **Logout:** `POST /api/logout` (auth:sanctum) deletes current access token.
- **Roles:** `users.role` enum('admin','teacher') default 'teacher' (migration adds it). RoleMiddleware exists but **not implemented** and **not applied** in routes. Authorization is enforced inline per controller/action.
- **Guards:** `config/auth.php` defaults to web guard; API uses Sanctum tokens (stateless bearer) - Sanctum middleware configured.
- **Protected routes:** Most routes under `Route::middleware('auth:sanctum')->group(...)` require auth.

## 7. Existing Backend Modules
| Module | Controllers/Models | Routes | Status |
|---|---|---|---|
| Authentication | AuthController, User, Sanctum | POST /login, GET /me, POST /logout | Implemented (token auth) |
| Dashboard | DashboardController | GET /dashboard (auth) | Implemented (role-based: admin vs teacher) |
| Students | StudentController, Student, StudentPublicController | apiResource students (auth), GET /public/students/by-code/{student_code} | Implemented |
| Teachers | TeacherController, Teacher | apiResource teachers (auth) | Implemented |
| Classes | SchoolClassController, SchoolClass | apiResource classes (auth), assign/remove students | Implemented |
| Attendance | AttendanceController, Attendance | apiResource attendances + custom routes (bulk, by class/date) | Partially implemented / has issues (see below) |
| Student Requests | StudentRequestController, StudentRequest | public POST + admin CRUD/status under auth | Implemented (with Telegram notifications) |
| Settings | SettingController, Setting | GET/PUT /settings (auth admin), GET /public/settings | Implemented |
| Telegram | TelegramService | GET /test-telegram (public) | Utility present |

## 8. Completed Features
- User login/logout/me with Sanctum tokens
- Role-based dashboard data (admin vs teacher)
- Students CRUD with search/filter by status/gender
- Teachers CRUD with search/filter
- Classes CRUD with teacher assignment, search/filter, teacher-scoped listing for teachers
- Class-student assignment/removal
- Attendance marking (store), bulk store by class, get by class and date, delete/show (index has issues)
- Public student lookup by code
- Student requests (public submission with validation, throttled), admin list/show/update status, pending count (admin only), Telegram notification on submission
- Settings (admin CRUD, public info endpoint)
- Teacher profile linkage used in dashboard/classes/attendance logic

## 9. Partially Completed Features
- **Attendance:** `AttendanceController@index()` exists but its implementation is broken/incomplete (references `$class` undefined when role is teacher and has early return logic that doesn't return data; also routes define both `apiResource('attendances', ...)` and explicit `POST /attendances`, `GET /attendances`, etc.). `byClassAndDate` works; `bulkStore` works with teacher ownership check; `store` works; `show/destroy` work.
- **RoleMiddleware:** File exists but empty - not integrated. Role checks are done ad-hoc in controllers.
- **Teacher-Student scoping:** Some teacher scoping implemented (classes filtered by teacher, dashboard filters), but not uniformly enforced across all endpoints.

## 10. Missing Backend Modules
- No dedicated Enrollment/Registration workflow beyond class-student pivot
- No Subjects/Courses module visible
- No Timetable/Schedule
- No Exams/Grades/Reports
- No Fees/Payments
- No Parent/Guardian user accounts/roles (only student/guardian contact fields on student)
- No Notifications system beyond Telegram for requests
- No File uploads implemented (Settings accept logo/banner URLs only)
- No API Resources/transformers (controllers return raw models/arrays)
- No Form Requests for Auth/Settings/StudentRequest (some use inline validation)
- No Policy/Authorization classes (Gates/Policies)

## 11. API Endpoint Inventory
| Method | Endpoint | Controller@Action | Auth Required | Role Restriction | Notes |
|---|---|---|---|---|---|
| GET | /api/public/settings | SettingController@publicInfo | No | - | Returns public school info |
| POST | /api/login | AuthController@login | No | - | Throttled (throttle:login) |
| GET | /api/settings | SettingController@index | Yes (auth:sanctum) | Admin (inline check) | Returns specific keys |
| PUT | /api/settings | SettingController@update | Yes | Admin (inline) | Updates settings |
| GET | /api/student-requests/pending-count | StudentRequestController@pendingCount | Yes | Admin (inline) | |
| GET | /api/student-requests | StudentRequestController@index | Yes | Admin (inline) | Paginated, filterable |
| GET | /api/student-requests/{studentRequest} | StudentRequestController@show | Yes | Admin (inline) | |
| PUT | /api/student-requests/{studentRequest}/status | StudentRequestController@updateStatus | Yes | Admin (inline) | Updates status/admin_note |
| POST | /api/logout | AuthController@logout | Yes | - | Deletes token |
| GET | /api/me | AuthController@me | Yes | - | |
| GET/POST/PUT/PATCH/DELETE | /api/students | StudentController (apiResource) | Yes | - | Role checks vary by frontend; controller has no explicit role restriction visible |
| GET/POST/PUT/PATCH/DELETE | /api/teachers | TeacherController (apiResource) | Yes | - | |
| GET/POST/PUT/PATCH/DELETE | /api/classes | SchoolClassController (apiResource) | Yes | - | Teachers see only their classes |
| GET/POST/PUT/PATCH/DELETE | /api/attendances | AttendanceController (apiResource) | Yes | - | index() has bug |
| POST | /api/classes/{class}/students/{student} | SchoolClassController@assignStudent | Yes | - | |
| DELETE | /api/classes/{class}/students/{student} | SchoolClassController@removeStudent | Yes | - | |
| POST | /api/attendances | AttendanceController@store | Yes | - | Also defined explicitly |
| GET | /api/attendances | AttendanceController@index | Yes | - | **Buggy** |
| GET | /api/classes/{class}/attendance/{date} | AttendanceController@byClassAndDate | Yes | - | |
| POST | /api/classes/{class}/attendance/bulk | AttendanceController@bulkStore | Yes | - | Teacher ownership checked |
| GET | /api/dashboard | DashboardController@index | Yes | - | Admin/teacher specific |
| GET | /api/public/students/by-code/{student_code} | StudentPublicController@findByCode | No | - | |
| POST | /api/public/student-requests | StudentRequestController@store | No | - | Throttled, sends Telegram |
| GET | /api/test-telegram | Closure | No | - | Test endpoint |

## 12. Security and Validation Review
**Strengths:**
- Passwords hashed (User uses `password => 'hashed'` cast)
- Sanctum token auth for API
- Form Requests used for most CRUD operations with validation rules
- Unique constraints on codes/emails where appropriate
- Teacher ownership checks in attendance bulk store and class filtering
- Admin checks inline for settings/requests
- Throttling on login and public request submission

**Concerns:**
- **RoleMiddleware empty and unused** - no centralized role enforcement
- **Authorization gaps:** Many endpoints rely on frontend role guards; backend doesn't consistently enforce roles (e.g., students/teachers/classes resources don't all check admin role)
- **AttendanceController@index() bug:** references undefined `$class` when teacher role - will cause error/undefined behavior
- **Settings validation:** allows `url` for logo/banner but no file upload; no sanitization beyond validation
- **CORS:** No cors config present; browser CORS may be an issue depending on deployment
- **Rate limiting:** throttle applied but configuration not visible/customized
- **Error exposure:** Some controllers return messages directly
- **Telegram:** credentials from env, logs errors; test endpoint exposed publicly
- **Route definition issues:** double semicolon on some routes (`->middleware('throttle:login');;`), both apiResource and explicit routes for attendances/students

## 13. Known Bugs and Technical Debt
- **Critical:** `AttendanceController@index()` - logic error (undefined variable `$class`) when user is teacher
- **Auth route protection:** `ProtectedRoute` navigates to `/login` on missing token, but actual login route is `/admin/login` (mismatch)
- **RoleRoute:** navigates to `/dashboard` on unauthorized role, but admin routes are under `/admin/*` (mismatch)
- **Teachers navigation:** Some teacher pages navigate to `/teachers/*` (non-admin paths) while routes are defined under `/admin/teachers/*` - inconsistent
- **Request detail navigation:** `StudentRequestsDetailPage` navigates back to `/student-requests` but route is under `/admin/student-requests` in router
- **DB schema mismatch:** Current SQLite `system_shools` may be missing tables/columns added in later migrations (role column not visible, student_requests/settings tables missing) - migrations exist but DB state unclear
- **No vendor installed** in repo; dependencies need installation
- **Lint errors in frontend** (17 errors) - indicates code quality issues
- **RoleMiddleware unused**
- **StoreAttendanceRequest has duplicate `attendance_date` rule**
- **SettingController logo_url/banner_url validation has spacing issue in rule string** (`'url',' max:2048'` has space before max)
- **TelegramService has store method that doesn't belong there** (looks misplaced)
- **No automated tests beyond examples**

## 14. Testing Status
- **PHPUnit configured** (`phpunit.xml`)
- **Tests present:** Feature and Unit example tests only
- **No actual feature/unit tests** for controllers/models/requests
- **Cannot run artisan tests** without vendor installed

## 15. Recommended Improvements
- Fix critical bugs (AttendanceController@index, route/navigation mismatches)
- Implement RoleMiddleware or use Policies/Gates properly
- Add authorization checks consistently in controllers
- Fix validation rule typos (spacing in url rule, duplicate rules)
- Add API Resources for consistent responses
- Implement proper error handling
- Add tests for critical flows
- Configure CORS if needed
- Move role checks to middleware/policies
- Clean up duplicate routes

## 16. Backend Development Roadmap
**Immediate (P0):**
1. Fix AttendanceController@index() bug
2. Fix validation issues (SettingController logo/banner rule, StoreAttendanceRequest duplicates)
3. Ensure DB migrations match expected schema / run migrations
4. Fix route/auth navigation mismatches

**Short-term (P1):**
1. Implement proper role authorization (middleware or policies)
2. Add missing Form Requests where needed
3. Standardize API responses
4. Add teacher-specific authorization checks

**Medium-term (P2):**
1. Add subjects/exams/grades modules if needed
2. Add file upload support
3. Improve validation and error handling
4. Add logging/monitoring

**Long-term (P3/P4):**
1. Comprehensive testing
2. API documentation
3. Performance optimization
4. Security hardening

## 17. Prioritized Task Checklist
### P0 - Critical Fixes
- [ ] **Fix AttendanceController@index()** - undefined `$class` variable when teacher role; implement proper logic or remove/fix
- [ ] **Fix SettingController validation** - remove space in `' max:2048'` rule
- [ ] **Fix StoreAttendanceRequest** - remove duplicate `attendance_date` rule
- [ ] **Verify/fix DB schema** - ensure migrations run, check role column exists, create missing tables if needed
- [ ] **Install dependencies** - `composer install` (no vendor present)

### P1 - Complete Existing Modules
- [ ] **Implement RoleMiddleware** or apply consistent role checks
- [ ] **Fix authorization gaps** - add role checks to student/teacher/class endpoints as appropriate
- [ ] **Clean up routes** - remove duplicate route definitions, fix double semicolons
- [ ] **Add missing Form Requests** for Auth/Settings/StudentRequest
- [ ] **Fix TelegramService** - move `store` method out if not needed there

### P2 - Essential Missing Modules
- [ ] **Subjects/Courses** (if required by school)
- [ ] **Exams/Grades** (if required)
- [ ] **Timetable** (if required)
- [ ] **Fees** (if required)

### P3 - Quality and Improvements
- [ ] **Add API Resources/transformers**
- [ ] **Write tests** for critical endpoints
- [ ] **Configure CORS**
- [ ] **Improve error handling**
- [ ] **Add logging**

### P4 - Production Readiness
- [ ] **Environment setup** - proper .env, APP_KEY
- [ ] **Migrations/seeding strategy**
- [ ] **Security audit**
- [ ] **Deployment checklist**
