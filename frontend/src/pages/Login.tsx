import { useState } from "react";
import { Button } from "../components/ui/button";
import { FormField, Input } from "../components/ui/input";
import { Link } from "react-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | undefined>();

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
                onClick={() =>
                  setFormError(email ? undefined : "Email is required.")
                }
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
