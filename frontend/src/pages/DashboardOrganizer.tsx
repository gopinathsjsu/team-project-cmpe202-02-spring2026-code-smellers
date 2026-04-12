type OrganizerEvent = {
  id: string;
  name: string;
  dateLabel: string;
  venue: string;
  status: "approved" | "pending";
  ticketsSold: number;
};

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

/*
Backend API support placeholder (enable when organizer endpoint exists):

import { useEffect, useState } from "react";

type OrganizerDashboardResponse = {
  currentEvents: OrganizerEvent[];
  pastEvents: OrganizerEvent[];
};

async function fetchOrganizerDashboardData(
  organizerId: string,
): Promise<OrganizerDashboardResponse> {
  const response = await fetch(`/api/organizers/${organizerId}/dashboard`);
  if (!response.ok) {
    throw new Error(`Failed to fetch organizer dashboard (${response.status})`);
  }
  return response.json() as Promise<OrganizerDashboardResponse>;
}

const [currentEvents, setCurrentEvents] = useState<OrganizerEvent[]>([]);
const [pastEvents, setPastEvents] = useState<OrganizerEvent[]>([]);
const [isLoadingEvents, setIsLoadingEvents] = useState(true);
const [eventsError, setEventsError] = useState<string | null>(null);

useEffect(() => {
  let isMounted = true;
  setIsLoadingEvents(true);
  fetchOrganizerDashboardData("organizer-id-placeholder")
    .then((data) => {
      if (!isMounted) return;
      setCurrentEvents(data.currentEvents);
      setPastEvents(data.pastEvents);
      setEventsError(null);
    })
    .catch((error: unknown) => {
      if (!isMounted) return;
      setEventsError(error instanceof Error ? error.message : "Unknown error");
    })
    .finally(() => {
      if (isMounted) setIsLoadingEvents(false);
    });

  return () => {
    isMounted = false;
  };
}, []);
*/

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
        <button
          type="button"
          className="rounded-sm border border-neutral-300 bg-surface-raised px-3 py-1 font-semibold text-neutral-700 transition-colors duration-fast hover:border-brand-300 hover:text-brand-800"
        >
          View details
        </button>
        <button
          type="button"
          className="rounded-sm border border-neutral-300 bg-surface-raised px-3 py-1 font-semibold text-neutral-700 transition-colors duration-fast hover:border-brand-300 hover:text-brand-800"
        >
          Edit
        </button>
      </div>
    </article>
  );
}

export default function DashboardOrganizer() {
  const currentEvents = currentEventsMock;
  const pastEvents = pastEventsMock;

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
              </div>
              <button
                id="create-event"
                type="button"
                className="rounded-sm bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-fast hover:bg-brand-700"
              >
                + Create event
              </button>
            </div>
          </header>

          <section className="rounded-xl border border-neutral-200 bg-surface-raised p-6 shadow-soft">
            <h2 className="font-display text-2xl font-semibold text-neutral-900">Current Events</h2>
            <div className="mt-4 space-y-4">
              {currentEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>

          <section id="orders" className="rounded-xl border border-neutral-200 bg-surface-raised p-6 shadow-soft">
            <h2 className="font-display text-2xl font-semibold text-neutral-900">Past Events</h2>
            <div className="mt-4 space-y-4">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>

          <section id="settings" className="rounded-xl border border-dashed border-neutral-300 bg-surface-subtle p-6 text-sm text-neutral-600">
            Settings and organizer account preferences can go here.
          </section>
        </section>
      </div>
    </div>
  );
}
