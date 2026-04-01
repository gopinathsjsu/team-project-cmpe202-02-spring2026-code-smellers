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
  if (type === "music") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 15.2a1.8 1.8 0 1 1-3.6 0A1.8 1.8 0 0 1 7 15.2ZM16.6 13.2a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0Z" />
        <path d="M7 15.2V6.2l9-2v9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "sports") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="10" cy="10" r="6.5" />
        <path d="M10 3.5v13M3.5 10h13" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "food") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5.5 3.5v6M8.5 3.5v6M5.5 6.5h3M7 9.5V17" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.5 3.5c1.7 2 1.7 4.7 0 6.7V17" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "art") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 3.5a6.5 6.5 0 1 0 0 13h1.2c1 0 1.8-.8 1.8-1.8 0-1.4-1.2-1.8-1.2-2.7 0-1.1 1.1-1.4 2-1.4h.2a2.8 2.8 0 0 0 2.8-2.8A4.3 4.3 0 0 0 12.5 3.5H10Z" />
        <circle cx="6.8" cy="8.1" r=".7" fill="currentColor" />
        <circle cx="9.2" cy="6.9" r=".7" fill="currentColor" />
        <circle cx="11.7" cy="7.1" r=".7" fill="currentColor" />
      </svg>
    );
  }

  if (type === "tech") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.5" y="4" width="13" height="9.5" rx="1.5" />
        <path d="M8 16h4M10 13.5V16" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "business") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.5" y="5" width="13" height="10.5" rx="1.5" />
        <path d="M7 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M3.5 9h13" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "community") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="7" cy="7" r="2" />
        <circle cx="13" cy="7.5" r="1.8" />
        <path d="M3.8 15.5c.5-2 1.9-3.2 3.9-3.2s3.4 1.2 3.9 3.2M11.2 15.5c.3-1.5 1.3-2.5 2.8-2.5 1.6 0 2.6 1 3 2.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className="h-6 w-6" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 17s5-4.4 5-8.5C15 5.5 12.8 3 10 3S5 5.5 5 8.5C5 12.6 10 17 10 17Z" />
      <circle cx="10" cy="8.2" r="2" />
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
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-300 bg-surface-raised text-brand-700 shadow-soft transition-colors duration-fast group-hover:border-brand-400 group-hover:bg-brand-50">
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
