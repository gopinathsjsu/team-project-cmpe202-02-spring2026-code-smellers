import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { apiUrl } from "../lib/api";
import { Button } from "../components/ui/button";

type OrganizerEvent = {
  id: string;
  name: string;
  dateLabel: string;
  venue: string;
  status: "approved" | "pending";
  ticketsSold: number;
};

type OrganizerDashboardResponse = {
  currentEvents: OrganizerEvent[];
  pastEvents: OrganizerEvent[];
};

function getAccessTokenFromStorage(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const directToken = window.localStorage.getItem("authToken");
  return directToken?.trim() ? directToken.trim() : null;
}

/*
Mock fallback dataset if you want local-only UI previews:

const currentEventsMock: OrganizerEvent[] = [
  {
    id: "evt-1",
    name: "Spring Tech Mixer",
    dateLabel: "Sat, Apr 25 · 6:00 PM",
    venue: "San Jose Foundry",
    status: "approved",
    ticketsSold: 182,
  },
  {
    id: "evt-2",
    name: "Women in Product Meetup",
    dateLabel: "Wed, May 6 · 7:00 PM",
    venue: "Downtown CoLab",
    status: "pending",
    ticketsSold: 0,
  },
];

const pastEventsMock: OrganizerEvent[] = [
  {
    id: "evt-3",
    name: "Startup Pitch Night",
    dateLabel: "Thu, Mar 13 · 6:30 PM",
    venue: "Mission Hall",
    status: "approved",
    ticketsSold: 311,
  },
];
*/

async function fetchOrganizerDashboardData(
  accessToken: string,
  signal?: AbortSignal,
): Promise<OrganizerDashboardResponse> {
  const response = await fetch(
    apiUrl("/api/organizers/dashboard"),
    {
      signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Failed to fetch organizer dashboard (${response.status})`);
  }

  return response.json() as Promise<OrganizerDashboardResponse>;
}

function StatusPill({ status }: { status: OrganizerEvent["status"] }) {
  if (status === "approved") {
    return (
      <span className="rounded-pill bg-success-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-success-800">
        Approved
      </span>
    );
  }

  return (
    <span className="rounded-pill bg-warning-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-warning-800">
      Waiting for Approval
    </span>
  );
}

function EventCard({ event }: { event: OrganizerEvent }) {
  return (
    <article className="rounded-xl border border-neutral-200 bg-surface-raised p-5 shadow-soft transition-all duration-base hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold text-neutral-900">{event.name}</h3>
          <p className="mt-1 text-sm text-neutral-600">{event.dateLabel}</p>
          <p className="text-sm text-neutral-500">{event.venue}</p>
        </div>
        <StatusPill status={event.status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
        <span className="rounded-pill bg-brand-50 px-3 py-1 text-brand-800">
          Tickets sold: <strong>{event.ticketsSold}</strong>
        </span>
        <Button type="button" variant="outline" size="sm">
          View details
        </Button>
        <Link to={`/dashboard-organizer/events/${event.id}/edit`}>
          <Button type="button" variant="outline" size="sm">
            Edit
          </Button>
        </Link>
      </div>
    </article>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600">
      <p className="font-semibold text-neutral-800">{title}</p>
      <p className="mt-1">{body}</p>
    </div>
  );
}

export default function DashboardOrganizer() {
  const [currentEvents, setCurrentEvents] = useState<OrganizerEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<OrganizerEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      setIsLoadingEvents(true);
      try {
        const accessToken = getAccessTokenFromStorage();

        if (!accessToken) {
          throw new Error("Missing auth token in localStorage. Save one of: authToken, accessToken, or authSession.access_token.");
        }

        const data = await fetchOrganizerDashboardData(
          accessToken,
          controller.signal,
        );
        setCurrentEvents(data.currentEvents ?? []);
        setPastEvents(data.pastEvents ?? []);
        setEventsError(null);
        setLastSyncAt(new Date());
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        setEventsError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingEvents(false);
        }
      }
    }

    loadDashboard();
    return () => controller.abort();
  }, []);

  const approvedCount = useMemo(
    () => currentEvents.filter((event) => event.status === "approved").length,
    [currentEvents],
  );
  const pendingCount = useMemo(
    () => currentEvents.filter((event) => event.status === "pending").length,
    [currentEvents],
  );
  const totalSoldAcrossCurrent = useMemo(
    () => currentEvents.reduce((sum, event) => sum + event.ticketsSold, 0),
    [currentEvents],
  );

  return (
    <div className="bg-surface-base">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
        <aside className="rounded-xl border border-neutral-200 bg-surface-raised p-4 shadow-soft lg:sticky lg:top-24 lg:h-fit">
          <p className="font-display text-2xl font-bold text-neutral-900">Organizer</p>
          <p className="mt-1 text-sm text-neutral-500">Studio Team</p>

          <nav className="mt-6 space-y-2 text-sm font-semibold">
            <a className="block rounded-sm bg-brand-50 px-3 py-2 text-brand-800" href="#overview">
              Home
            </a>
            <a className="block rounded-sm px-3 py-2 text-neutral-700 transition-colors duration-fast hover:bg-neutral-100" href="#create-event">
              Create Event
            </a>
            <a className="block rounded-sm px-3 py-2 text-neutral-700 transition-colors duration-fast hover:bg-neutral-100" href="#orders">
              RSVP / Orders
            </a>
            <a className="block rounded-sm px-3 py-2 text-neutral-700 transition-colors duration-fast hover:bg-neutral-100" href="#settings">
              Settings
            </a>
          </nav>
        </aside>

        <section id="overview" className="space-y-6">
          <header className="rounded-xl border border-neutral-200 bg-surface-raised p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Organizer Dashboard</p>
                <h1 className="mt-1 font-display text-3xl font-bold text-neutral-900">Event performance at a glance</h1>
                <p className="mt-1 text-sm text-neutral-500">
                  {lastSyncAt ? `Last synced ${lastSyncAt.toLocaleTimeString()}` : "Not synced yet"}
                </p>
              </div>
              <Link
                id="create-event"
                to="/CreateEvent"
              >
                <Button type="button">+ Create event</Button>
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Current events</p>
                <p className="mt-2 text-2xl font-bold text-neutral-900">{currentEvents.length}</p>
              </div>
              <div className="rounded-lg bg-success-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-success-700">Approved</p>
                <p className="mt-2 text-2xl font-bold text-success-900">{approvedCount}</p>
              </div>
              <div className="rounded-lg bg-warning-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-warning-700">Waiting for approval</p>
                <p className="mt-2 text-2xl font-bold text-warning-900">{pendingCount}</p>
              </div>
            </div>
          </header>

          {eventsError ? (
            <section className="rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-700">
              <p className="font-semibold">Dashboard data is unavailable</p>
              <p className="mt-1">{eventsError}</p>
              <p className="mt-2 text-xs text-error-800/80">
                Ensure login stores both organizer id and access token in localStorage.
              </p>
            </section>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <section className="rounded-xl border border-neutral-200 bg-surface-raised p-6 shadow-soft">
                <h2 className="font-display text-2xl font-semibold text-neutral-900">Current Events</h2>
                {isLoadingEvents ? (
                  <p className="mt-3 text-sm text-neutral-600">Loading current events...</p>
                ) : currentEvents.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState
                      title="No current events"
                      body="Create a new event or publish a draft to start seeing performance here."
                    />
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {currentEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </section>

              <section id="orders" className="rounded-xl border border-neutral-200 bg-surface-raised p-6 shadow-soft">
                <h2 className="font-display text-2xl font-semibold text-neutral-900">Past Events</h2>
                {isLoadingEvents ? (
                  <p className="mt-3 text-sm text-neutral-600">Loading past events...</p>
                ) : pastEvents.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState
                      title="No past events"
                      body="Completed events will appear here after their end date."
                    />
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {pastEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-xl border border-neutral-200 bg-surface-raised p-5 shadow-soft">
                <h3 className="font-display text-xl font-semibold text-neutral-900">Performance Snapshot</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Total tickets sold</span>
                    <strong className="text-neutral-900">{totalSoldAcrossCurrent}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Pending approvals</span>
                    <strong className="text-warning-800">{pendingCount}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Published events</span>
                    <strong className="text-success-800">{approvedCount}</strong>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-neutral-200 bg-surface-raised p-5 shadow-soft">
                <h3 className="font-display text-xl font-semibold text-neutral-900">Quick Actions</h3>
                <div className="mt-4 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    className="justify-start"
                  >
                    Duplicate recent event
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    className="justify-start"
                  >
                    Download attendee CSV
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    className="justify-start"
                  >
                    Open event check-in
                  </Button>
                </div>
              </section>

              <section id="settings" className="rounded-xl border border-dashed border-neutral-300 bg-surface-subtle p-5 text-sm text-neutral-600">
                <p className="font-semibold text-neutral-800">Organizer Settings</p>
                <p className="mt-1">Payout profile, team permissions, and notifications can be added here.</p>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}
