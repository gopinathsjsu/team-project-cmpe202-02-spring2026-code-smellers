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

## Guidance

- Prefer Tailwind classes first for consistency and speed.
- Avoid hardcoding hex colors or spacing values inside components.
- Use the brand palette for key chrome and navigation.
- Use the accent palette for calls to action, highlights, and badges.
- Use neutral and surface tokens for structure, readability, and contrast.
