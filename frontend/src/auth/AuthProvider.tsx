import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiUrl } from "../lib/api";
import { clearAuthToken, getAuthToken, setAuthToken } from "../lib/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthUser = {
  id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
};

type AuthContextType = {
  status: AuthStatus;
  user: AuthUser | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchMe(token: string): Promise<{ user: AuthUser }> {
  const response = await fetch(apiUrl("/api/auth/me"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.user) {
    throw new Error(data.error || "Failed to fetch current user");
  }

  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  const refreshAuth = useCallback(async () => {
    const token = getAuthToken();

    if (!token) {
      setUser(null);
      setStatus("unauthenticated");
      return;
    }

    try {
      const { user } = await fetchMe(token);
      setUser(user);
      setStatus("authenticated");
    } catch {
      clearAuthToken();
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const login = useCallback(async (token: string) => {
    setAuthToken(token);
    await refreshAuth();
  }, [refreshAuth]);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const value = useMemo(
    () => ({
      status,
      user,
      login,
      logout,
      refreshAuth,
    }),
    [status, user, login, logout, refreshAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}