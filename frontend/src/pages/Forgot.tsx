import { useState } from "react";
import { Button } from "../components/ui/button";
import { FormField, Input } from "../components/ui/input";
import { Link } from "react-router";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | undefined>();

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 sm:px-6 lg:px-8 pb-24">

      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-elevated">
      
        <h1 className="font-display text-3xl font-bold text-brand-900">
          Forgot Password?
        </h1>

        {/* Input & FormField */}
        <section className="mt-8">
          <div className="mt-4 space-y-8">
            {/* Email */}
            <div>
              <FormField
                label="Email"
                htmlFor="email-box"
                required
                hint="We will send you a password reset link if there is an account associated with your email address."
                error={formError}
              >
                <Input
                  id="email-box"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  hint="We will send you a password reset link if there is an account associated with your email address."
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFormError(undefined);
                  }}
                  error={formError}
                />
              </FormField>
            </div>

            <div className="text-center">
              <Button
                fullWidth
                className="max-w-xs mb-4 active:bg-brand-800"
                size="lg"
                onClick={() =>
                  setFormError(email ? undefined : "Email is required.")
                }
              >
                Send Reset Link
              </Button>

              <p className="mt-4">
                <Link to="/login" className="text-brand-600 underline hover:text-brand-800">Back to login</Link>
              </p>
            </div>
          </div>
        </section>
      
      </div>
      
    </div>
  );
}
