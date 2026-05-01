import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/ui/button";
import { EventCard } from "../components/ui/event-card";
import { addressUpToCity } from "../lib/addressDisplay";
import {
  buildGoogleCalendarUrl,
  buildIcsDocument,
  downloadIcsFile,
  safeIcsFilename,
  type CalendarEventInput,
} from "../lib/eventCalendar";
import { apiUrl } from "../lib/api";
import { addSavedEvent, fetchMySavedEvents, removeSavedEvent } from "../lib/meSaved";
import type { SearchEvent } from "../services/searchApi";
import { getAuthToken } from "../lib/auth";

type LocationEmbed = {
  venue_name: string | null;
  address: string | null;
  /** DB column name (typo preserved to match API). */
  latitude?: number | null;
  longitude?: number | null;
};

type OrganizerEmbed = {
  id: string;
  display_name: string;
};

type EventDetailApi = {
  id: number;
  title: string;
  description: string | null;
  start_date_time: string | null;
  end_date_time?: string | null;
  image_url: string | null;
  category?: string | null;
  capacity?: number | null;
  rsvp_count?: number | null;
  locations: LocationEmbed | LocationEmbed[] | null;
  organizer?: OrganizerEmbed | OrganizerEmbed[] | null;
};

function organizerDisplayName(organizer: EventDetailApi["organizer"]): string | null {
  if (organizer == null) return null;
  const row = Array.isArray(organizer) ? organizer[0] : organizer;
  const name = row?.display_name?.trim();
  return name || null;
}

function organizerInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return parts[0]?.[0]?.toUpperCase() ?? "?";
}

function UserCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M6.5 20.25v-.5a5.5 5.5 0 0 1 11 0v.5" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="14" height="14" rx="1.5" />
      <path d="M3 8h14M7 2v4M13 2v4" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 17c0 0 5-4.5 5-8.5C15 5.5 12.8 3 10 3S5 5.5 5 8.5 10 17 10 17z" />
      <circle cx="10" cy="8.2" r="1.8" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4 6 10l6 6" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 8 5 5 5-5" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 4.5v7" />
      <path d="M6.5 8 10 4.5 13.5 8" />
      <path d="M4 11.5v4h12v-4" />
    </svg>
  );
}

function HeartIcon({ className, filled }: { className?: string; filled: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 17.5c-.3 0-.6-.1-.9-.3C6.2 15.2 2 11.2 2 6.5 2 4 4 2 6.5 2c1.9 0 3.4 1.1 4 2.7.6-1.6 2.1-2.7 4-2.7C17 2 19 4 19 6.5c0 4.7-4.2 8.7-7.1 10.7-.3.2-.6.3-.9.3z" />
    </svg>
  );
}

function normalizeLocation(
  loc: EventDetailApi["locations"],
): LocationEmbed | null {
  if (loc == null) return null;
  return Array.isArray(loc) ? (loc[0] ?? null) : loc;
}

function formatTimeShort(d: Date): string {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    hour12: true,
  };
  if (d.getMinutes() !== 0) {
    opts.minute = "2-digit";
  }
  return d.toLocaleString("en-US", opts);
}

function formatEventDateLine(
  startIso: string | null,
  endIso: string | null,
): string {
  if (!startIso) return "Date to be announced";
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return "Date to be announced";

  const datePart = start.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const startTime = formatTimeShort(start);
  let timePart = startTime;
  if (endIso) {
    const end = new Date(endIso);
    if (!Number.isNaN(end.getTime())) {
      timePart = `${startTime} - ${formatTimeShort(end)}`;
    }
  }

  return `${datePart}  •  ${timePart}`;
}

function formatLocationLine(loc: LocationEmbed | null): string {
  if (!loc) return "Location to be announced";
  const venue = loc.venue_name?.trim();
  const raw = loc.address?.trim();
  const address = raw ? addressUpToCity(raw) : "";
  if (venue && address) return `${venue} • ${address}`;
  return venue || address || "Location to be announced";
}

function formatCategoryLabel(slug: string | null | undefined): string | null {
  if (!slug?.trim()) return null;
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatEventDuration(startIso: string | null, endIso: string | null): string | null {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;
  const ms = end.getTime() - start.getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0 && m > 0) return `${h} hr ${m} min`;
  if (h > 0) return `${h} hour${h > 1 ? "s" : ""}`;
  if (m > 0) return `${m} minute${m > 1 ? "s" : ""}`;
  return null;
}

function mapsSearchQuery(loc: LocationEmbed | null): string | null {
  if (!loc) return null;
  const venue = loc.venue_name?.trim();
  const addr = loc.address?.trim();
  const q = [venue, addr].filter(Boolean).join(", ");
  return q || null;
}

/** Google Maps embed (no API key). Prefers lat/lng when stored on the location row. */
function mapEmbedSrc(loc: LocationEmbed | null): string | null {
  if (!loc) return null;
  const lat = loc.latitude;
  const lng = loc.longitude;
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    return `https://www.google.com/maps?q=${lat},${lng}&z=16&hl=en&output=embed`;
  }
  const q = mapsSearchQuery(loc);
  if (!q) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=16&hl=en&output=embed`;
}

export default function EventDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetailApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isRsvping, setIsRsvping] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [hasRsvped, setHasRsvped] = useState(false);
  const [related, setRelated] = useState<SearchEvent[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  const handleShare = useCallback(async () => {
    if (!event) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, url });
        return;
      }
    } catch {
      /* dismissed share sheet or share failed */
    }
    try {
      if (url && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* clipboard unavailable */
    }
  }, [event]);

  useEffect(() => {
    if (!id?.trim()) {
      setLoading(false);
      setError("Missing event");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const res = await fetch(apiUrl(`/api/events/${encodeURIComponent(id)}`));
        const text = await res.text();
        let body: unknown = null;
        try {
          body = text ? JSON.parse(text) : null;
        } catch {
          body = null;
        }

        if (cancelled) return;

        if (!res.ok) {
          const msg =
            body &&
            typeof body === "object" &&
            body !== null &&
            "error" in body &&
            typeof (body as { error: unknown }).error === "string"
              ? (body as { error: string }).error
              : res.status === 404
                ? "This event could not be found."
                : "Something went wrong loading this event.";
          setEvent(null);
          setError(msg);
          return;
        }

        setEvent(body as EventDetailApi);
      } catch {
        if (!cancelled) {
          setEvent(null);
          setError("Could not reach the server. Try again in a moment.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!event) {
      return;
    }
    if (status === "loading") {
      return;
    }
    if (status !== "authenticated") {
      setIsSaved(false);
      return;
    }

    let cancelled = false;
    const eventId = String(event.id);
    void fetchMySavedEvents()
      .then((list) => {
        if (!cancelled) {
          setIsSaved(list.some((row) => row.eventId === eventId));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsSaved(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [event, status]);

  const handleToggleSaved = useCallback(async () => {
    if (!event) {
      return;
    }
    const eventId = String(event.id);
    if (status !== "authenticated") {
      setIsSaved((s) => !s);
      return;
    }
    try {
      if (isSaved) {
        await removeSavedEvent(eventId);
        setIsSaved(false);
      } else {
        await addSavedEvent(eventId);
        setIsSaved(true);
      }
    } catch {
      /* keep previous state */
    }
  }, [event, isSaved, status]);

  const handleRsvp = useCallback(async () => {
    if (!event) {
      return;
    }

    if (status !== "authenticated") {
      navigate("/login", { state: { from: `${location.pathname}${location.search}` } });
      return;
    }

    const token = getAuthToken();
    if (!token) {
      navigate("/login", { state: { from: `${location.pathname}${location.search}` } });
      return;
    }

    setIsRsvping(true);
    setRsvpError(null);

    try {
      const response = await fetch(apiUrl(`/api/events/${event.id}/tickets`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();
      let body: unknown = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = null;
      }

      if (!response.ok) {
        const message =
          body &&
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof (body as { error: unknown }).error === "string"
            ? (body as { error: string }).error
            : `Request failed (${response.status})`;
        throw new Error(message);
      }

      setHasRsvped(true);
    } catch (error) {
      setRsvpError(error instanceof Error ? error.message : "Could not register for this event.");
    } finally {
      setIsRsvping(false);
    }
  }, [event, location.pathname, location.search, navigate, status]);

  useEffect(() => {
    if (!event?.id) {
      setRelated([]);
      return;
    }

    let cancelled = false;
    setRelatedLoading(true);
    setRelated([]);

    const params = new URLSearchParams();
    if (event.category?.trim()) {
      params.set("category", event.category.trim());
    }

    void (async () => {
      try {
        const qs = params.toString();
        const res = await fetch(
          apiUrl(`/api/events/${event.id}/related${qs ? `?${qs}` : ""}`),
        );
        if (!res.ok) {
          if (!cancelled) setRelated([]);
          return;
        }
        const data: unknown = await res.json();
        if (!cancelled) {
          setRelated(Array.isArray(data) ? (data as SearchEvent[]) : []);
        }
      } catch {
        if (!cancelled) setRelated([]);
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [event?.id, event?.category]);

  const loc = event ? normalizeLocation(event.locations) : null;

  const calendarInput: CalendarEventInput | null = useMemo(() => {
    if (!event?.start_date_time) return null;
    return {
      title: event.title,
      description: event.description,
      locationLine: mapsSearchQuery(loc) ?? formatLocationLine(loc) ?? "",
      startIso: event.start_date_time,
      endIso: event.end_date_time ?? null,
      eventId: event.id,
    };
  }, [event, loc]);

  const googleCalendarUrl = useMemo(
    () => (calendarInput ? buildGoogleCalendarUrl(calendarInput) : null),
    [calendarInput],
  );

  const handleDownloadIcs = useCallback(() => {
    if (!calendarInput) return;
    const ics = buildIcsDocument(calendarInput);
    if (!ics) return;
    downloadIcsFile(safeIcsFilename(calendarInput.title, calendarInput.eventId), ics);
  }, [calendarInput]);

  const dateLabel = event
    ? formatEventDateLine(event.start_date_time, event.end_date_time ?? null)
    : "";
  const locationLabel = event ? formatLocationLine(loc) : "";
  const organizerName = event ? organizerDisplayName(event.organizer) : null;
  const categoryLabel = event ? formatCategoryLabel(event.category) : null;
  const durationLabel = event
    ? formatEventDuration(event.start_date_time, event.end_date_time ?? null)
    : null;
  const hasLocationDetails = Boolean(
    loc && (loc.venue_name?.trim() || loc.address?.trim()),
  );
  const mapPreviewSrc = hasLocationDetails && loc ? mapEmbedSrc(loc) : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-sm"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to home
      </Link>

      {loading ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-3 text-neutral-600">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"
            aria-hidden="true"
          />
          <p>Loading event…</p>
        </div>
      ) : error ? (
        <div className="mt-10 rounded-lg border border-neutral-200 bg-surface-raised p-8 text-center">
          <h1 className="font-display text-xl font-semibold text-neutral-900">
            {error}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Check the link or browse events from the home page.
          </p>
          <Button
            type="button"
            variant="primary"
            className="mt-6"
            onClick={() => navigate("/")}
          >
            Browse events
          </Button>
        </div>
      ) : event ? (
        <>
          <article className="mt-8">
            <div className="overflow-hidden rounded-xl bg-brand-100 shadow-[var(--ds-shadow-card)]">
              <div className="aspect-[21/9] min-h-[200px] w-full sm:aspect-[2.4/1]">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-brand-400">
                    <CalendarIcon className="h-20 w-20 sm:h-24 sm:w-24" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-10 lg:grid lg:grid-cols-3 lg:gap-x-10 lg:gap-y-0">
              <div className="order-1 min-w-0 lg:col-span-2 lg:row-start-1">
                <h1 className="font-display text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                  {event.title}
                </h1>

                <ul className="mt-6 flex flex-col gap-3 text-neutral-700">
                  <li className="flex items-center gap-3">
                    <span className="shrink-0 text-brand-600">
                      <CalendarIcon className="h-5 w-5" />
                    </span>
                    <p className="text-base">{dateLabel}</p>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="shrink-0 text-brand-600">
                      <PinIcon className="h-5 w-5" />
                    </span>
                    <p className="text-base">{locationLabel}</p>
                  </li>
                </ul>

                <section className="mt-10" aria-labelledby="about-heading">
                  <h2
                    id="about-heading"
                    className="font-display text-xl font-semibold text-neutral-900"
                  >
                    About this event
                  </h2>
                  {event.description?.trim() ? (
                    <div className="mt-4 space-y-4 text-base leading-relaxed text-neutral-700 whitespace-pre-wrap">
                      {event.description.trim()}
                    </div>
                  ) : (
                    <p className="mt-4 text-base text-neutral-600">
                      The organizer has not added a description yet.
                    </p>
                  )}
                </section>

                <section className="mt-10 border-t border-neutral-200 pt-10" aria-labelledby="good-to-know-heading">
                  <h2
                    id="good-to-know-heading"
                    className="font-display text-xl font-semibold text-neutral-900"
                  >
                    Good to know
                  </h2>
                  <ul className="mt-4 list-none space-y-3 text-base text-neutral-700">
                    <li className="flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                      <span>Free to attend — no ticket purchase required.</span>
                    </li>
                    {categoryLabel ? (
                      <li className="flex gap-3">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                        <span>
                          Category: <span className="font-medium text-neutral-900">{categoryLabel}</span>
                        </span>
                      </li>
                    ) : null}
                    {typeof event.capacity === "number" && event.capacity > 0 ? (
                      <li className="flex gap-3">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                        <span>
                          Venue capacity is about{" "}
                          <span className="font-medium text-neutral-900">{event.capacity}</span> attendees.
                        </span>
                      </li>
                    ) : null}
                    {typeof event.rsvp_count === "number" ? (
                      <li className="flex gap-3">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                        <span>
                          <span className="font-medium text-neutral-900">{event.rsvp_count}</span>{" "}
                          {event.rsvp_count === 1 ? "person has" : "people have"} RSVP&apos;d so far.
                        </span>
                      </li>
                    ) : null}
                    {durationLabel ? (
                      <li className="flex gap-3">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                        <span>
                          Scheduled run time about{" "}
                          <span className="font-medium text-neutral-900">{durationLabel}</span>.
                        </span>
                      </li>
                    ) : null}
                  </ul>
                </section>

                <section className="mt-10 border-t border-neutral-200 pt-10" aria-labelledby="location-heading">
                  <h2
                    id="location-heading"
                    className="font-display text-xl font-semibold text-neutral-900"
                  >
                    Location
                  </h2>
                  {hasLocationDetails && loc ? (
                    <div className="mt-4">
                      {loc.venue_name?.trim() ? (
                        <p className="text-base font-bold leading-relaxed text-neutral-900">
                          {loc.venue_name.trim()}
                        </p>
                      ) : null}
                      {loc.address?.trim() ? (
                        <p className="mt-2 text-base leading-relaxed text-neutral-700 whitespace-pre-wrap">
                          {loc.address.trim()}
                        </p>
                      ) : null}
                      {mapPreviewSrc ? (
                        <div
                          className="mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
                          style={{ boxShadow: "var(--ds-shadow-card)" }}
                        >
                          <div className="aspect-[16/10] w-full min-h-[200px] sm:min-h-[240px]">
                            <iframe
                              title="Map preview for this event location"
                              src={mapPreviewSrc}
                              className="h-full w-full border-0"
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-4 text-base text-neutral-600">
                      Location details have not been published for this event yet.
                    </p>
                  )}
                </section>

                <div className="mt-10 border-t border-neutral-200 pt-10">
                  <h2
                    id="organizer-heading"
                    className="font-display text-xl font-semibold text-neutral-900"
                  >
                    Organized by
                  </h2>
                  <div className="mt-4 flex items-center gap-4">
                    {organizerName ? (
                      <>
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-base font-semibold text-brand-800 ring-2 ring-brand-200/80"
                          aria-hidden="true"
                        >
                          {organizerInitials(organizerName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-neutral-900">
                            {organizerName}
                          </p>
                          <p className="mt-0.5 text-sm text-neutral-500">Event organizer</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 ring-2 ring-neutral-200/80"
                          aria-hidden="true"
                        >
                          <UserCircleIcon className="h-8 w-8" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-neutral-700">
                            Organizer unavailable
                          </p>
                          <p className="mt-0.5 text-sm text-neutral-500">
                            Organizer details could not be loaded.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <aside className="order-3 min-w-0 lg:col-start-3 lg:row-start-1 lg:mt-0 lg:h-full lg:min-h-0">
                <div className="space-y-3 lg:sticky lg:top-6 lg:z-10">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => void handleShare()}
                      className="flex h-10 w-10 items-center justify-center rounded-sm border border-neutral-300 bg-surface-raised text-neutral-600 transition-colors duration-fast hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                      aria-label="Share event"
                    >
                      <ShareIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleToggleSaved()}
                      className={
                        isSaved
                          ? "flex h-10 w-10 items-center justify-center rounded-sm bg-accent-400 text-accent-950 transition-colors duration-fast hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                          : "flex h-10 w-10 items-center justify-center rounded-sm border border-neutral-300 bg-surface-raised text-neutral-600 transition-colors duration-fast hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                      }
                      aria-label={isSaved ? "Remove from favorites" : "Add to favorites"}
                    >
                      <HeartIcon className="h-5 w-5" filled={isSaved} />
                    </button>
                  </div>
                  <div
                    className="rounded-xl border border-neutral-200 bg-surface-raised p-6"
                    style={{ boxShadow: "var(--ds-shadow-card)" }}
                  >
                    <p className="text-sm font-semibold text-accent-600">Free</p>
                    <p className="mt-1 text-sm text-neutral-600">
                      Press RSVP to register for this event.
                    </p>
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      fullWidth
                      className="mt-6"
                      onClick={() => void handleRsvp()}
                      isLoading={isRsvping}
                      disabled={hasRsvped}
                    >
                      {hasRsvped ? "Registered" : "RSVP"}
                    </Button>
                    {rsvpError ? (
                      <p className="mt-3 text-sm text-error-600">{rsvpError}</p>
                    ) : hasRsvped ? (
                      <p className="mt-3 text-sm text-emerald-700">You are registered for this event.</p>
                    ) : null}
                    {googleCalendarUrl ? (
                      <details className="mt-4 open:[&_.calendar-chevron]:rotate-180">
                        <summary className="flex w-full cursor-pointer list-none items-center justify-center gap-2 rounded-sm border-2 border-brand-600 bg-transparent px-4 py-2 text-base !font-semibold tracking-normal text-brand-600 transition-colors duration-fast hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                          <CalendarIcon className="h-5 w-5 shrink-0" />
                          Add to calendar
                          <ChevronDownIcon className="calendar-chevron h-4 w-4 shrink-0 transition-transform duration-fast" />
                        </summary>
                        <ul
                          className="mt-2 flex flex-col gap-0.5 rounded-sm border border-neutral-200 bg-surface-raised p-1.5"
                          style={{ boxShadow: "var(--ds-shadow-card)" }}
                        >
                          <li>
                            <a
                              href={googleCalendarUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded-sm px-3 py-2.5 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                            >
                              Google Calendar
                            </a>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={handleDownloadIcs}
                              className="w-full rounded-sm px-3 py-2.5 text-left text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                            >
                              Apple Calendar / Outlook (.ics)
                            </button>
                          </li>
                        </ul>
                      </details>
                    ) : null}
                  </div>
                </div>
              </aside>

              <section
                className="order-2 w-full min-w-0 border-t border-neutral-200 pt-10 lg:col-span-3 lg:row-start-2 lg:mt-10"
                aria-labelledby="related-events-heading"
              >
                <h2
                  id="related-events-heading"
                  className="font-display text-xl font-semibold text-neutral-900"
                >
                  Related events
                </h2>
                {relatedLoading ? (
                  <p className="mt-6 text-neutral-600">Loading related events…</p>
                ) : related.length === 0 ? (
                  <p className="mt-6 text-neutral-600">
                    No other upcoming events to show right now.
                  </p>
                ) : (
                  <ul className="mt-6 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {related.map((item) => (
                      <li key={item.id}>
                        <EventCard
                          id={item.id}
                          title={item.title}
                          date={item.date}
                          location={item.location}
                          imageUrl={item.imageUrl}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </article>
        </>
      ) : null}
    </div>
  );
}
