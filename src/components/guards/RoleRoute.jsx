import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RoleRoute({ roles, children }) {
  const { user } = useAuth();

  if (!roles.includes(user?.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}