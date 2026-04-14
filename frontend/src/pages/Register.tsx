import { useState } from "react";
import { Button } from "../components/ui/button";
import { FormField, Input } from "../components/ui/input";
import { Link } from "react-router";

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

  async function doRegister(
    name: string,
    email: string,
    password: string,
  ): Promise<[boolean, string]> {
    let succ = true;
    let err = "";

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`${data.error} (${response.status})`);
      }
    } catch (error: unknown) {
      succ = false;
      if (error instanceof Error) {
        err = error.message;
      } else {
        err = String(error);
      }
    }
    return [succ, err];
  }

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

            if (!name || !email || !password || !password2) {
              if (!name) {
                setNameError("Name is required.");
              }
              if (!email) {
                setEmailError("Email is required.");
              }
              if (!password) {
                setPasswordError("Password is required.");
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

            const [succ, err] = await doRegister(name, email, password);

            setIsSubmitting(false);

            if (succ) {
              alert("Registration successful! Please log in.");
            } else {
              setFormError("Registration failed: " + err);
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
                    placeholder="you@example.com"
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
                  hint="Password must be #-## characters long and contain blahblahblah."
                  error={passwordError}
                >
                  <Input
                    id="demo-password"
                    type="password"
                    placeholder="••••••••"
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
                    placeholder="••••••••"
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
                  className="max-w-xs mt-4 mb-6 active:bg-brand-800"
                  size="lg"
                  isLoading={isSubmitting}
                  onClick={() => {
                    setNameError(name ? undefined : "Name is required.");
                    setEmailError(email ? undefined : "Email is required.");
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

