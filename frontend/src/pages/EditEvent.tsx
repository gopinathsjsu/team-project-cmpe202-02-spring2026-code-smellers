import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { FormField, Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { apiUrl } from "../lib/api";
import { getAuthToken } from "../lib/auth";

type LocationType = "in-person" | "virtual";

type EditEventFormState = {
  startDateTime: string;
  endDateTime: string;
  capacity: string;
  locationType: LocationType;
  locationQueryText: string;
  locationVenueName: string;
  locationAddress: string;
  locationLatitude: string;
  locationLongitude: string;
};

type OrganizerEventResponse = {
  event: {
    id: number;
    title: string;
    start_date_time: string | null;
    end_date_time: string | null;
    capacity: number | null;
    rsvp_count: number | null;
    approval_status: "pending" | "approved" | "rejected" | null;
    locations:
      | {
          id: number;
          type: LocationType | null;
          venue_name: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
        }
      | null;
  };
};

type UpdateEventPayload = {
  startDateTime?: string;
  endDateTime?: string;
  capacity?: number;
  location?:
    | {
        type?: LocationType;
        queryText?: string;
        venueName?: string;
        address?: string;
        latitude?: number;
        longitude?: number;
      }
    | null;
};

function isoToLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function toIso(value: string): string | undefined {
  if (!value.trim()) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export default function EditEvent() {
  const params = useParams();
  const navigate = useNavigate();
  const eventId = params.id;

  const [title, setTitle] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [rsvpCount, setRsvpCount] = useState<number>(0);

  const [form, setForm] = useState<EditEventFormState>({
    startDateTime: "",
    endDateTime: "",
    capacity: "",
    locationType: "in-person",
    locationQueryText: "",
    locationVenueName: "",
    locationAddress: "",
    locationLatitude: "",
    locationLongitude: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  function updateForm<K extends keyof EditEventFormState>(
    key: K,
    value: EditEventFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const minCapacity = rsvpCount;

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvent() {
      setIsLoading(true);
      setLoadError(null);
      try {
        if (!eventId) {
          throw new Error("Missing event id in route");
        }
        const token = getAuthToken();
        if (!token) {
          throw new Error("You must be logged in to edit an event.");
        }

        const response = await fetch(apiUrl(`/api/organizers/events/${eventId}`), {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await response.json()) as OrganizerEventResponse & { error?: string };
        if (!response.ok) {
          throw new Error(data.error || `Failed to load event (${response.status})`);
        }

        const e = data.event;
        setTitle(e.title);
        setStatus(e.approval_status ?? "");
        setRsvpCount(e.rsvp_count ?? 0);

        const loc = e.locations;
        setForm((prev) => ({
          ...prev,
          startDateTime: isoToLocalInputValue(e.start_date_time),
          endDateTime: isoToLocalInputValue(e.end_date_time),
          capacity: e.capacity ? String(e.capacity) : "",
          locationType: (loc?.type ?? "in-person") as LocationType,
          locationVenueName: loc?.venue_name ?? "",
          locationAddress: loc?.address ?? "",
          locationLatitude: loc?.latitude != null ? String(loc.latitude) : "",
          locationLongitude: loc?.longitude != null ? String(loc.longitude) : "",
        }));
      } catch (err) {
        if (controller.signal.aborted) return;
        setLoadError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadEvent();
    return () => controller.abort();
  }, [eventId]);

  function buildPayload(): UpdateEventPayload {
    return {
      startDateTime: toIso(form.startDateTime),
      endDateTime: toIso(form.endDateTime),
      capacity: parseOptionalNumber(form.capacity),
      location: {
        type: form.locationType,
        queryText: form.locationQueryText.trim() || undefined,
        venueName: form.locationVenueName.trim() || undefined,
        address: form.locationAddress.trim() || undefined,
        latitude: parseOptionalNumber(form.locationLatitude),
        longitude: parseOptionalNumber(form.locationLongitude),
      },
    };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError(null);
    setSubmitSuccess(null);

    if (!eventId) {
      setSubmitError("Missing event id.");
      return;
    }

    const payload = buildPayload();
    const token = getAuthToken();
    if (!token) {
      setSubmitError("You must be logged in to edit an event.");
      return;
    }

    if (!payload.startDateTime || !payload.endDateTime) {
      setSubmitError("Valid start and end date/time are required.");
      return;
    }
    if (new Date(payload.endDateTime) <= new Date(payload.startDateTime)) {
      setSubmitError("End date/time must be later than start date/time.");
      return;
    }
    if (!payload.capacity || payload.capacity <= 0) {
      setSubmitError("Capacity must be a positive number.");
      return;
    }
    if (payload.capacity < minCapacity) {
      setSubmitError(`Capacity cannot be less than current RSVPs (${minCapacity}).`);
      return;
    }
    if (form.locationType === "in-person" && !payload.location?.queryText) {
      setSubmitError("Google Places query text is required for in-person events.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl(`/api/organizers/events/${eventId}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setSubmitError(data.error || `Update failed (${response.status})`);
        return;
      }

      setSubmitSuccess("Event updated successfully.");
      setForm((prev) => ({ ...prev, locationQueryText: "" }));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unexpected error while updating event.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-neutral-600">Loading event…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-700">
          <p className="font-semibold">Unable to load event</p>
          <p className="mt-1">{loadError}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-surface-base">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Organizer Workspace</p>
          <h1 className="mt-1 font-display text-4xl font-bold text-neutral-900">Edit event</h1>
          <p className="mt-2 text-sm text-neutral-600">
            <strong>{title}</strong>
            {status ? ` · ${status}` : ""}
            {rsvpCount ? ` · RSVPs: ${rsvpCount}` : ""}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-xl border border-neutral-200 bg-surface-raised p-5 shadow-soft lg:sticky lg:top-24 lg:h-fit">
            <h2 className="font-display text-2xl font-semibold text-neutral-900">Editable fields</h2>
            <ol className="mt-4 space-y-3 text-sm text-neutral-700">
              <li className="rounded-sm bg-brand-50 px-3 py-2 text-brand-800">1. Date and Time</li>
              <li className="rounded-sm bg-neutral-50 px-3 py-2">2. Location</li>
              <li className="rounded-sm bg-neutral-50 px-3 py-2">3. Capacity</li>
            </ol>
            <div className="mt-4">
              <Button type="button" variant="outline" fullWidth onClick={() => navigate("/dashboard-organizer")}>
                Back to dashboard
              </Button>
            </div>
          </aside>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <section className="rounded-xl border border-neutral-200 bg-surface-raised p-6 shadow-soft">
              <h2 className="font-display text-2xl font-semibold text-neutral-900">Date and Time</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FormField label="Start Date & Time" htmlFor="event-start" required>
                  <Input
                    id="event-start"
                    type="datetime-local"
                    value={form.startDateTime}
                    onChange={(e) => updateForm("startDateTime", e.target.value)}
                  />
                </FormField>

                <FormField label="End Date & Time" htmlFor="event-end" required>
                  <Input
                    id="event-end"
                    type="datetime-local"
                    value={form.endDateTime}
                    onChange={(e) => updateForm("endDateTime", e.target.value)}
                  />
                </FormField>
              </div>
            </section>

            <section className="rounded-xl border border-neutral-200 bg-surface-raised p-6 shadow-soft">
              <h2 className="font-display text-2xl font-semibold text-neutral-900">Location</h2>
              <p className="mt-2 text-sm text-neutral-600">
                For in-person events, provide a <strong>Google Places Query Text</strong> to resolve the new location.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FormField label="Location Type" htmlFor="event-location-type" required>
                  <select
                    id="event-location-type"
                    value={form.locationType}
                    onChange={(e) => updateForm("locationType", e.target.value as LocationType)}
                    className="w-full rounded-sm border border-neutral-300 bg-surface-raised px-3 py-2.5 text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  >
                    <option value="in-person">In-person</option>
                    <option value="virtual">Virtual</option>
                  </select>
                </FormField>

                <FormField label="Google Places Query Text" htmlFor="event-location-query" required={form.locationType === "in-person"}>
                  <Input
                    id="event-location-query"
                    value={form.locationQueryText}
                    onChange={(e) => updateForm("locationQueryText", e.target.value)}
                    placeholder="e.g. San Jose Convention Center"
                  />
                </FormField>

                <FormField label="Venue Name" htmlFor="event-location-venue">
                  <Input
                    id="event-location-venue"
                    value={form.locationVenueName}
                    onChange={(e) => updateForm("locationVenueName", e.target.value)}
                    placeholder="Optional override"
                  />
                </FormField>

                <FormField label="Address" htmlFor="event-location-address">
                  <Input
                    id="event-location-address"
                    value={form.locationAddress}
                    onChange={(e) => updateForm("locationAddress", e.target.value)}
                    placeholder="Optional address"
                  />
                </FormField>

                <FormField label="Latitude" htmlFor="event-location-lat">
                  <Input
                    id="event-location-lat"
                    type="number"
                    step="any"
                    value={form.locationLatitude}
                    onChange={(e) => updateForm("locationLatitude", e.target.value)}
                    placeholder="Optional"
                  />
                </FormField>

                <FormField label="Longitude" htmlFor="event-location-lng">
                  <Input
                    id="event-location-lng"
                    type="number"
                    step="any"
                    value={form.locationLongitude}
                    onChange={(e) => updateForm("locationLongitude", e.target.value)}
                    placeholder="Optional"
                  />
                </FormField>
              </div>
            </section>

            <section className="rounded-xl border border-neutral-200 bg-surface-raised p-6 shadow-soft">
              <h2 className="font-display text-2xl font-semibold text-neutral-900">Capacity</h2>
              <p className="mt-2 text-sm text-neutral-600">
                Capacity must be at least <strong>{minCapacity}</strong> (current RSVPs).
              </p>
              <div className="mt-4 max-w-sm">
                <FormField label="Capacity" htmlFor="event-capacity" required>
                  <Input
                    id="event-capacity"
                    type="number"
                    min={Math.max(1, minCapacity)}
                    value={form.capacity}
                    onChange={(e) => updateForm("capacity", e.target.value)}
                    placeholder="100"
                  />
                </FormField>
              </div>
            </section>

            <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-surface-raised p-4 shadow-soft">
              <p className="text-sm text-neutral-600">Changes apply to both pending and approved events.</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => navigate("/dashboard-organizer")}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </section>

            {submitError ? (
              <section className="rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-700">
                {submitError}
              </section>
            ) : null}

            {submitSuccess ? (
              <section className="rounded-xl border border-success-200 bg-success-50 p-4 text-sm text-success-800">
                {submitSuccess}
              </section>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}

