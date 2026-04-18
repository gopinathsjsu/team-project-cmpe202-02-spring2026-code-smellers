import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/AuthProvider";
import { EventCard } from "../components/ui/event-card";
import { apiUrl } from "../lib/api";
import { addSavedEvent, fetchMySavedEvents, removeSavedEvent } from "../lib/meSaved";

type CategoryIconKey =
  | "music"
  | "sports"
  | "food"
  | "art"
  | "tech"
  | "wellness"
  | "business"
  | "community"
  | "nightlife"
  | "hobbies"
  | "holidays";

/** Homepage category row order (API may return enum order). */
const CATEGORY_DISPLAY_ORDER = [
  "music",
  "sports",
  "art",
  "food",
  "business",
  "nightlife",
  "hobbies",
  "holidays",
] as const;

function sortCategoriesForDisplay(slugs: string[]): string[] {
  const rank = new Map<string, number>(CATEGORY_DISPLAY_ORDER.map((s, i) => [s, i]));
  const after = CATEGORY_DISPLAY_ORDER.length;
  return [...slugs].sort((a, b) => {
    const ra = rank.get(a) ?? after;
    const rb = rank.get(b) ?? after;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
}

function formatCategoryLabel(slug: string) {
  return slug.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/** Map DB `event_category` slugs to homepage icons (1:1 for known categories). */
const CATEGORY_ICON_MAP: Record<string, CategoryIconKey> = {
  music: "music",
  sports: "sports",
  art: "art",
  food: "food",
  business: "business",
  nightlife: "nightlife",
  hobbies: "hobbies",
  holidays: "holidays",
};

function categoryIconForSlug(slug: string): CategoryIconKey {
  return CATEGORY_ICON_MAP[slug] ?? "community";
}

type HomeFeedEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
  imageUrl?: string;
};

function isHomeFeedEvent(value: unknown): value is HomeFeedEvent {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.date === "string" &&
    typeof o.location === "string" &&
    (o.imageUrl === undefined || typeof o.imageUrl === "string")
  );
}

function CategoryIcon({ type }: { type: CategoryIconKey }) {
  const iconBaseClass = "h-7 w-7";
  const iconProps = {
    className: iconBaseClass,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "music") {
    return (
      <svg {...iconProps}>
        <path d="M9 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
        <path d="M19 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
        <path d="M9 18V6l10-2v12" />
      </svg>
    );
  }

  if (type === "sports") {
    return (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="8" />
        <path d="M6.6 6.6 17.4 17.4M17.4 6.6 6.6 17.4M12 4v16M4 12h16" />
      </svg>
    );
  }

  if (type === "food") {
    return (
      <svg {...iconProps}>
        <path d="M6 3v8M9 3v8M6 7h3M7.5 11v10" />
        <path d="M16 3c2 2.2 2 5.8 0 8v10" />
      </svg>
    );
  }

  if (type === "art") {
    return (
      <svg {...iconProps}>
        <path d="M12 3.5a8.5 8.5 0 1 0 0 17h1.4c1.2 0 2.1-1 2.1-2.1 0-1.6-1.4-2.1-1.4-3.1 0-1.3 1.2-1.6 2.3-1.6h.2A3.6 3.6 0 0 0 20 10a6.5 6.5 0 0 0-6.5-6.5H12Z" />
        <circle cx="8.3" cy="9.4" r=".9" fill="currentColor" stroke="none" />
        <circle cx="11.4" cy="7.8" r=".9" fill="currentColor" stroke="none" />
        <circle cx="14.3" cy="8.5" r=".9" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (type === "tech") {
    return (
      <svg {...iconProps}>
        <rect x="3" y="4" width="18" height="12" rx="2.5" />
        <path d="M8 20h8M12 16v4" />
      </svg>
    );
  }

  if (type === "business") {
    return (
      <svg {...iconProps}>
        <rect x="3" y="6" width="18" height="13" rx="2.5" />
        <path d="M9 6V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1M3 11h18" />
      </svg>
    );
  }

  if (type === "nightlife") {
    return (
      <svg {...iconProps}>
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        <path d="M17.5 4.5 18 6l1.5.5L18 7l-.5 1.5L17 7l-1.5-.5L17 6l.5-1.5Z" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (type === "hobbies") {
    return (
      <svg {...iconProps}>
        <rect x="5" y="5" width="14" height="14" rx="2" />
        <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (type === "holidays") {
    return (
      <svg {...iconProps}>
        <path d="M12 3v4M12 21V10" />
        <path d="M8.5 7h7a2.5 2.5 0 0 0 0-5c-1.6 0-2.5 2-3.5 3.5C11 4 10 2 8.5 2a2.5 2.5 0 0 0 0 5Z" />
        <rect x="3" y="10" width="18" height="11" rx="1.5" />
        <path d="M3 14h18" />
      </svg>
    );
  }

  if (type === "community") {
    return (
      <svg {...iconProps}>
        <circle cx="8" cy="8" r="2.2" />
        <circle cx="16" cy="9" r="1.8" />
        <path d="M3.5 19c.6-2.5 2.4-4 4.8-4s4.2 1.5 4.8 4M13.2 19c.4-1.8 1.6-3 3.3-3 1.8 0 3 1.2 3.5 3" />
      </svg>
    );
  }

  return (
    <svg {...iconProps}>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

type HomeProps = {
  /** Same value as the navbar location field; drives `loc` on `/api/events`. */
  browseLocation: string;
};

export default function Home({ browseLocation }: HomeProps) {
  const { status } = useAuth();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [categorySlugs, setCategorySlugs] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [nearbyEvents, setNearbyEvents] = useState<HomeFeedEvent[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [nearbyError, setNearbyError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const res = await fetch(apiUrl("/api/events/categories"));
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }
        const data = (await res.json()) as { categories?: unknown };
        const list = Array.isArray(data.categories) ? data.categories.filter((c): c is string => typeof c === "string") : [];
        if (!cancelled) {
          setCategorySlugs(list);
          setCategoriesError(null);
        }
      } catch {
        if (!cancelled) {
          setCategorySlugs([]);
          setCategoriesError("Could not load categories.");
        }
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    }
    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setNearbyLoading(true);
    async function loadNearbyEvents() {
      try {
        const params = new URLSearchParams({ limit: "8" });
        const loc = browseLocation.trim();
        if (loc) {
          params.set("loc", loc);
        }
        const res = await fetch(apiUrl(`/api/events?${params.toString()}`));
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }
        const data: unknown = await res.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid response shape");
        }
        const events = data.filter(isHomeFeedEvent);
        if (!cancelled) {
          setNearbyEvents(events);
          setNearbyError(null);
        }
      } catch {
        if (!cancelled) {
          setNearbyEvents([]);
          setNearbyError("Could not load events.");
        }
      } finally {
        if (!cancelled) {
          setNearbyLoading(false);
        }
      }
    }
    void loadNearbyEvents();
    return () => {
      cancelled = true;
    };
  }, [browseLocation]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }
    if (status !== "authenticated") {
      setSavedIds([]);
      return;
    }

    let cancelled = false;
    void fetchMySavedEvents()
      .then((list) => {
        if (!cancelled) {
          setSavedIds(list.map((e) => e.eventId));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSavedIds([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  const toggleSaved = (id: string) => {
    if (status !== "authenticated") {
      setSavedIds((previous) =>
        previous.includes(id) ? previous.filter((savedId) => savedId !== id) : [...previous, id],
      );
      return;
    }

    const isSaved = savedIds.includes(id);
    void (async () => {
      try {
        if (isSaved) {
          await removeSavedEvent(id);
          setSavedIds((previous) => previous.filter((savedId) => savedId !== id));
        } else {
          await addSavedEvent(id);
          setSavedIds((previous) => (previous.includes(id) ? previous : [...previous, id]));
        }
      } catch {
        /* leave list unchanged */
      }
    })();
  };

  const orderedCategorySlugs = sortCategoriesForDisplay(categorySlugs);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-xl shadow-elevated">
        <img
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=2000&q=80"
          alt="Crowd enjoying a live event"
          className="h-[300px] w-full object-cover md:h-[380px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/35" />
        <div className="absolute inset-0 flex items-center px-6 md:px-10">
          <div>
            <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.55)] md:text-5xl">
              Find your next favorite experience in minutes.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-neutral-100 [text-shadow:0_1px_8px_rgba(0,0,0,0.55)] md:text-lg">
              Explore concerts, food festivals, workshops, and community gatherings curated for your city.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold text-neutral-900">Browse by category</h2>
        {categoriesLoading ? (
          <p className="mt-5 text-sm text-neutral-500">Loading categories…</p>
        ) : categoriesError ? (
          <p className="mt-5 text-sm text-red-600" role="alert">
            {categoriesError}
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {orderedCategorySlugs.map((slug) => {
              const label = formatCategoryLabel(slug);
              const search = new URLSearchParams();
              search.set("category", slug);
              const loc = browseLocation.trim();
              if (loc) {
                search.set("loc", loc);
              }
              return (
                <Link
                  key={slug}
                  to={{ pathname: "/search", search: `?${search.toString()}` }}
                  className="group flex flex-col items-center gap-2 rounded-lg py-2"
                  aria-label={`View ${label} events`}
                >
                  <span className="flex h-20 w-20 items-center justify-center rounded-full border border-brand-100 bg-gradient-to-br from-white to-brand-50/70 text-brand-700 transition-all duration-fast group-hover:border-brand-300 group-hover:from-brand-50 group-hover:to-brand-100/70 group-hover:text-brand-800">
                    <CategoryIcon type={categoryIconForSlug(slug)} />
                  </span>
                  <span className="text-sm font-semibold text-neutral-700">{label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-neutral-900">Events near you</h2>
        {nearbyLoading ? (
          <p className="mt-5 text-sm text-neutral-500">Loading events…</p>
        ) : nearbyError ? (
          <p className="mt-5 text-sm text-red-600" role="alert">
            {nearbyError}
          </p>
        ) : nearbyEvents.length === 0 ? (
          <p className="mt-5 text-sm text-neutral-500">No upcoming events yet.</p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {nearbyEvents.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                imageUrl={event.imageUrl}
                date={event.date}
                location={event.location}
                isSaved={savedIds.includes(event.id)}
                onSaveToggle={(id) => void toggleSaved(id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
