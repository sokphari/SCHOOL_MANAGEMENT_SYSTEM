import { Navigate } from "react-router-dom";
import { useAuth } from "@/modules/auth/context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
