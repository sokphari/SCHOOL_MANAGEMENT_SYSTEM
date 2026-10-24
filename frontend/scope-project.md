# Frontend Scope Project - School Management System

## 1. Project Overview
- **Project Type:** React SPA (Vite) consuming Laravel REST API
- **Purpose:** Admin/Teacher dashboard for managing school operations
- **Location:** `frontend/`
- **API Base URL:** `http://127.0.0.1:8000/api` (configured in `src/api/axios.jsx`)
- **Auth:** Token-based (Bearer token from localStorage)
- **Public Pages:** Home, Student Request submission/QR scan

## 2. Current Frontend Architecture
- **Framework:** React 19.2.4
- **Build Tool:** Vite 8.0.1
- **Router:** React Router DOM 7.13.2
- **HTTP:** Axios 1.14.0
- **UI Libraries:** FontAwesome, recharts 3.8.1, qrcode.react 4.2.0, @yudiel/react-qr-scanner 2.5.1
- **State:** React Context (AuthContext)
- **Structure:** Feature-based pages, shared components, API layer, guards

## 3. Technology Stack and Versions
From `frontend/package.json`:
- react ^19.2.4, react-dom ^19.2.4
- react-router-dom ^7.13.2
- axios ^1.14.0
- vite ^8.0.1
- eslint ^9.39.4
- recharts ^3.8.1
- qrcode.react ^4.2.0
- @yudiel/react-qr-scanner ^2.5.1

## 4. Folder Structure Explanation
```
frontend/src/
├── api/           # API client functions (axios instance + per-module APIs)
├── app/           # Router setup
├── assets/        # Static assets
├── components/
│   ├── charts/    # Chart components
│   ├── common/    # Reusable UI components
│   ├── guards/    # Route guards (ProtectedRoute, RoleRoute)
│   └── layout/    # Layout components (AppLayout, Sidebar)
├── config/        # Menu configuration
├── context/       # AuthContext
├── pages/         # Page components by feature
└── utils/         # (not present as separate files visible)
```

## 5. Routing Architecture
**Router:** `src/app/router.jsx` using `createBrowserRouter`

**Public Routes:**
- `/` - HomePage
- `/request-scan` - StudentRequestScanPage (QR/manual submission)
- `/admin/login` - LoginPage

**Protected Routes (under `/admin`, wrapped in ProtectedRoute):**
- `/admin` redirects to `/admin/dashboard`
- `/admin/dashboard` - DashboardPage (all authenticated)
- `/admin/teachers` - TeachersPage (admin only)
- `/admin/teachers/create` - TeacherCreatePage (admin only)
- `/admin/teachers/:id/edit` - TeacherEditPage (admin only)
- `/admin/students` - StudentsPage (admin, teacher)
- `/admin/students/create` - StudentCreatePage (admin only)
- `/admin/students/:id/edit` - StudentEditPage (admin only)
- `/admin/classes` - ClassesPage (admin, teacher)
- `/admin/classes/create` - ClassCreatePage (admin only)
- `/admin/classes/:id/edit` - ClassEditPage (admin only)
- `/admin/classes/:id` - ClassDetailPage (admin, teacher)
- `/admin/attendance` - AttendancePage (admin, teacher)
- `/admin/student-requests` - StudentRequestsPage (admin only)
- `/admin/student-requests/:id` - StudentRequestDetailPage (admin only)
- `/admin/settings` - SettingsPage (admin only)

**Route Guards:**
- `ProtectedRoute`: checks token in AuthContext; if no token redirects to `/login` (**bug:** should redirect to `/admin/login`)
- `RoleRoute`: checks user.role against allowed roles; if unauthorized redirects to `/dashboard` (**bug:** should redirect to `/admin/dashboard` or appropriate location)

## 6. Authentication and Role-Based Navigation
- **AuthContext:** manages user, token (from localStorage), login/logout/fetchUser
- **Login:** calls `loginApi` (POST /login), stores token, fetches user via `meApi`
- **Logout:** calls `logoutApi`, clears token/user
- **Token handling:** Axios interceptor adds `Authorization: Bearer ${token}` to requests
- **Role-based menu:** `config/menu.js` filters menu items by user.role
- **Roles:** admin, teacher (based on backend)

## 7. Layouts and UI Components
**Layouts:**
- `AppLayout`: Main layout with fixed Sidebar, header with date/live indicator, scrollable content area with Outlet

**Common Components:**
- `AppButton`, `AppInput`, `AppSelect`, `AppModal`, `AppTable`, `AppPagination` - basic UI components
- `StatCard`, `StatCardCustom` (in Dashboard) - stat displays
- `NotificationBell` - shows pending request count, polls every 10s, navigates to requests
- `StudentQrCard` - generates QR code for student request submission

**Charts:**
- `GenderChart` (PieChart with recharts)
- `RequestChart` (BarChart with recharts)

**Guards:**
- `ProtectedRoute`, `RoleRoute`

## 8. Existing Frontend Modules
| Module | Pages/Components | API | Status |
|---|---|---|---|
| Auth | LoginPage, AuthContext, guards | authApi | Implemented |
| Dashboard | DashboardPage, charts, stat cards | dashboardApi | Implemented (admin/teacher views) |
| Students | StudentsPage, StudentsCreatePage, StudentsEditPage, StudentQrCard | studentApi | Implemented |
| Teachers | TeachersPage, TeachersCreatePage, TeachersEditPage | teacherApi | Implemented |
| Classes | ClassesPage, ClassesCreatePage, ClassesEditPage, ClassesDetailsPage | classApi | Implemented |
| Attendance | AttendancePage | attendanceApi | Implemented |
| Student Requests (Admin) | StudentRequestsPage, StudentRequestsDetailPage, NotificationBell | studentRequestsApi | Implemented |
| Student Requests (Public) | StudentRequestScanPage | publicRequestApi | Implemented |
| Settings | SettingsPage | settingApi | Implemented |
| Public Home | HomePage (with typing animation) | publicSettingApi | Implemented |

## 9. Completed Pages and Features
**Auth:**
- Login form, error handling (including 429 throttling), redirects to dashboard

**Dashboard:**
- Role-based views (admin shows totals, gender chart, request stats; teacher shows their classes, student counts)
- Stat cards with icons and styling
- Charts (gender distribution, request statistics)
- Notification bell with pending count

**Students:**
- List with search/filter (code/name/phone/email, status, gender), pagination
- Create/edit forms with validation error display
- Delete with confirmation
- QR code generation/display/print
- Role-based actions (admin can create/edit/delete)

**Teachers:**
- List with search/filter, pagination
- Create/edit forms
- Delete with confirmation
- **Note:** Navigation paths inconsistent (some use `/teachers/*`, routes are under `/admin/teachers/*`)

**Classes:**
- List with search/filter, pagination
- Create/edit forms with teacher selection
- View class details, assign/remove students
- Role-based actions

**Attendance:**
- Select class and date, load students
- Mark attendance status (present/absent/late/excused) with notes
- Bulk save
- Summary counts
- Teacher can access

**Student Requests (Admin):**
- List with filters (search, status, category), pagination
- View details, update status and admin note
- Pending count badge

**Student Requests (Public):**
- QR code scanning or manual code entry
- Student lookup
- Submit request with category/subject/description/priority
- Success/error handling

**Settings (Admin):**
- Edit school info, Telegram chat ID, logo/banner URLs
- Validation error display
- Success message with auto-hide

**Home Page:**
- Public landing page with school info, typing animation for school name
- Links to request submission

## 10. Partially Completed Features
- **Route guard redirects:** ProtectedRoute goes to `/login` (route is `/admin/login`); RoleRoute goes to `/dashboard` (should be under `/admin`)
- **Navigation inconsistencies:** Teachers pages navigate to `/teachers/*` instead of `/admin/teachers/*`; requests detail navigates to `/student-requests` instead of `/admin/student-requests`
- **Error handling:** Some pages have basic error handling, others could be improved
- **Form validation:** Client-side validation minimal; relies on server validation
- **Loading states:** Present in most pages but could be more consistent

## 11. Missing Pages and Features
- **User management:** No UI to create/manage admin/teacher users (backend supports roles)
- **Profile page:** No user profile management
- **Password change:** Not implemented
- **Forgot password:** Not implemented
- **Reports/Exports:** No PDF/Excel export functionality
- **Advanced filtering/sorting:** Basic filtering only
- **Bulk operations:** Limited bulk operations
- **Notifications system:** Only notification bell for requests
- **File uploads:** No file upload UI (only URL inputs for logos/banners)
- **Dark mode:** Not implemented
- **Mobile responsiveness:** Basic styling, may need improvement
- **Student/Teacher detail pages:** Teachers have no detail page route; students no detail page (only edit/QR)
- **Unauthorized/Not Found pages:** Referenced in structure but not found in src/pages

## 12. Backend API Integration Status
**Well Integrated:**
- Auth (login/me/logout)
- Students CRUD
- Teachers CRUD
- Classes CRUD + assign/remove
- Attendance (bulk save, by class/date)
- Dashboard
- Student requests (admin + public)
- Settings (admin + public)

**Integration Issues:**
- **Route mismatches causing navigation errors:** ProtectedRoute/RoleRoute redirect to wrong paths
- **Teachers routes:** Frontend navigates to non-admin paths but routes defined under admin
- **Requests detail:** Navigation path incorrect
- **Attendance index:** Backend has bug but frontend doesn't call it directly (uses byClassAndDate)
- **API base URL:** Hardcoded to localhost:8000

## 13. UI/UX Issues
- **Inconsistent navigation paths** - mix of `/admin/*` and non-admin paths
- **Lint errors present** (17 errors, 11 warnings) - code quality issues
- **Some components use inline styles extensively** - could benefit from CSS modules/styled components
- **Error messages:** Some use alert(), others inline messages
- **Loading states:** Inconsistent patterns
- **Mobile responsiveness:** Not explicitly tested, layout may not be optimal on mobile
- **Accessibility:** Limited ARIA attributes, keyboard navigation may need improvement

## 14. State Management Review
- **Auth state:** Managed via Context API (AuthContext) - appropriate for auth
- **Component state:** Most data fetched and stored in component state (useState) - appropriate for this app size
- **No global state library** (Redux/Zustand) - not needed currently
- **Data fetching:** Direct API calls in components via useEffect - simple and clear

## 15. Form Validation Review
- **Client-side:** Minimal validation; mainly relies on HTML5 and basic checks
- **Server-side:** Backend Form Requests provide validation
- **Error display:** Some forms display server validation errors (StudentsCreatePage), others use alerts
- **Inconsistent patterns** across forms

## 16. Responsive Design Review
- **Layout:** Uses flexbox/grid in places, fixed sidebar (260px) may cause issues on small screens
- **Tables:** Wrapped in divs with overflow-x: auto in some places
- **Components:** Some responsive grids used
- **Mobile:** No explicit mobile breakpoints visible; likely needs improvement for mobile devices

## 17. Known Bugs and Technical Debt
- **Critical Navigation Bugs:**
  - `ProtectedRoute.jsx:8` redirects to `/login` but route is `/admin/login`
  - `RoleRoute.jsx:8` redirects to `/dashboard` but should be `/admin/dashboard`
  - `TeachersCreatePage`, `TeachersEditPage`, `TeachersPage` navigate to `/teachers/*` but routes under `/admin/teachers/*`
  - `StudentRequestsDetailPage` navigates back to `/student-requests` but route is `/admin/student-requests`
- **Lint Errors:** 17 errors including unused vars, missing dependencies in useEffect, etc.
- **Build:** Frontend builds successfully but with large chunk warning
- **API URL:** Hardcoded localhost URL
- **Duplicate/confusing routes:** Some paths inconsistent
- **RoleMiddleware not used** on backend affects security model
- **SettingsPage:** Has unused `successTimeout` variable
- **ClassesDetailsPage:** Has useEffect issues (calls fetchData before declaration)

## 18. Frontend Development Roadmap
**Immediate (P0):**
1. Fix navigation/route guard bugs
2. Fix teachers navigation paths
3. Fix requests navigation paths
4. Fix lint errors

**Short-term (P1):**
1. Improve form validation consistency
2. Better error handling (replace some alerts)
3. Mobile responsiveness improvements
4. Add loading states consistency

**Medium-term (P2):**
1. Add missing pages (profile, user management)
2. Improve UI/UX
3. Add data export features
4. Enhance charts/reports

**Long-term (P3/P4):**
1. Performance optimization (code splitting)
2. Accessibility improvements
3. Testing
4. Production deployment setup

## 19. Prioritized Task Checklist
### P0 - Critical Fixes
- [ ] **Fix ProtectedRoute** - redirect to `/admin/login` instead of `/login`
- [ ] **Fix RoleRoute** - redirect to `/admin/dashboard` instead of `/dashboard`
- [ ] **Fix Teachers navigation** - change all `/teachers/*` to `/admin/teachers/*` in TeachersCreate/Edit/Page
- [ ] **Fix StudentRequestsDetailPage** - navigate back to `/admin/student-requests`
- [ ] **Fix lint errors** - address critical errors (unused vars, etc.)

### P1 - Complete Existing Modules
- [ ] **Improve error handling** - replace alerts with better UX where appropriate
- [ ] **Fix form validation display** consistency
- [ ] **Improve mobile responsiveness** - test and fix layout issues
- [ ] **Add proper loading states** throughout
- [ ] **Fix useEffect dependencies** where needed

### P2 - Essential Missing Modules
- [ ] **User management UI** (if needed)
- [ ] **Profile page**
- [ ] **Password change**
- [ ] **Reports/exports**

### P3 - Quality and Improvements
- [ ] **Refactor inline styles** to CSS/modules
- [ ] **Improve accessibility**
- [ ] **Add error boundaries**
- [ ] **Optimize bundle size** (code splitting)
- [ ] **Add tests**

### P4 - Production Readiness
- [ ] **Environment configuration** (API URL)
- [ ] **Build optimization**
- [ ] **Error tracking**
- [ ] **Deployment checklist**
