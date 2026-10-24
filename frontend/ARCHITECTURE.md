# Frontend architecture

The frontend uses a feature module structure. Code for one school feature lives
together under `src/modules`, while application-wide pieces live under
`src/shared`.

```text
src/
├── app/                         # App-level route composition
├── modules/
│   ├── attendance/
│   ├── auth/
│   ├── classes/
│   ├── dashboard/
│   ├── public/
│   ├── settings/
│   ├── student-requests/
│   ├── students/
│   └── teachers/
├── shared/
│   ├── api/apiClient.js         # Shared Axios instance and token header
│   ├── components/              # Reusable UI without feature rules
│   ├── config/
│   ├── guards/
│   └── layout/
├── App.jsx
└── main.jsx
```
Feature modules can contain `api/` for endpoint calls, `pages/` for route-level
screens, and `components/` for UI used by that feature. Add `hooks/`, `context/`,
or `utils/` inside a module only when that feature needs them. Keep reusable,
feature-neutral code in `shared/`.

TypeScript is being adopted gradually, starting with the dashboard module. Keep
new dashboard data contracts in `modules/dashboard/types/` and run
`npm run typecheck` after changing typed modules. Existing JavaScript and JSX
modules remain valid during the migration.

Use Tailwind utility classes for feature and layout styling. Shared color tokens
and light/dark theme variables live in `src/index.css`; the Vite Tailwind plugin
scans module components for utilities. Keep standalone CSS for cases utilities
cannot express cleanly, such as chart-library SVG details.

Use the `@/` alias for imports from `src`, for example
`@/modules/students/api/studentApi` or `@/shared/components/AppButton`. The
router stays in `app/router.jsx` so the application's URL map is visible in one
place.
