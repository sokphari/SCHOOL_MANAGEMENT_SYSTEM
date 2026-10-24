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

Use the `@/` alias for imports from `src`, for example
`@/modules/students/api/studentApi` or `@/shared/components/AppButton`. The
router stays in `app/router.jsx` so the application's URL map is visible in one
place.
