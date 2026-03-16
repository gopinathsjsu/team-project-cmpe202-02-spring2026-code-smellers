import { useState } from "react";
import { Button } from "../components/ui/button";
import { FormField, Input } from "../components/ui/input";

export default function Register() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();

  return (

    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-brand-900">
        Welcome Aboard!
      </h1>

      {/* Input & FormField */}
      <section className="mt-12">
        <div className="mt-4 space-y-6">

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
                onChange={(e) => setName(e.target.value)}
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
            <FormField label="Confirm Password" htmlFor="demo-password" required>
              <Input
                id="demo-password"
                type="password"
                placeholder="••••••••"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
              />
            </FormField>
          </div>

          <Button
            fullWidth
            className="max-w-xs"
            size="lg"
            onClick= {() => {
              setNameError(name ? undefined : "Name is required.");
              setEmailError(email ? undefined : "Email is required.");
            }}
          >
            Sign Up
          </Button>
          
          <div>
            <p> Already have an account? <a href="/login">Login</a></p>
          </div>
          
        </div>
      </section>
  </div>
  );
}
