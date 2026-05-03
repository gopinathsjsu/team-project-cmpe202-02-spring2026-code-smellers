import { useState } from "react";
import { Button } from "../components/ui/button";
import { FormField, Input } from "../components/ui/input";
import { Link, useLocation, useNavigate } from "react-router";
import { apiUrl } from "../lib/api";
import { useAuth } from "../auth/AuthProvider";

async function doRegister(
  name: string,
  email: string,
  password: string,
): Promise<string> {
  const response = await fetch(apiUrl("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`${data.error} (${response.status})`);
  }

  const token = data.session?.access_token;
  if (!token) {
    throw new Error("Registration succeeded but no access token was returned");
  }

  return token;
}

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [password2Error, setPassword2Error] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-elevated">
        <h1 className="font-display text-3xl font-bold text-brand-900">
          Welcome Aboard!
        </h1>

        {/* Input & FormField */}
        <form
          className="mt-8"
          onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault(); // Stops page reload

            if (isSubmitting) {
              return;
            }

            setNameError(undefined);
            setEmailError(undefined);
            setPasswordError(undefined);
            setPassword2Error(undefined);
            setFormError(undefined);

            if (
              !name ||
              !email ||
              !password ||
              password.length < 8 ||
              !password2
            ) {
              if (!name) {
                setNameError("Name is required.");
              }
              if (!email) {
                setEmailError("Email is required.");
              }
              if (!password) {
                setPasswordError("Password is required.");
              }
              if (password && password.length < 8) {
                setPasswordError("Password must be at least 8 characters.");
              }
              if (!password2) {
                setPassword2Error("Please confirm your password.");
              }
              return;
            }

            if (password !== password2) {
              setPasswordError("Passwords do not match. Please try again.");
              setPassword2Error("Passwords do not match. Please try again.");
              return;
            }

            setIsSubmitting(true);

            try {
              const token = await doRegister(name, email, password);
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
          <section className="mt-8">
            <div className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-md bg-error-50 p-3 text-sm text-error-600 border border-error-200">
                  {formError}
                </div>
              )}
              {/* Name */}
              <div>
                <FormField
                  label="Full Name"
                  htmlFor="name-box"
                  required
                  error={nameError}
                >
                  <Input
                    placeholder="First Last"
                    value={name}
                    error={nameError}
                    onChange={(e) => {
                      setName(e.target.value);
                      setNameError(undefined);
                    }}
                  />
                </FormField>
              </div>

              {/* Email */}
              <div>
                <FormField
                  label="Email"
                  htmlFor="email-box"
                  required
                  hint="We'll never share your email."
                  error={emailError}
                >
                  <Input
                    id="demo-email"
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(undefined);
                    }}
                    error={emailError}
                  />
                </FormField>
              </div>

              {/* Password */}
              <div>
                <FormField
                  label="Password"
                  htmlFor="password-box"
                  required
                  hint="Your password must be at least 8 characters."
                  error={passwordError}
                >
                  <Input
                    id="demo-password"
                    type="password"
                    value={password}
                    error={passwordError}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError(undefined);
                    }}
                  />
                </FormField>
                <br></br>
                <FormField
                  label="Confirm Password"
                  htmlFor="demo-password"
                  required
                  error={password2Error}
                >
                  <Input
                    id="demo-password"
                    type="password"
                    value={password2}
                    error={password2Error}
                    onChange={(e) => {
                      setPassword2(e.target.value);
                      setPassword2Error(undefined);
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
                  onClick={() => {
                    setNameError(name ? undefined : "Name is required.");
                    setEmailError(email ? undefined : "Email is required.");
                    setPasswordError(
                      password ? undefined : "Password is required.",
                    );
                    setPasswordError(
                      password.length >= 8
                        ? undefined
                        : "Password must be at least 8 characters.",
                    );
                    setPassword2Error(
                      password2 ? undefined : "Please confirm your password.",
                    );
                  }}
                >
                  {isSubmitting ? "Signing Up..." : "Sign Up"}
                </Button>

                <p>
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-brand-600 underline hover:text-brand-800"
                  >
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
