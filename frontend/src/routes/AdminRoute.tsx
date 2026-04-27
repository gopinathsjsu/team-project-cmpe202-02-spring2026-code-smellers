import { Navigate, Outlet } from "react-router";
import { useAuth } from "../auth/AuthProvider";

export function AdminRoute() {
  const { status, user } = useAuth();

  if (status === "loading") {
    return null;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  if (!user?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
