import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { apiUrl } from "../lib/api";
import { getAuthToken } from "../lib/auth";

type RsvpStatus = "pending" | "confirmed" | "attended" | "canceled" | null;

type OrganizerAttendee = {
  ticketId: string;
  customerId: string | null;
  displayName: string;
  email: string;
  createdAt: string;
  rsvpStatus: RsvpStatus;
};

type OrganizerEvent = {
  id: number;
  title: string;
  capacity: number | null;
  rsvp_count: number | null;
};

type OrganizerAttendeesResponse = {
  event: OrganizerEvent;
  attendees: OrganizerAttendee[];
};

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusPill({ status }: { status: RsvpStatus }) {
  if (status === "confirmed") {
    return <span className="rounded-pill bg-success-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-success-800">Confirmed</span>;
  }
  if (status === "pending") {
    return <span className="rounded-pill bg-warning-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-warning-800">Pending</span>;
  }
  if (status === "attended") {
    return <span className="rounded-pill bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-800">Attended</span>;
  }
  if (status === "canceled") {
    return <span className="rounded-pill bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">Removed</span>;
  }

  return <span className="rounded-pill bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">Unknown</span>;
}

async function fetchAttendees(accessToken: string, eventId: string, signal?: AbortSignal): Promise<OrganizerAttendeesResponse> {
  const response = await fetch(apiUrl(`/api/organizers/events/${eventId}/attendees`), {
    signal,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const text = await response.text();
  let data: OrganizerAttendeesResponse & { error?: string };
  try {
    data = text ? (JSON.parse(text) as OrganizerAttendeesResponse & { error?: string }) : ({ event: null, attendees: [] } as unknown as OrganizerAttendeesResponse & { error?: string });
  } catch {
    data = { event: null, attendees: [] } as unknown as OrganizerAttendeesResponse & { error?: string };
  }

  if (!response.ok) {
    throw new Error(data.error || text || `Failed to load attendees (${response.status})`);
  }

  return data;
}

async function removeAttendee(accessToken: string, eventId: string, ticketId: string): Promise<void> {
  const response = await fetch(apiUrl(`/api/organizers/events/${eventId}/attendees/${ticketId}`), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const text = await response.text();
  let data: { error?: string } | null = null;
  try {
    data = text ? (JSON.parse(text) as { error?: string }) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || text || `Failed to remove attendee (${response.status})`);
  }
}

export default function OrganizerAttendees() {
  const params = useParams();
  const eventId = params.id;

  const [event, setEvent] = useState<OrganizerEvent | null>(null);
  const [attendees, setAttendees] = useState<OrganizerAttendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionTicketId, setActionTicketId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        if (!eventId) {
          throw new Error("Missing event id in route");
        }

        const token = getAuthToken();
        if (!token) {
          throw new Error("You must be logged in to manage attendees.");
        }

        const data = await fetchAttendees(token, eventId, controller.signal);
        setEvent(data.event);
        setAttendees(data.attendees ?? []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => controller.abort();
  }, [eventId, reloadKey]);

  const activeAttendees = useMemo(
    () => attendees.filter((attendee) => attendee.rsvpStatus !== "canceled"),
    [attendees],
  );
  const removedAttendees = useMemo(
    () => attendees.filter((attendee) => attendee.rsvpStatus === "canceled"),
    [attendees],
  );
  const confirmedCount = useMemo(
    () => attendees.filter((attendee) => attendee.rsvpStatus === "confirmed").length,
    [attendees],
  );
  const pendingCount = useMemo(
    () => attendees.filter((attendee) => attendee.rsvpStatus === "pending").length,
    [attendees],
  );
  const attendedCount = useMemo(
    () => attendees.filter((attendee) => attendee.rsvpStatus === "attended").length,
    [attendees],
  );

  async function handleRemoveAttendee(ticketId: string) {
    if (!eventId) {
      setError("Missing event id in route");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError("You must be logged in to manage attendees.");
      return;
    }

    setActionTicketId(ticketId);
    setError(null);

    try {
      await removeAttendee(token, eventId, ticketId);
      setReloadKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove attendee");
    } finally {
      setActionTicketId(null);
    }
  }

  return (
    <div className="bg-surface-base">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Organizer Workspace</p>
            <h1 className="mt-1 font-display text-4xl font-bold text-neutral-900">Attendee management</h1>
            <p className="mt-2 text-sm text-neutral-600">
              View RSVP status for each attendee and remove attendees when needed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/dashboard-organizer"
              className="inline-flex items-center justify-center rounded-sm border-2 border-brand-600 bg-transparent px-3 py-2 text-sm font-semibold tracking-normal text-brand-600 transition-colors duration-fast hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Back to dashboard
            </Link>
            {eventId ? (
              <Link
                to={`/dashboard-organizer/events/${eventId}/edit`}
                className="inline-flex items-center justify-center rounded-sm border-2 border-brand-600 bg-transparent px-3 py-2 text-sm font-semibold tracking-normal text-brand-600 transition-colors duration-fast hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                Edit event
              </Link>
            ) : null}
          </div>
        </div>

        {error ? (
          <section className="mb-6 rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-700">
            <p className="font-semibold">Attendee list unavailable</p>
            <p className="mt-1">{error}</p>
          </section>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-neutral-600">Loading attendees...</p>
        ) : event ? (
          <div className="space-y-6">
            <section className="rounded-xl border border-neutral-200 bg-surface-raised p-6 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Event</p>
                  <h2 className="mt-1 font-display text-3xl font-semibold text-neutral-900">{event.title}</h2>
                  <p className="mt-2 text-sm text-neutral-600">
                    {event.rsvp_count ?? 0} tickets sold
                    {event.capacity != null ? ` · Capacity ${event.capacity}` : ""}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-brand-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Active</p>
                    <p className="mt-2 text-2xl font-bold text-brand-900">{activeAttendees.length}</p>
                  </div>
                  <div className="rounded-lg bg-success-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-success-700">Confirmed</p>
                    <p className="mt-2 text-2xl font-bold text-success-900">{confirmedCount}</p>
                  </div>
                  <div className="rounded-lg bg-warning-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-warning-700">Pending</p>
                    <p className="mt-2 text-2xl font-bold text-warning-900">{pendingCount}</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Attended</p>
                    <p className="mt-2 text-2xl font-bold text-neutral-900">{attendedCount}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-neutral-200 bg-surface-raised p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold text-neutral-900">Current attendees</h2>
                <p className="text-sm text-neutral-500">{activeAttendees.length} listed</p>
              </div>

              {activeAttendees.length === 0 ? (
                <div className="mt-4 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600">
                  No active attendees yet.
                </div>
              ) : (
                <div className="mt-4 grid gap-4">
                  {activeAttendees.map((attendee) => {
                    const canRemove = attendee.rsvpStatus === "pending" || attendee.rsvpStatus === "confirmed";
                    return (
                      <article key={attendee.ticketId} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="font-semibold text-neutral-900">{attendee.displayName}</h3>
                              <StatusPill status={attendee.rsvpStatus} />
                            </div>
                            <p className="mt-1 text-sm text-neutral-600">{attendee.email || "No email available"}</p>
                            <p className="mt-1 text-xs text-neutral-500">
                              RSVP added {formatDateTime(attendee.createdAt)}
                            </p>
                          </div>

                          {canRemove ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              isLoading={actionTicketId === attendee.ticketId}
                              onClick={() => void handleRemoveAttendee(attendee.ticketId)}
                            >
                              Remove
                            </Button>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {removedAttendees.length > 0 ? (
              <section className="rounded-xl border border-neutral-200 bg-surface-raised p-6 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-2xl font-semibold text-neutral-900">Removed attendees</h2>
                  <p className="text-sm text-neutral-500">{removedAttendees.length} listed</p>
                </div>
                <div className="mt-4 grid gap-4">
                  {removedAttendees.map((attendee) => (
                    <article key={attendee.ticketId} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 opacity-80">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-semibold text-neutral-700">{attendee.displayName}</h3>
                            <StatusPill status={attendee.rsvpStatus} />
                          </div>
                          <p className="mt-1 text-sm text-neutral-600">{attendee.email || "No email available"}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            RSVP added {formatDateTime(attendee.createdAt)}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
