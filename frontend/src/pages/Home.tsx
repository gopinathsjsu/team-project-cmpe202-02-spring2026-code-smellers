import { useState } from "react";
import { EventCard } from "../components/ui/event-card";

type Category = {
  name: string;
  icon: "music" | "sports" | "food" | "art" | "tech" | "wellness" | "business" | "community";
};

type HomeEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
  imageUrl: string;
};

const categories: Category[] = [
  { name: "Music", icon: "music" },
  { name: "Sports", icon: "sports" },
  { name: "Food", icon: "food" },
  { name: "Art", icon: "art" },
  { name: "Tech", icon: "tech" },
  { name: "Wellness", icon: "wellness" },
  { name: "Business", icon: "business" },
  { name: "Community", icon: "community" },
];

const nearbyEvents: HomeEvent[] = [
  { id: "1", title: "Downtown Jazz Night", date: "Fri, Apr 4 · 7:30 PM", location: "San Jose, CA", imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80" },
  { id: "2", title: "Weekend Farmers Market Festival", date: "Sat, Apr 5 · 9:00 AM", location: "Santa Clara, CA", imageUrl: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80" },
  { id: "3", title: "Indie Film Showcase", date: "Sat, Apr 5 · 6:00 PM", location: "Campbell, CA", imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80" },
  { id: "4", title: "Morning Yoga in the Park", date: "Sun, Apr 6 · 8:00 AM", location: "Sunnyvale, CA", imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80" },
  { id: "5", title: "Startup Networking Mixer", date: "Tue, Apr 8 · 6:30 PM", location: "Palo Alto, CA", imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80" },
  { id: "6", title: "Food Truck Fiesta", date: "Wed, Apr 9 · 5:00 PM", location: "San Jose, CA", imageUrl: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80" },
  { id: "7", title: "Live Stand-Up Comedy Night", date: "Thu, Apr 10 · 8:00 PM", location: "Mountain View, CA", imageUrl: "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=1200&q=80" },
  { id: "8", title: "Community Art Walk", date: "Fri, Apr 11 · 5:30 PM", location: "Cupertino, CA", imageUrl: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80" },
];

function CategoryIcon({ type }: { type: Category["icon"] }) {
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

export default function Home() {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const toggleSaved = (id: string) => {
    setSavedIds((previous) =>
      previous.includes(id) ? previous.filter((savedId) => savedId !== id) : [...previous, id],
    );
  };

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
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((category) => (
            <button
              key={category.name}
              type="button"
              className="group flex flex-col items-center gap-2 rounded-lg py-2 transition-transform duration-fast hover:-translate-y-0.5"
              aria-label={`View ${category.name} events`}
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full border border-brand-100 bg-gradient-to-br from-white to-brand-50/70 text-brand-700 shadow-soft transition-all duration-fast group-hover:-translate-y-0.5 group-hover:border-brand-300 group-hover:from-brand-50 group-hover:to-brand-100/70 group-hover:text-brand-800 group-hover:shadow-elevated">
                <CategoryIcon type={category.icon} />
              </span>
              <span className="text-sm font-semibold text-neutral-700">{category.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-neutral-900">Events near you</h2>
        <p className="mt-1 text-sm text-neutral-500">Popular picks around San Jose and nearby cities.</p>
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
              onSaveToggle={toggleSaved}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
