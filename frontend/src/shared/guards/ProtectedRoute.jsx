import { Navigate } from "react-router-dom";
import { useAuth } from "@/modules/auth/context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { token, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <div className="grid min-h-screen place-items-center bg-app-bg text-sm text-secondary">Restoring your session…</div>;
  }

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
