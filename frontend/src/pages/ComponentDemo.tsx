import { useState } from "react";
import { Footer } from "../components/footer";
import { Navbar } from "../components/navbar";
import { Button } from "../components/ui/button";
import { EventCard } from "../components/ui/event-card";
import { FormField, Input } from "../components/ui/input";

export default function ComponentDemo() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [formError, setFormError] = useState<string | undefined>();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(["2"]));
  const [navbarDemoLocation, setNavbarDemoLocation] = useState("San Jose");
  const [navbarDemoLocationB, setNavbarDemoLocationB] = useState("San Jose");

  const handleSaveToggle = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-brand-900">
        Component reference
      </h1>
      <p className="mt-2 text-neutral-600">
        Live examples of all design-system and UI components for reference.
      </p>

      {/* Button */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-brand-800">Button</h2>
        <p className="mt-1 text-sm text-neutral-600">
          <code className="rounded bg-neutral-200 px-1">src/components/ui/button</code>
        </p>
        <div className="mt-4 space-y-6">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Variants
            </p>
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Sizes
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
              States
            </p>
            <div className="flex flex-wrap gap-3">
              <Button isLoading>Loading…</Button>
              <Button disabled>Disabled</Button>
              <Button fullWidth className="max-w-xs">
                Full width
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Input & FormField */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-brand-800">
          Input & FormField
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          <code className="rounded bg-neutral-200 px-1">src/components/ui/input</code>
        </p>
        <div className="mt-4 space-y-6">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Basic input (no label)
            </p>
            <Input
              placeholder="Search events, artists, venues…"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
              With FormField (label, hint, error)
            </p>
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
                hint="We'll never share your email."
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFormError(undefined);
                }}
                error={formError}
              />
            </FormField>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  setFormError(email ? undefined : "Email is required.")
                }
              >
                Validate
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setFormError(undefined)}>
                Clear error
              </Button>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Password (show/hide toggle built-in)
            </p>
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
        </div>
      </section>

      {/* EventCard */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-brand-800">EventCard</h2>
        <p className="mt-1 text-sm text-neutral-600">
          <code className="rounded bg-neutral-200 px-1">src/components/ui/event-card</code> —
          vertical card with image (optional <code className="rounded bg-neutral-200 px-1">imageUrl</code>
          — component picks a stable placeholder when omitted), title, date, location, favorite
          button, and Free badge.
        </p>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <EventCard
            id="1"
            title="Jazz Night at the Civic Center"
            imageUrl="https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=225&fit=crop"
            date="Sat, Mar 15 · 7:00 PM"
            location="San Jose, CA"
            isSaved={savedIds.has("1")}
            onSaveToggle={handleSaveToggle}
          />
          <EventCard
            id="2"
            title="Tech Meetup: APIs & Microservices"
            imageUrl="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&h=225&q=70"
            date="Sun, Mar 16 · 2:00 PM"
            location="San Francisco, CA"
            isSaved={savedIds.has("2")}
            onSaveToggle={handleSaveToggle}
          />
          <EventCard
            id="3"
            title="Summer Concert Series — Outdoor Pavilion"
            imageUrl="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=225&fit=crop"
            date="Fri, Mar 21 · 6:30 PM"
            location="Oakland, CA"
            isSaved={savedIds.has("3")}
            onSaveToggle={handleSaveToggle}
          />
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Cards link to <code>/events/:id</code>. Heart toggles favorite state (no
          propagation to card click).
        </p>
      </section>

      {/* Navbar */}
      <section className="relative left-1/2 mt-12 w-screen -translate-x-1/2 px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-semibold text-brand-800">Navbar</h2>
        <p className="mt-1 text-sm text-neutral-600">
          <code className="rounded bg-neutral-200 px-1">src/components/navbar</code> — sticky
          top bar with logo, search (query + location), and auth. Uses React Router
          Link/NavLink.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border-2 border-neutral-200">
          <Navbar
            browseLocation={navbarDemoLocation}
            onBrowseLocationChange={setNavbarDemoLocation}
            onSearch={({ query, location }) =>
              console.log("Search:", query, location)
            }
          />
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border-2 border-neutral-200">
          <p className="border-b border-neutral-200 bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-600">
            Logged-in state (Create Event + avatar)
          </p>
          <Navbar
            browseLocation={navbarDemoLocationB}
            onBrowseLocationChange={setNavbarDemoLocationB}
            onSearch={({ query, location }) =>
              console.log("Search:", query, location)
            }
          />
        </div>
      </section>

      {/* Footer */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-brand-800">Footer</h2>
        <p className="mt-1 text-sm text-neutral-600">
          <code className="rounded bg-neutral-200 px-1">src/components/footer</code> —
          full-width dark footer with logo, link columns, and social icons.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border-2 border-neutral-200">
          <Footer />
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Default columns (Company, Help, Explore). Pass <code>columns</code> prop to
          override.
        </p>
      </section>

      {/* ProtectedRoute */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-brand-800">
          ProtectedRoute
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          <code className="rounded bg-neutral-200 px-1">src/components/ProtectedRoute.tsx</code> —
          layout wrapper for auth-only routes. Renders <code>Outlet</code> when
          authenticated, else redirects to login. No visual preview; use as a route
          element.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-neutral-100 p-4 text-xs text-neutral-800">
          {`<Route element={<ProtectedRoute />}>
  <Route path="dashboard-user" element={<DashboardUser />} />
</Route>`}
        </pre>
      </section>
    </div>
  );
}
