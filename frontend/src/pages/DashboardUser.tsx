import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/AuthProvider";
import { EventCard } from "../components/ui/event-card";
import { fetchMySavedEvents, type MySavedEventApi } from "../lib/meSaved";
import { fetchMyTickets, type MyTicketApi, type TicketRsvpStatus } from "../lib/meTickets";

type DashboardEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
  imageUrl?: string;
};

type TicketCard = DashboardEvent & { ticketId: number; rsvpStatus: TicketRsvpStatus };

type TabId = "overview" | "upcoming" | "past" | "saved" | "settings";

function pastRsvpLabel(status: TicketRsvpStatus): string {
  if (status === "attended") {
    return "Attended";
  }
  if (status === "canceled") {
    return "Canceled";
  }
  if (status === "pending") {
    return "Pending";
  }
  return "Registered";
}

function mapTicketApiToCard(row: MyTicketApi): TicketCard {
  return {
    ticketId: row.ticketId,
    id: row.eventId,
    title: row.title,
    date: row.date,
    location: row.location,
    imageUrl: row.imageUrl,
    rsvpStatus: row.rsvpStatus,
  };
}

function mapSavedApiToDashboard(row: MySavedEventApi): DashboardEvent {
  return {
    id: row.eventId,
    title: row.title,
    date: row.date,
    location: row.location,
    imageUrl: row.imageUrl,
  };
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
  const { user } = useAuth();

  const [upcoming, setUpcoming] = useState<TicketCard[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);

  const [past, setPast] = useState<TicketCard[]>([]);
  const [pastLoading, setPastLoading] = useState(true);
  const [pastError, setPastError] = useState<string | null>(null);

  const [saved, setSaved] = useState<DashboardEvent[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setUpcoming([]);
      setPast([]);
      setSaved([]);
      setUpcomingLoading(false);
      setPastLoading(false);
      setSavedLoading(false);
      setUpcomingError(null);
      setPastError(null);
      setSavedError(null);
      return;
    }

    let cancelled = false;
    setUpcomingLoading(true);
    setPastLoading(true);
    setSavedLoading(true);
    setUpcomingError(null);
    setPastError(null);
    setSavedError(null);

    void Promise.allSettled([
      fetchMyTickets("upcoming"),
      fetchMyTickets("past"),
      fetchMySavedEvents(),
    ]).then((results) => {
      if (cancelled) {
        return;
      }
      const [upRes, pastRes, savedRes] = results;
      if (upRes.status === "fulfilled") {
        setUpcoming(upRes.value.map(mapTicketApiToCard));
        setUpcomingError(null);
      } else {
        setUpcoming([]);
        setUpcomingError(
          upRes.reason instanceof Error ? upRes.reason.message : "Could not load upcoming tickets.",
        );
      }
      if (pastRes.status === "fulfilled") {
        setPast(pastRes.value.map(mapTicketApiToCard));
        setPastError(null);
      } else {
        setPast([]);
        setPastError(
          pastRes.reason instanceof Error ? pastRes.reason.message : "Could not load past tickets.",
        );
      }
      if (savedRes.status === "fulfilled") {
        setSaved(savedRes.value.map(mapSavedApiToDashboard));
        setSavedError(null);
      } else {
        setSaved([]);
        setSavedError(
          savedRes.reason instanceof Error ? savedRes.reason.message : "Could not load saved events.",
        );
      }
      setUpcomingLoading(false);
      setPastLoading(false);
      setSavedLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const heroName = useMemo(() => {
    if (!user) {
      return "Guest";
    }
    const dn = user.display_name?.trim();
    if (dn) {
      return dn;
    }
    const email = user.email?.trim();
    if (email?.includes("@")) {
      const local = email.split("@")[0];
      return local ? local.replace(/\./g, " ") : "Guest";
    }
    return "Guest";
  }, [user]);

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
              {user ? initials : <UserIcon className="h-8 w-8 text-neutral-500" />}
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
                  {upcomingLoading ? (
                    <p className="text-sm text-neutral-600">Loading…</p>
                  ) : upcomingError ? (
                    <p className="text-sm text-red-700" role="alert">
                      {upcomingError}
                    </p>
                  ) : upcoming.length === 0 ? (
                    <p className="text-sm text-neutral-600">No upcoming tickets.</p>
                  ) : (
                    <>
                      <ul className="grid gap-5">
                        {upcoming.slice(0, 2).map((e) => (
                          <li key={e.ticketId}>
                            <EventCard
                              id={e.id}
                              title={e.title}
                              date={e.date}
                              location={e.location}
                              imageUrl={e.imageUrl}
                            />
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
                    </>
                  )}
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
                  {savedLoading ? (
                    <p className="text-sm text-neutral-600">Loading…</p>
                  ) : savedError ? (
                    <p className="text-sm text-red-700" role="alert">
                      {savedError}
                    </p>
                  ) : saved.length === 0 ? (
                    <p className="text-sm text-neutral-600">No saved events yet.</p>
                  ) : (
                    <>
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
                    </>
                  )}
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
              {pastLoading ? (
                <div className="px-5 py-4">
                  <p className="text-sm text-neutral-600">Loading…</p>
                </div>
              ) : pastError ? (
                <div className="px-5 py-4">
                  <p className="text-sm text-red-700" role="alert">
                    {pastError}
                  </p>
                </div>
              ) : past.length === 0 ? (
                <div className="px-5 py-4">
                  <p className="text-sm text-neutral-600">No past events.</p>
                </div>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {past.slice(0, 2).map((row) => (
                    <li key={row.ticketId} className="px-5 py-4">
                      <Link
                        to={`/events/${row.id}`}
                        className="text-sm font-semibold text-neutral-900 hover:text-brand-700"
                      >
                        {row.title}
                      </Link>
                      <p className="text-xs text-neutral-500">
                        {row.date} · {row.location}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="px-5 py-4">
                {!pastLoading && !pastError && past.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setTab("past")}
                    className="text-sm font-semibold text-brand-700 hover:text-brand-800"
                  >
                    View all past →
                  </button>
                ) : null}
              </div>
            </div>

            <SettingsPreviewCard />
          </aside>
        </div>
      ) : null}

      {tab === "upcoming" ? (
        <div className="mt-4">
          {upcomingLoading ? (
            <p className="text-sm text-neutral-600">Loading…</p>
          ) : upcomingError ? (
            <p className="text-sm text-red-700" role="alert">
              {upcomingError}
            </p>
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-neutral-600">No upcoming tickets.</p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e) => (
                <li key={e.ticketId}>
                  <EventCard id={e.id} title={e.title} date={e.date} location={e.location} imageUrl={e.imageUrl} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "saved" ? (
        <div className="mt-4">
          {savedLoading ? (
            <p className="text-sm text-neutral-600">Loading…</p>
          ) : savedError ? (
            <p className="text-sm text-red-700" role="alert">
              {savedError}
            </p>
          ) : saved.length === 0 ? (
            <p className="text-sm text-neutral-600">No saved events yet.</p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {saved.map((e) => (
                <li key={e.id}>
                  <EventCard id={e.id} title={e.title} date={e.date} location={e.location} imageUrl={e.imageUrl} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "past" ? (
        <div className="mt-4">
          {pastLoading ? (
            <p className="text-sm text-neutral-600">Loading…</p>
          ) : pastError ? (
            <p className="text-sm text-red-700" role="alert">
              {pastError}
            </p>
          ) : past.length === 0 ? (
            <p className="text-sm text-neutral-600">No past events.</p>
          ) : (
            <ul
              className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200/80 bg-surface-raised"
              style={{ boxShadow: "var(--ds-shadow-card)" }}
            >
              {past.map((row) => (
                <li
                  key={row.ticketId}
                  className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-neutral-50/80 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/events/${row.id}`}
                      className="font-semibold text-neutral-900 hover:text-brand-700"
                    >
                      {row.title}
                    </Link>
                    <p className="text-sm text-neutral-500">
                      {row.date} · {row.location}
                    </p>
                  </div>
                  <span className="inline-flex w-fit shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                    {pastRsvpLabel(row.rsvpStatus)}
                  </span>
                </li>
              ))}
            </ul>
          )}
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
