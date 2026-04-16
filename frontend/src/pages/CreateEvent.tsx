import { type FormEvent, useState } from "react";
import { FormField, Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

type EventCategory =
  | "music"
  | "nightlife"
  | "art"
  | "holidays"
  | "sports"
  | "hobbies"
  | "business"
  | "food"
  | "charity";

type LocationType = "in-person" | "virtual";

type CreateEventFormState = {
  title: string;
  description: string;
  category: EventCategory;
  startDateTime: string;
  endDateTime: string;
  capacity: string;
  imageUrl: string;
  locationType: LocationType;
  locationQueryText: string;
  locationVenueName: string;
  locationAddress: string;
  locationLatitude: string;
  locationLongitude: string;
};

type CreateEventPayload = {
  title?: string;
  description?: string;
  category?: EventCategory;
  startDateTime?: string;
  endDateTime?: string;
  capacity?: number;
  imageUrl?: string;
  location?: {
    type?: LocationType;
    queryText?: string;
    venueName?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
};

const INITIAL_FORM: CreateEventFormState = {
  title: "",
  description: "",
  category: "music",
  startDateTime: "",
  endDateTime: "",
  capacity: "",
  imageUrl: "",
  locationType: "in-person",
  locationQueryText: "",
  locationVenueName: "",
  locationAddress: "",
  locationLatitude: "",
  locationLongitude: "",
};

export default function CreateEvent() {
  const [form, setForm] = useState<CreateEventFormState>(INITIAL_FORM);
  const isSubmitting = false;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  function updateForm<K extends keyof CreateEventFormState>(
    key: K,
    value: CreateEventFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function parseOptionalNumber(value: string): number | undefined {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : undefined;
  }

  function toIso(value: string): string | undefined {
    if (!value.trim()) {
      return undefined;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      return undefined;
    }
    return d.toISOString();
  }

  function buildPayload(): CreateEventPayload {
    return {
      title: form.title.trim() || undefined,
      description: form.description.trim() || undefined,
      category: form.category,
      startDateTime: toIso(form.startDateTime),
      endDateTime: toIso(form.endDateTime),
      capacity: parseOptionalNumber(form.capacity),
      imageUrl: form.imageUrl.trim() || undefined,
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

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError(null);
    setSubmitSuccess(null);

    const payload = buildPayload();
    if (!payload.title) {
      setSubmitError("Event title is required.");
      return;
    }

    setSubmitSuccess("Form validation passed. API submit will be added in the next chunk.");
  }

  return (
    <div className="bg-surface-base">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Organizer Workspace</p>
          <h1 className="mt-1 font-display text-4xl font-bold text-neutral-900">Create an event</h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-600">
            This first chunk sets up all fields required by the backend create event payload.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-xl border border-neutral-200 bg-surface-raised p-5 shadow-soft lg:sticky lg:top-24 lg:h-fit">
            <h2 className="font-display text-2xl font-semibold text-neutral-900">Setup Checklist</h2>
            <ol className="mt-4 space-y-3 text-sm text-neutral-700">
              <li className="rounded-sm bg-brand-50 px-3 py-2 text-brand-800">1. Basic Info</li>
              <li className="rounded-sm bg-neutral-50 px-3 py-2">2. Date and Time</li>
              <li className="rounded-sm bg-neutral-50 px-3 py-2">3. Location</li>
              <li className="rounded-sm bg-neutral-50 px-3 py-2">4. Publish</li>
            </ol>
          </aside>

          <form
            className="space-y-6"
            onSubmit={handleSubmit}
          >
            <section className="rounded-xl border border-neutral-200 bg-surface-raised p-6 shadow-soft">
              <h2 className="font-display text-2xl font-semibold text-neutral-900">Basic Information</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FormField label="Event Title" htmlFor="event-title" required>
                    <Input
                      id="event-title"
                      value={form.title}
                      onChange={(e) => updateForm("title", e.target.value)}
                      placeholder="e.g. Bay Area Product Meetup"
                    />
                  </FormField>
                </div>

                <FormField label="Category" htmlFor="event-category" required>
                  <select
                    id="event-category"
                    value={form.category}
                    onChange={(e) => updateForm("category", e.target.value as EventCategory)}
                    className="w-full rounded-sm border border-neutral-300 bg-surface-raised px-3 py-2.5 text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  >
                    <option value="music">Music</option>
                    <option value="nightlife">Nightlife</option>
                    <option value="art">Art</option>
                    <option value="holidays">Holidays</option>
                    <option value="sports">Sports</option>
                    <option value="hobbies">Hobbies</option>
                    <option value="business">Business</option>
                    <option value="food">Food</option>
                    <option value="charity">Charity</option>
                  </select>
                </FormField>

                <FormField label="Capacity" htmlFor="event-capacity" required>
                  <Input
                    id="event-capacity"
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={(e) => updateForm("capacity", e.target.value)}
                    placeholder="100"
                  />
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="Description" htmlFor="event-description">
                    <textarea
                      id="event-description"
                      rows={5}
                      value={form.description}
                      onChange={(e) => updateForm("description", e.target.value)}
                      placeholder="Tell attendees what to expect..."
                      className="w-full rounded-sm border border-neutral-300 bg-surface-raised px-3 py-2.5 text-neutral-900 placeholder:text-neutral-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                    />
                  </FormField>
                </div>

                <div className="md:col-span-2">
                  <FormField label="Image URL" htmlFor="event-image-url">
                    <Input
                      id="event-image-url"
                      type="url"
                      value={form.imageUrl}
                      onChange={(e) => updateForm("imageUrl", e.target.value)}
                      placeholder="https://example.com/event-cover.jpg"
                    />
                  </FormField>
                </div>
              </div>
            </section>

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

                <FormField label="Google Places Query Text" htmlFor="event-location-query" required>
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

            <section className="flex justify-end rounded-xl border border-neutral-200 bg-surface-raised p-4 shadow-soft">
              <Button type="submit">Continue (Next Chunk)</Button>
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
