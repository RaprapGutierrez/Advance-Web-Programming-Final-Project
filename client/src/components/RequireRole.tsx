// src/components/RequireRole.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, type Role } from "../lib/auth";

// Not logged in -> /login. Wrong role -> sent to their own home page.
export default function RequireRole({ allow }: { allow: Role[] }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!allow.includes(user.role)) {
    return <Navigate to={user.role === "owner" ? "/dashboard" : "/studios"} replace />;
  }
  return <Outlet />;
}
