# Design System

This project uses a lightweight design system built on Tailwind v4 theme variables, CSS custom properties, and a typed TypeScript theme object.

## Where tokens live

- `src/styles/tokens.css`
  Defines the source design tokens as CSS custom properties on `:root`.
- `src/styles/globals.css`
  Imports the tokens, imports Tailwind v4, and maps the token values into Tailwind's `@theme` namespaces.
- `src/design-system/theme.ts`
  Exports a typed `theme` object for places that need programmatic access to token values.

## Token groups

- Colors: `brand`, `accent`, `neutral`, `success`, `warning`, `error`, `surface`
- Typography: font families, font sizes, font weights, line heights
- Layout: spacing, border radius
- Elevation and motion: shadows, transition durations

## When to use what

- Tailwind classes
  Use for regular app UI, layout, spacing, typography, and color styling inside React components.
- CSS variables
  Use in plain CSS files, inline styles that need CSS custom properties, or advanced styles like gradients and overlays.
- `theme.ts`
  Use in TypeScript when you need token values in JavaScript logic, like charts, canvas drawing, or computed styles.

## Examples

### Tailwind utility classes

```tsx
export function Hero() {
  return (
    <section className="bg-brand-800 text-white shadow-elevated">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-accent-300 font-semibold">Featured</p>
        <h1 className="font-display text-5xl">Discover unforgettable events</h1>
        <p className="mt-4 max-w-2xl text-neutral-100">
          Find shows, meetups, and experiences with a premium booking flow.
        </p>
      </div>
    </section>
  );
}
```

### CSS variables

```css
.event-card-highlight {
  background: linear-gradient(
    135deg,
    var(--ds-color-brand-800),
    var(--ds-color-brand-600)
  );
  box-shadow: var(--ds-shadow-card);
  border-radius: var(--ds-radius-xl);
}
```

### TypeScript theme object

```ts
import { theme } from "../design-system/theme";

const chartSeriesColor = theme.colors.brand[600];
const badgeBg = theme.colors.accent[400];
const panelShadow = theme.shadows.card;
```

## UI components

Reusable components in `src/components/ui/` use the design tokens and follow the same patterns.

### Button

```tsx
import { Button } from "@/components/ui/button";

// Primary (default)
<Button>Click me</Button>

// Variants and sizes
<Button variant="outline" size="lg">Browse Events</Button>
<Button variant="ghost" size="sm">Cancel</Button>
<Button variant="danger">Delete</Button>

// Loading state
<Button variant="primary" isLoading>Signing in...</Button>

// With icon and full width
<Button leftIcon={<SearchIcon />}>Search</Button>
<Button fullWidth>Sign up</Button>
```

### Input and FormField

```tsx
import { Input, FormField } from "@/components/ui/input";

// Basic input
<Input placeholder="Enter your email" type="email" />

// With label, hint, and error (pass error to both for styling + message)
<FormField label="Email" htmlFor="email" required hint="We'll never share your email." error={errors.email}>
  <Input id="email" type="email" error={errors.email} placeholder="you@example.com" />
</FormField>

// Password with show/hide toggle (built-in)
<FormField label="Password" htmlFor="password" required>
  <Input id="password" type="password" placeholder="••••••••" />
</FormField>

// With left icon
<FormField label="Search" htmlFor="search">
  <Input id="search" type="search" leftIcon={<SearchIcon />} placeholder="Search events…" />
</FormField>
```

### Navbar

Layout component in `src/components/navbar/`. Sticky top bar with logo, search (query + location), and auth links. Uses React Router `Link` / `NavLink` for internal navigation.

```tsx
import { Navbar } from "@/components/navbar";

// Logged out (default)
<Navbar isLoggedIn={false} onSearch={(query) => handleSearch(query)} />

// Logged in with user
<Navbar isLoggedIn={true} user={{ name: "Jane Doe", avatarUrl: "/avatars/jane.jpg" }} onSearch={(q) => setSearchQuery(q)} />
```

- **isLoggedIn** (required): `true` shows avatar with initials; `false` shows “Log in” and “Sign up” links.
- **onSearch** (optional): called when the search query input changes.
- **user** (optional): `{ name: string; avatarUrl?: string }` for logged-in avatar and tooltip.

### Footer

Layout component in `src/components/footer/`. Full-width dark footer with logo, link columns, and social icons. Uses React Router `Link` for internal links and plain `<a>` for external.

```tsx
import { Footer } from "@/components/footer";

// Default columns (Company, Help, Explore)
<Footer />

// Custom link columns
<Footer
  columns={[
    { heading: "Product", links: [{ label: "Features", href: "/features" }, { label: "Pricing", href: "/pricing" }] },
    { heading: "Legal", links: [{ label: "Terms", href: "/terms" }, { label: "Privacy", href: "/privacy", external: true }] },
  ]}
/>
```

- **columns** (optional): array of `{ heading: string; links: FooterLink[] }`. Each link is `{ label, href, external? }`. Omit to use the default Evently columns.

## Guidance

- Prefer Tailwind classes first for consistency and speed.
- Avoid hardcoding hex colors or spacing values inside components.
- Use the brand palette for key chrome and navigation.
- Use the accent palette for calls to action, highlights, and badges.
- Use neutral and surface tokens for structure, readability, and contrast.
