import { Navigate, Outlet, useLocation } from "react-router";

type ProtectedRouteProps = {
  redirectTo?: string;
};

/**
 * Wraps routes that require authentication.
 * If not authenticated, redirects to login (or redirectTo).
 * Replace the isAuthenticated check with your auth context/token when ready.
 */
export default function ProtectedRoute({ redirectTo = "/login" }: ProtectedRouteProps) {
  const location = useLocation();

  // TODO: replace with your auth check (e.g. auth context, localStorage token, or API)
  const isAuthenticated = Boolean(typeof window !== "undefined" && window.localStorage.getItem("authToken"));

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
