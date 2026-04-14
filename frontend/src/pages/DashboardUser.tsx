import { useMemo, useState } from "react";
import { EventCard } from "../components/ui/event-card";

type DashboardEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
  imageUrl?: string;
};

type TabId = "overview" | "upcoming" | "past" | "saved" | "settings";

const MOCK_UPCOMING: DashboardEvent[] = [
  {
    id: "dash-up-1",
    title: "Indie Night at The Guild",
    date: "Fri, May 9 · 8:00 PM",
    location: "San Jose, CA",
    imageUrl:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=70",
  },
  {
    id: "dash-up-2",
    title: "Farmers Market Food Walk",
    date: "Sat, May 10 · 10:00 AM",
    location: "Campbell, CA",
    imageUrl:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=70",
  },
] as const;

const MOCK_SAVED: DashboardEvent[] = [
  {
    id: "dash-sv-1",
    title: "Jazz & Wine on the Patio",
    date: "Thu, Jun 5 · 6:30 PM",
    location: "Los Gatos, CA",
    imageUrl:
      "https://images.unsplash.com/photo-1415201364774-f6f488a3608a?auto=format&fit=crop&w=900&q=70",
  },
  {
    id: "dash-sv-2",
    title: "Tech Meetup: AI in Production",
    date: "Wed, Jun 11 · 5:45 PM",
    location: "Mountain View, CA",
    imageUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=70",
  },
  {
    id: "dash-sv-3",
    title: "Sunrise Yoga in the Park",
    date: "Sun, Jun 15 · 6:00 AM",
    location: "Palo Alto, CA",
  },
] as const;

const MOCK_PAST: { id: string; title: string; date: string; location: string }[] = [
  {
    id: "dash-past-1",
    title: "Winter Lights Festival",
    date: "Dec 14, 2025",
    location: "San Jose, CA",
  },
  {
    id: "dash-past-2",
    title: "Community Cleanup Day",
    date: "Mar 2, 2025",
    location: "San Jose, CA",
  },
] as const;

function readJwtDisplayName(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const token = window.localStorage.getItem("authToken");
    if (!token) {
      return null;
    }
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const payload = JSON.parse(json) as { email?: unknown; name?: unknown };
    if (typeof payload.name === "string" && payload.name.trim()) {
      return payload.name.trim();
    }
    if (typeof payload.email === "string" && payload.email.includes("@")) {
      const local = payload.email.split("@")[0];
      return local ? local.replace(/\./g, " ") : null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function SettingsPreviewCard() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-surface-raised"
      style={{ boxShadow: "var(--ds-shadow-card)" }}
    >
      <div className="border-b border-neutral-100 px-5 py-4">
        <h3 className="font-display text-lg font-bold text-neutral-900">Settings</h3>
      </div>
      <div className="space-y-3 px-5 py-4">
        <div className="rounded-xl bg-neutral-50 px-4 py-3 ring-1 ring-neutral-200/70">
          <p className="text-sm font-semibold text-neutral-900">Notifications</p>
          <p className="mt-0.5 text-xs text-neutral-500">Reminders, weekly digest, price drops</p>
        </div>
        <div className="rounded-xl bg-neutral-50 px-4 py-3 ring-1 ring-neutral-200/70">
          <p className="text-sm font-semibold text-neutral-900">Account</p>
          <p className="mt-0.5 text-xs text-neutral-500">Email, password, privacy</p>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onSelect,
  label,
  badge,
}: {
  active: boolean;
  onSelect: () => void;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-fast",
        active
          ? "bg-neutral-900 text-white shadow-md shadow-neutral-900/15"
          : "bg-surface-raised text-neutral-600 ring-1 ring-neutral-200/80 hover:bg-neutral-50 hover:text-neutral-900",
      ].join(" ")}
    >
      {label}
      {typeof badge === "number" ? (
        <span
          className={
            active
              ? "rounded-full bg-white/20 px-2 py-0.5 text-xs tabular-nums"
              : "rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-800 tabular-nums"
          }
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function SegmentedTab({
  tabId,
  active,
  onSelect,
  label,
  badge,
}: {
  tabId: TabId;
  active: boolean;
  onSelect: (id: TabId) => void;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      id={`seg-tab-${tabId}`}
      role="tab"
      aria-selected={active}
      aria-controls={`seg-panel-${tabId}`}
      onClick={() => onSelect(tabId)}
      className={[
        "relative flex min-w-[130px] flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold transition-colors",
        active ? "text-neutral-900" : "text-neutral-600 hover:text-neutral-900",
      ].join(" ")}
    >
      <span className="truncate">{label}</span>
      {typeof badge === "number" ? (
        <span
          className={[
            "rounded-full px-2 py-0.5 text-xs tabular-nums",
            active ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700",
          ].join(" ")}
        >
          {badge}
        </span>
      ) : null}
      {active ? (
        <span
          className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
          aria-hidden
        />
      ) : null}
    </button>
  );
}

export default function DashboardUser() {
  const [tab, setTab] = useState<TabId>("overview");

  const upcoming = MOCK_UPCOMING;
  const saved = MOCK_SAVED;
  const past = MOCK_PAST;

  const userDisplayName = useMemo(() => readJwtDisplayName(), []);
  const heroName = userDisplayName ?? "Guest";
  const initials = useMemo(() => {
    return heroName
      .split(/\s+/)
      .map((s) => s[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [heroName]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section
        className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-gradient-to-br from-neutral-50 to-surface-raised"
        style={{ boxShadow: "var(--ds-shadow-card)" }}
        aria-label="Account summary"
      >
        <div className="px-5 py-8 sm:px-8 sm:py-10">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-lg font-bold text-brand-700 ring-1 ring-neutral-200/80 sm:h-16 sm:w-16 sm:text-xl"
              aria-hidden="true"
            >
              {userDisplayName ? initials : <UserIcon className="h-8 w-8 text-neutral-500" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">DASHBOARD</p>
              <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                {heroName}
              </h1>
            </div>
          </div>

          <div
            className="mt-8 overflow-hidden rounded-2xl border border-neutral-200/80 bg-surface-raised"
            style={{ boxShadow: "var(--ds-shadow-card)" }}
          >
            <nav
              className="flex divide-x divide-neutral-200/80 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Dashboard sections"
            >
              <SegmentedTab
                tabId="overview"
                label="Overview"
                active={tab === "overview"}
                onSelect={setTab}
              />
              <SegmentedTab
                tabId="upcoming"
                label="Upcoming"
                active={tab === "upcoming"}
                onSelect={setTab}
                badge={upcoming.length}
              />
              <SegmentedTab
                tabId="past"
                label="Past"
                active={tab === "past"}
                onSelect={setTab}
                badge={past.length}
              />
              <SegmentedTab
                tabId="saved"
                label="Saved"
                active={tab === "saved"}
                onSelect={setTab}
                badge={saved.length}
              />
              <SegmentedTab
                tabId="settings"
                label="Settings"
                active={tab === "settings"}
                onSelect={setTab}
              />
            </nav>
          </div>
        </div>
      </section>

      {tab === "overview" ? (
        <div className="mt-4 grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div
                className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-surface-raised"
                style={{ boxShadow: "var(--ds-shadow-card)" }}
              >
                <div className="border-b border-neutral-100 px-5 py-4">
                  <h2 className="font-display text-lg font-bold text-neutral-900">Upcoming</h2>
                </div>
                <div className="p-5">
                  <ul className="grid gap-5">
                    {upcoming.slice(0, 2).map((e) => (
                      <li key={e.id}>
                        <EventCard id={e.id} title={e.title} date={e.date} location={e.location} imageUrl={e.imageUrl} />
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setTab("upcoming")}
                    className="mt-4 text-sm font-semibold text-brand-700 hover:text-brand-800"
                  >
                    View all upcoming →
                  </button>
                </div>
              </div>

              <div
                className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-surface-raised"
                style={{ boxShadow: "var(--ds-shadow-card)" }}
              >
                <div className="border-b border-neutral-100 px-5 py-4">
                  <h2 className="font-display text-lg font-bold text-neutral-900">Saved</h2>
                </div>
                <div className="p-5">
                  <ul className="grid gap-5">
                    {saved.slice(0, 2).map((e) => (
                      <li key={e.id}>
                        <EventCard id={e.id} title={e.title} date={e.date} location={e.location} imageUrl={e.imageUrl} />
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setTab("saved")}
                    className="mt-4 text-sm font-semibold text-brand-700 hover:text-brand-800"
                  >
                    View saved →
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6 lg:col-span-4">
            <div
              className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-surface-raised"
              style={{ boxShadow: "var(--ds-shadow-card)" }}
            >
              <div className="border-b border-neutral-100 px-5 py-4">
                <h2 className="font-display text-lg font-bold text-neutral-900">Past</h2>
              </div>
              <ul className="divide-y divide-neutral-100">
                {past.map((row) => (
                  <li key={row.id} className="px-5 py-4">
                    <p className="text-sm font-semibold text-neutral-900">{row.title}</p>
                    <p className="text-xs text-neutral-500">
                      {row.date} · {row.location}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="px-5 py-4">
                <button
                  type="button"
                  onClick={() => setTab("past")}
                  className="text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  View all past →
                </button>
              </div>
            </div>

            <SettingsPreviewCard />
          </aside>
        </div>
      ) : null}

      {tab === "upcoming" ? (
        <div className="mt-4">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e) => (
              <li key={e.id}>
                <EventCard id={e.id} title={e.title} date={e.date} location={e.location} imageUrl={e.imageUrl} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === "saved" ? (
        <div className="mt-4">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((e) => (
              <li key={e.id}>
                <EventCard id={e.id} title={e.title} date={e.date} location={e.location} imageUrl={e.imageUrl} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === "past" ? (
        <div className="mt-4">
          <ul
            className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200/80 bg-surface-raised"
            style={{ boxShadow: "var(--ds-shadow-card)" }}
          >
            {past.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-neutral-50/80 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-900">{row.title}</p>
                  <p className="text-sm text-neutral-500">
                    {row.date} · {row.location}
                  </p>
                </div>
                <span className="inline-flex w-fit shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                  Attended
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === "settings" ? (
        <div className="mt-4">
          <SettingsPreviewCard />
        </div>
      ) : null}
    </div>
  );
}
