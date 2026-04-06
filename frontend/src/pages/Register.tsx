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

  return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 sm:px-6 lg:px-8 pb-24">

      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-elevated">

        <h1 className="font-display text-3xl font-bold text-brand-900">
          Welcome Aboard!
        </h1>

        {/* Input & FormField */}
        <section className="mt-8">
          <div className="mt-4 space-y-4">
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
              >
                <Input
                  id="demo-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormField>
              <br></br>
              <FormField
                label="Confirm Password"
                htmlFor="demo-password"
                required
              >
                <Input
                  id="demo-password"
                  type="password"
                  placeholder="••••••••"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                />
              </FormField>
            </div>

            <div className="text-center">
              <Button
                fullWidth
                className="max-w-xs mt-4 mb-6"
                size="lg"
                onClick={() => {
                  setNameError(name ? undefined : "Name is required.");
                  setEmailError(email ? undefined : "Email is required.");
                }}
              >
                Sign Up
              </Button>

              <p>
                Already have an account?{" "}
                <Link to="/login" className="text-brand-600 underline hover:text-brand-800">Log in</Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
