import { useState } from "react";
import { Button } from "../components/ui/button";
import { FormField, Input } from "../components/ui/input";
import { Link, useNavigate, useLocation } from "react-router";

import { apiUrl } from "../lib/api.ts";
import { useAuth } from "../auth/AuthProvider.tsx";

async function doLogin(email: string, password: string): Promise<string> {
  const response = await fetch(apiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`${data.error} (${response.status})`);
  }

  const token = data.session?.access_token;
  if (!token) {
    throw new Error("Login succeeded but no access token was returned");
  }

  return token;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-elevated">
        <h1 className="font-display text-3xl font-bold text-brand-900">
          Welcome Back!
        </h1>

        {/* Input & FormField */}
        <form
          className="mt-8"
          onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            if (isSubmitting) {
              return;
            }

            setFormError(undefined);
            setEmailError(undefined);
            setPasswordError(undefined);

            if (!email || !password) {
              if (!email) {
                setEmailError("Email is required.");
              }
              if (!password) {
                setPasswordError("Password is required.");
              }
              return;
            }

            setIsSubmitting(true);

            try {
              const token = await doLogin(email, password);
              await login(token);
              navigate(location.state?.from || "/");
            } catch (error) {
              setFormError(
                error instanceof Error ? error.message : "Unexpected error",
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="mt-4 space-y-6">
            {/* Form Error Banner */}
            {formError && (
              <div className="rounded-md bg-error-50 p-3 text-sm text-error-600 border border-error-200">
                {formError}
              </div>
            )}

            {/* Email */}
            <div>
              <FormField
                label="Email"
                htmlFor="email-box"
                hint="We'll never share your email."
                required
                error={emailError}
              >
                <Input
                  id="email-box"
                  name="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  error={emailError}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFormError(undefined);
                    setEmailError(undefined);
                  }}
                />
              </FormField>
            </div>

            {/* Password */}
            <div>
              <FormField
                label="Password"
                htmlFor="password-box"
                required
                error={passwordError}
              >
                <Input
                  id="password-box"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  error={passwordError}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFormError(undefined);
                    setPasswordError(undefined);
                  }}
                />
              </FormField>
            </div>

            <div className="text-center">
              <Button
                type="submit"
                fullWidth
                className="max-w-xs mt-4 mb-6 active:bg-brand-800 cursor-pointer"
                size="lg"
                isLoading={isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </Button>

              <div>
                <p>
                  <Link
                    to="/forgot"
                    className="text-brand-600 underline hover:text-brand-800"
                  >
                    Forgot password?
                  </Link>
                </p>

                <p>
                  New to Eventdull?{" "}
                  <Link
                    to="/register"
                    className="text-brand-600 underline hover:text-brand-800"
                  >
                    Sign up!
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
