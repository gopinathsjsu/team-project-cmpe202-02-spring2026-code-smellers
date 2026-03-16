import { useState } from "react";
import { Button } from "../components/ui/button";
import { FormField, Input } from "../components/ui/input";

export default function Forgot() {

  const [email, setEmail] = useState("");
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
              hint="We will send you a password reset link if there is an account associated with your email address."
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

          <Button
            fullWidth
            className="max-w-xs"
            size="lg"
            onClick={() =>
              setFormError(email ? undefined : "Email is required.")
            }
          >
            Send Reset Link
          </Button>

          <div>
            <p><a href="/login">Back to login</a></p>
          </div>
          
        </div>
      </section>
  </div>
  );
}
