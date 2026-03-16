import { useState } from "react";
import { Button } from "../components/ui/button";
import { FormField, Input } from "../components/ui/input";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
              htmlFor="demo-email"
              required
              hint="We'll never share your email."
              error={formError}
            >
              <Input
                id="demo-email"
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
            <FormField label="Password" htmlFor="demo-password" required>
              <Input
                id="demo-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormField>
          </div>

          <Button
            fullWidth
            className="max-w-xs"
            size="lg"
            onClick={() =>
              setFormError(email ? undefined : "Email is required.")
            }
          >
            Login
          </Button>
          
          <div>
            <p><a href="/forgot">Forgot password?</a></p>
            <p> New to &lt;appname&gt;? <a href="/register">Sign up</a></p>
          </div>
          
        </div>
      </section>
  </div>
  );
}
