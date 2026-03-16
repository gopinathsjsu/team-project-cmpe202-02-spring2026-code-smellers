import { useState } from "react";
import { Button } from "../components/ui/button";
import { FormField, Input } from "../components/ui/input";
import { Link } from "react-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | undefined>();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-brand-900">
        Welcome Back!
      </h1>

      {/* Input & FormField */}
      <section className="mt-12">
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
              className="max-w-xs mb-4"
              size="lg"
              onClick={() =>
                setFormError(email ? undefined : "Email is required.")
              }
            >
              Login
            </Button>

            <div>
              <p className="underline">
                <Link to="/forgot">Forgot password?</Link>
              </p>
              <p>
                {" "}
                New to &lt;appname&gt;?{" "}
                <span className="underline">
                  {" "}
                  <Link to="/register">Sign up</Link>
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
