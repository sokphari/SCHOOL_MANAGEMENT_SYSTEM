import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/modules/auth/hooks/useAuth";

const teacherModules = [
  { key: "dashboard", path: "/admin/dashboard" },
  { key: "attendance", path: "/admin/attendance" },
  { key: "students", path: "/admin/students" },
  { key: "classes", path: "/admin/classes" },
  { key: "timetable", path: "/admin/timetable" },
  { key: "grades", path: "/admin/grades" },
];

export default function RoleRoute({ roles, feature, children }) {
  const { user, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return <div className="grid min-h-56 place-items-center text-sm text-secondary">Restoring your session…</div>;
  }

  if (!roles.includes(user?.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === "teacher") {
    const currentModule = teacherModules.find(({ path }) => location.pathname.startsWith(path));
    if (currentModule && !user.module_permissions?.includes(currentModule.key)) {
      const nextAllowedModule = teacherModules.find(({ key }) => user.module_permissions?.includes(key));
      if (nextAllowedModule) return <Navigate to={nextAllowedModule.path} replace />;
      return <div role="alert" className="rounded-xl border border-border bg-surface p-6 text-sm text-secondary">Your account currently has no module access. Please contact your school administrator.</div>;
    }

    if (feature && !user.feature_permissions?.includes(feature)) {
      return <div role="alert" className="rounded-xl border border-border bg-surface p-6 text-sm text-secondary">Your account does not have permission to use this feature. Please contact your school administrator.</div>;
    }
  }

  return children;
}
