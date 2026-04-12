import { useState } from "react";
import { Button } from "../components/ui/button";
import { FormField, Input } from "../components/ui/input";
import { Link, useNavigate, useLocation } from "react-router";

import { apiUrl } from "../lib/api.ts"

// ideally should move this to a constants definition (used in protectedroute)
const AUTH_TOKEN_KEY = "authToken";

async function doLogin(email: string, password: string): Promise<[boolean, string]> {
  let succ = true;
  let err = "";

  try {
    const response = await fetch(apiUrl("/api/auth/login"), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (!response.ok) { throw new Error(`${data.error} (${response.status})`) };

    // Store in localStorage atm, not ideal for XSS vulnerability
    window.localStorage.setItem(AUTH_TOKEN_KEY, data.access_token); 
    
  } catch (error: unknown) {
    succ = false;
    
    if (error instanceof Error) {
      err = error.message;
    } else {
      err = `Unexpected error: ${String(err)}`;
    }
  
  } finally {
    return [succ, err];
  }
  
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
            e.preventDefault(); // Stops page reload

            if(isSubmitting) { return; }
                        
            setFormError(undefined);
            setEmailError(undefined);
            setPasswordError(undefined);

            if (!email || !password) { 
              if(!email) { setEmailError("Email is required."); }
              if (!password) { setPasswordError("Password is required."); }
              return;
            }
            
            setIsSubmitting(true);
            const [succ, err] = await doLogin(email, password);
            setIsSubmitting(false);

            if (succ) {
              navigate(location.state?.from || "/"); 
            } else {
              setFormError(err);
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
                required
                hint="We'll never share your email."
                error={emailError}
              >
                <Input
                  id="email-box"
                  type="email"
                  placeholder="you@example.com"
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
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  error={passwordError}
                  onChange={(e) => {
                    setPassword(e.target.value)
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
                className="max-w-xs mt-4 mb-6 active:bg-brand-800"
                size="lg"
                isLoading={isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Login"}
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
        </form>
        
      </div>
      
    </div>
  );
}
