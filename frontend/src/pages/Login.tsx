import { useState } from "react";
import { Button } from "../components/ui/button";
import { FormField, Input } from "../components/ui/input";
import { Link, useLocation, useNavigate } from "react-router";
import { apiUrl } from "../lib/api";

type LoginApiUser = {
  id?: string;
  [key: string]: unknown;
};

type LoginApiSession = {
  access_token?: string;
  user?: LoginApiUser;
  [key: string]: unknown;
};

type LoginApiResponse = {
  user?: LoginApiUser;
  session?: LoginApiSession;
  error?: string;
};

type RouteState = {
  from?: {
    pathname?: string;
  };
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as RouteState | null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setFormError("Email is required.");
      return;
    }
    if (!password) {
      setFormError("Password is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(undefined);

    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const data = (await response.json()) as LoginApiResponse;

      if (!response.ok) {
        setFormError(data.error || `Login failed (${response.status})`);
        return;
      }

      const accessToken = data.session?.access_token;
      const userId = data.user?.id || data.session?.user?.id;

      if (!accessToken || !userId) {
        setFormError("Login response is missing token or user id.");
        return;
      }

      window.localStorage.setItem("authToken", accessToken);
      window.localStorage.setItem("accessToken", accessToken);
      window.localStorage.setItem("authUserId", userId);
      window.localStorage.setItem("organizerId", userId);
      window.localStorage.setItem("userId", userId);
      window.localStorage.setItem("authUser", JSON.stringify(data.user ?? {}));
      window.localStorage.setItem("user", JSON.stringify(data.user ?? {}));
      window.localStorage.setItem("authSession", JSON.stringify(data.session ?? {}));
      window.localStorage.setItem("session", JSON.stringify(data.session ?? {}));

      const redirectPath = routeState?.from?.pathname || "/dashboard-organizer";
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unexpected error during login.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 sm:px-6 lg:px-8 pb-24">
    
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-elevated">
    
        <h1 className="font-display text-3xl font-bold text-brand-900">
          Welcome Back!
        </h1>

        {/* Input & FormField */}
        <section className="mt-10">
          <div className="mt-4 space-y-6">
            {/* Email */}
            <div>
              <FormField
                label="Email"
                htmlFor="email-box"
                required
                hint="We'll never share your email."
                error={formError}
              >
                <Input
                  id="email-box"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFormError(undefined);
                  }}
                  error={formError}
                />
              </FormField>
            </div>

            {/* Password */}
            <div>
              <FormField label="Password" htmlFor="password-box" required>
                <Input
                  id="password-box"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormField>
            </div>

            <div className="text-center">
              <Button
                fullWidth
                className="max-w-xs mt-4 mb-6 active:bg-brand-800"
                size="lg"
                onClick={handleLogin}
                isLoading={isSubmitting}
              >
                Login
              </Button>

              <div>
                <p>
                <Link to="/forgot" className="text-brand-600 underline hover:text-brand-800">Forgot password?</Link>
                </p>
                
                <p>
                  New to &lt;appname&gt;?{" "}
                  <Link to="/register" className="text-brand-600 underline hover:text-brand-800">Sign up!</Link>
                </p>
              </div>
              
            </div>
          </div>
        </section>
        
      </div>
      
    </div>
  );
}
