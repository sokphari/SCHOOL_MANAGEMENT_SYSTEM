import { Navigate } from "react-router-dom";
import { useAuth } from "@/modules/auth/context/AuthContext";

export default function RoleRoute({ roles, children }) {
  const { user, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <div className="grid min-h-56 place-items-center text-sm text-secondary">Restoring your session…</div>;
  }

  if (!roles.includes(user?.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
