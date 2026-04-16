import { Navigate, Outlet } from "react-router";
import { useAuth } from "../auth/AuthProvider";

export function GuestOnlyRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return null;
  }

  if (status === "authenticated") {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}