import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";
import type { Database } from "../types/database.types";
import type { CreateEventRequestBody } from "../types/event.types";
import type { UpdateOrganizerEventRequestBody } from "../types/event.types";
import { addressUpToCity } from "../utils/addressDisplay";
import { searchLocationsByText } from "../utils/googlePlaces";

const EVENT_CATEGORY_SET = new Set<string>([
  "music",
  "nightlife",
  "art",
  "holidays",
  "sports",
  "hobbies",
  "business",
  "food",
  "charity",
]);

export type EventSearchListItem = {
  id: string;
  title: string;
  date: string;
  location: string;
  imageUrl?: string;
};

type LocationEmbed = {
  venue_name: string | null;
  address: string | null;
  latitude?: number | null; // adding new property to help with proximity search
  longitude?: number | null;
};

type EventSearchRow = {
  id: number;
  title: string;
  description: string | null;
  start_date_time: string | null;
  image_url: string | null;
  locations: LocationEmbed | LocationEmbed[] | null;
};

type EventSearchRowWithCategory = EventSearchRow & {
  category: string | null;
};

type ResolvedLocation = {
  type: "in-person" | "virtual";
  venueName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

type LocationInsertPayload = Database["public"]["Tables"]["locations"]["Insert"];
type EventInsertPayload = Database["public"]["Tables"]["events"]["Insert"];

async function resolveLocationForEvent(
  location: NonNullable<CreateEventRequestBody["location"]>,
): Promise<ResolvedLocation> {
  const locationType = location.type ?? "in-person";

  if (locationType === "virtual") {
    return {
      type: "virtual",
      venueName: location.venueName?.trim() || "Virtual Event",
      address: location.address?.trim() || null,
      latitude: null,
      longitude: null,
    };
  }

  const placesQuery =
    location.queryText?.trim() ||
    location.address?.trim() ||
    location.venueName?.trim() ||
    "";

  if (!placesQuery) {
    throw new Error("Missing query text for in-person location lookup");
  }

  const placesResult = await searchLocationsByText(placesQuery);
  if (!placesResult.ok) {
    throw new Error(placesResult.error);
  }

  const topPlace = placesResult.locations[0];
  if (!topPlace) {
    throw new Error("No matching location found from Google Places");
  }

  return {
    type: "in-person",
    venueName: topPlace.name,
    address: topPlace.formattedAddress,
    latitude: topPlace.latitude,
    longitude: topPlace.longitude,
  };
}

async function getOrCreateLocation(
  supabase: SupabaseClient<Database>,
  location: {
    type?: "in-person" | "virtual";
    venueName?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  },
): Promise<number | null> {
  const locationType = location.type ?? "in-person";
  const venueName = location.venueName ?? null;
  const address = location.address ?? null;

  let existingLocationQuery = supabase
    .from("locations")
    .select("id")
    .eq("type", locationType)
    .limit(1);

  existingLocationQuery = venueName
    ? existingLocationQuery.eq("venue_name", venueName)
    : existingLocationQuery.is("venue_name", null);
  existingLocationQuery = address
    ? existingLocationQuery.eq("address", address)
    : existingLocationQuery.is("address", null);

  const { data: existingLocation, error: queryError } =
    await existingLocationQuery.maybeSingle();

  if (queryError) {
    throw new Error(`Location query failed: ${queryError.message}`);
  }

  if (existingLocation) {
    return existingLocation.id;
  }

  const locationInsert: LocationInsertPayload = {
    type: locationType,
    venue_name: venueName,
    address,
    latitude: location.latitude ?? null,
    longitude: location.longitude ?? null,
  };

  const { data: createdLocation, error: insertError } = await supabase
    .from("locations")
    .insert(locationInsert)
    .select("id")
    .single();

  if (insertError?.code === "23505" && insertError.message.includes("locations_pkey")) {
    const nextLocationId = await getNextLocationId(supabase);

    const { data: retriedLocation, error: retryError } = await supabase
      .from("locations")
      .insert({
        ...locationInsert,
        id: nextLocationId,
      })
      .select("id")
      .single();

    if (retryError) {
      throw new Error(`Location insert failed: ${retryError.message}`);
    }

    return retriedLocation?.id ?? null;
  }

  if (insertError) {
    throw new Error(`Location insert failed: ${insertError.message}`);
  }

  return createdLocation?.id ?? null;
}

async function getNextLocationId(
  supabase: SupabaseClient<Database>,
): Promise<number> {
  const { data: latestLocation, error } = await supabase
    .from("locations")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Location sequence recovery failed: ${error.message}`);
  }

  return (latestLocation?.id ?? 0) + 1;
}

async function getNextEventId(
  supabase: SupabaseClient<Database>,
): Promise<number> {
  const { data: latestEvent, error } = await supabase
    .from("events")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Event sequence recovery failed: ${error.message}`);
  }

  return (latestEvent?.id ?? 0) + 1;
}

function isEventPrimaryKeyConflict(message: string, code?: string): boolean {
  if (code !== "23505") {
    return false;
  }
  return /event(s)?_pkey/i.test(message);
}

export function validateCreateEventBody(
  body: CreateEventRequestBody,
): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be a JSON object";
  }

  if (!body.title) {
    return "Missing required field: title";
  }
  if (typeof body.title !== "string" || !body.title.trim()) {
    return "Field title must be a non-empty string";
  }

  if (!body.category) {
    return "Missing required field: category";
  }
  if (typeof body.category !== "string" || !EVENT_CATEGORY_SET.has(body.category)) {
    return "Field category is invalid";
  }

  if (!body.startDateTime) {
    return "Missing required field: startDateTime";
  }
  if (typeof body.startDateTime !== "string") {
    return "Field startDateTime must be a string";
  }

  if (!body.endDateTime) {
    return "Missing required field: endDateTime";
  }
  if (typeof body.endDateTime !== "string") {
    return "Field endDateTime must be a string";
  }

  if (body.capacity === undefined || body.capacity === null) {
    return "Missing required field: capacity";
  }
  if (!Number.isFinite(body.capacity) || body.capacity <= 0) {
    return "Field capacity must be a positive number";
  }

  if (body.description !== undefined && body.description !== null && typeof body.description !== "string") {
    return "Field description must be a string";
  }

  if (body.imageUrl !== undefined && body.imageUrl !== null && typeof body.imageUrl !== "string") {
    return "Field imageUrl must be a string";
  }

  const startDate = new Date(body.startDateTime);
  const endDate = new Date(body.endDateTime);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Fields startDateTime and endDateTime must be valid ISO date strings";
  }
  if (endDate <= startDate) {
    return "Field endDateTime must be later than startDateTime";
  }

  if (body.location !== undefined) {
    if (!body.location || typeof body.location !== "object" || Array.isArray(body.location)) {
      return "Field location must be an object";
    }

    if (
      body.location.type !== undefined &&
      body.location.type !== "in-person" &&
      body.location.type !== "virtual"
    ) {
      return "Field location.type must be either in-person or virtual";
    }

    if (body.location.queryText !== undefined && typeof body.location.queryText !== "string") {
      return "Field location.queryText must be a string";
    }

    if (body.location.venueName !== undefined && typeof body.location.venueName !== "string") {
      return "Field location.venueName must be a string";
    }

    if (body.location.address !== undefined && typeof body.location.address !== "string") {
      return "Field location.address must be a string";
    }

    if (body.location.latitude !== undefined && !Number.isFinite(body.location.latitude)) {
      return "Field location.latitude must be a number";
    }

    if (body.location.longitude !== undefined && !Number.isFinite(body.location.longitude)) {
      return "Field location.longitude must be a number";
    }

    if ((body.location.type ?? "in-person") === "in-person") {
      const hasLookupText =
        typeof body.location.queryText === "string" && body.location.queryText.trim().length > 0;
      const hasFallbackAddress =
        typeof body.location.address === "string" && body.location.address.trim().length > 0;
      const hasFallbackVenue =
        typeof body.location.venueName === "string" && body.location.venueName.trim().length > 0;

      if (!hasLookupText && !hasFallbackAddress && !hasFallbackVenue) {
        return "Field location requires queryText, address, or venueName for in-person events";
      }
    }
  }

  return null;
}

function normalizeLocationEmbed(
  loc: EventSearchRow["locations"],
): LocationEmbed | null {
  if (loc == null) {
    return null;
  }
  return Array.isArray(loc) ? (loc[0] ?? null) : loc;
}

function formatEventListDate(iso: string | null): string {
  if (!iso) {
    return "Date TBA";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "Date TBA";
  }
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEventListLocation(loc: LocationEmbed | null): string {
  if (!loc) {
    return "Location TBA";
  }
  const venue = loc.venue_name?.trim();
  const raw = loc.address?.trim();
  const addr = raw ? addressUpToCity(raw) : "";
  const parts = [venue, addr].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(", ") : "Location TBA";
}

function milesBetween(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

export async function searchApprovedEvents(
  q: string,
  loc: string,
  category?: string,
): Promise<
  { ok: true; events: EventSearchListItem[] } | { ok: false; error: string }
> {
  const supabase = getSupabaseClient();

  let listQuery = supabase
    .from("events")
    .select(
      `
      id,
      title,
      description,
      start_date_time,
      image_url,
      locations ( venue_name, address, latitude, longitude )
    `,
    )
    .eq("approval_status", "approved");

  if (category) {
    listQuery = listQuery.eq(
      "category",
      category as Database["public"]["Enums"]["event_category"],
    );
  }

  const { data, error } = await listQuery.order("start_date_time", {
    ascending: true,
    nullsFirst: false,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  let rows = (data ?? []) as EventSearchRow[];

  if (q) {
    rows = rows.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description?.toLowerCase().includes(q) ?? false),
    );
  }

  if (loc) {
    const normalizedLoc = loc.trim().toLowerCase();
    const placesSearchResponse = await searchLocationsByText(loc);

    if (placesSearchResponse.ok) {
      const referencePlace = placesSearchResponse.locations[0];

      if (referencePlace) {
        const refLat = referencePlace.latitude;
        const refLng = referencePlace.longitude;

        if (typeof refLat !== "number" || typeof refLng !== "number") {
          // If reference location is invalid, return no results (or skip filtering)
          rows = [];
        } else {
          rows = rows.filter((e) => {
            const l = normalizeLocationEmbed(e.locations);
            if (!l) return false;

            const eventLat = l.latitude;
            const eventLng = l.longitude;

            if (typeof eventLat !== "number" || typeof eventLng !== "number") {
              return false;
            }

            const distanceMiles = milesBetween(
              refLat,
              refLng,
              eventLat,
              eventLng,
            );

            return distanceMiles <= 50; // Hardcoded, lmk if you want this adjustable.
          });
        }
      } else {
        rows = [];
      }
    } else {
      // fallback to text matching if place lookup fails
      rows = rows.filter((e) => {
        const l = normalizeLocationEmbed(e.locations);
        if (!l) {
          return false;
        }
        const vn = l.venue_name?.toLowerCase() ?? "";
        const ad = l.address?.toLowerCase() ?? "";
        return vn.includes(normalizedLoc) || ad.includes(normalizedLoc);
      });
    }
  }

  const events: EventSearchListItem[] = rows.map((row) => ({
    id: String(row.id),
    title: row.title,
    date: formatEventListDate(row.start_date_time),
    location: formatEventListLocation(normalizeLocationEmbed(row.locations)),
    imageUrl: row.image_url ?? undefined,
  }));

  return { ok: true, events };
}

/** Up to 4 other approved events; prefers same `category` when provided. */
export async function getRelatedApprovedEvents(
  excludeEventId: number,
  preferCategory: string | null,
): Promise<
  { ok: true; events: EventSearchListItem[] } | { ok: false; error: string }
> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("events")
    .select(
      `
        id,
        title,
        description,
        start_date_time,
        image_url,
        category,
        locations ( venue_name, address )
      `,
    )
    .eq("approval_status", "approved")
    .neq("id", excludeEventId)
    .order("start_date_time", { ascending: true, nullsFirst: false })
    .limit(48);

  if (error) {
    return { ok: false, error: error.message };
  }

  const rows = (data ?? []) as EventSearchRowWithCategory[];

  const sorted = preferCategory
    ? [...rows].sort((a, b) => {
        const aMatch = a.category === preferCategory ? 0 : 1;
        const bMatch = b.category === preferCategory ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
        const ta = a.start_date_time
          ? new Date(a.start_date_time).getTime()
          : 0;
        const tb = b.start_date_time
          ? new Date(b.start_date_time).getTime()
          : 0;
        return ta - tb;
      })
    : rows;

  const picked = sorted.slice(0, 4);

  const events: EventSearchListItem[] = picked.map((row) => ({
    id: String(row.id),
    title: row.title,
    date: formatEventListDate(row.start_date_time),
    location: formatEventListLocation(normalizeLocationEmbed(row.locations)),
    imageUrl: row.image_url ?? undefined,
  }));

  return { ok: true, events };
}

export async function createEventForOrganizer(
  body: CreateEventRequestBody,
  organizerId: string,
): Promise<{ ok: true; event: unknown } | { ok: false; error: string }> {
  const validationError = validateCreateEventBody(body);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const supabase = getSupabaseClient();
  let locationId: number | null = null;

  if (body.location) {
    try {
      const resolvedLocation = await resolveLocationForEvent(body.location);
      locationId = await getOrCreateLocation(supabase, resolvedLocation);
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Location operation failed",
      };
    }
  }

  const eventRecord: EventInsertPayload = {
    title: body.title as string,
    description: body.description ?? null,
    category: body.category as Database["public"]["Enums"]["event_category"],
    start_date_time: body.startDateTime as string,
    end_date_time: body.endDateTime as string,
    capacity: body.capacity as number,
    image_url: body.imageUrl ?? null,
    location_id: locationId,
    organizer_id: organizerId,
    approval_status: "pending",
    rsvp_count: 0,
  };

  const { data: createdEvent, error: eventError } = await supabase
    .from("events")
    .insert(eventRecord)
    .select("*")
    .single();

  if (eventError && isEventPrimaryKeyConflict(eventError.message, eventError.code)) {
    try {
      const nextEventId = await getNextEventId(supabase);

      const { data: retriedEvent, error: retryError } = await supabase
        .from("events")
        .insert({
          ...eventRecord,
          id: nextEventId,
        })
        .select("*")
        .single();

      if (retryError) {
        return {
          ok: false,
          error: `Event creation failed: ${retryError.message}`,
        };
      }

      return { ok: true, event: retriedEvent };
    } catch (recoveryError) {
      return {
        ok: false,
        error: recoveryError instanceof Error
          ? `Event creation failed: ${recoveryError.message}`
          : "Event creation failed: sequence recovery failed",
      };
    }
  }

  if (eventError) {
    return {
      ok: false,
      error: `Event creation failed: ${eventError.message}`,
    };
  }

  return { ok: true, event: createdEvent };
}

export async function getEventById(eventId: number) {
  if (!Number.isFinite(eventId) || eventId <= 0) {
    return { ok: false, error: "Event not found" };
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("events")
    .select(
      `
        id,
        title,
        description,
        start_date_time,
        end_date_time,
        image_url,
        category,
        capacity,
        rsvp_count,
        locations ( venue_name, address, latitude, longitude ),
        organizer:users!events_organizer_id_fkey ( id, display_name )
      `,
    )
    .eq("id", eventId)
    .eq("approval_status", "approved")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: "Event not found" };
  }

  return { ok: true, event: data };
}

type OrganizerEventDetail = {
  id: number;
  title: string;
  start_date_time: string | null;
  end_date_time: string | null;
  capacity: number | null;
  rsvp_count: number | null;
  approval_status: Database["public"]["Enums"]["event_approval_status"] | null;
  locations: {
    id: number;
    type: Database["public"]["Enums"]["location_type"] | null;
    venue_name: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
};

type ServiceFail = { ok: false; error: string; status: 400 | 403 | 404 | 409 | 500 };

type OrganizerAttendeeUser = {
  id: string;
  display_name: string;
  email: string;
};

type OrganizerAttendeeRow = {
  id: number;
  event_id: number;
  customer_id: string | null;
  created_at: string;
  rsvp_status: Database["public"]["Enums"]["ticket_rsvp_status"] | null;
  users: OrganizerAttendeeUser | OrganizerAttendeeUser[] | null;
};

export type OrganizerEventAttendee = {
  ticketId: string;
  customerId: string | null;
  displayName: string;
  email: string;
  createdAt: string;
  rsvpStatus: Database["public"]["Enums"]["ticket_rsvp_status"] | null;
};

function normalizeOrganizerAttendeeUser(
  user: OrganizerAttendeeRow["users"],
): OrganizerAttendeeUser | null {
  if (user == null) {
    return null;
  }

  return Array.isArray(user) ? (user[0] ?? null) : user;
}

function parseOptionalIsoDateTime(raw: unknown): { ok: true; value?: string } | { ok: false; error: string } {
  if (raw === undefined) {
    return { ok: true };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: "Date/time must be an ISO string" };
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Date/time cannot be empty" };
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: "Invalid ISO date/time" };
  }
  return { ok: true, value: d.toISOString() };
}

function validateUpdateOrganizerEventBody(body: UpdateOrganizerEventRequestBody): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be a JSON object";
  }

  const hasAny =
    body.startDateTime !== undefined ||
    body.endDateTime !== undefined ||
    body.capacity !== undefined ||
    body.location !== undefined;
  if (!hasAny) {
    return "Request body must include at least one field to update";
  }

  if (body.capacity !== undefined) {
    if (!Number.isFinite(body.capacity) || body.capacity <= 0) {
      return "Field capacity must be a positive number";
    }
  }

  if (body.location !== undefined && body.location !== null) {
    if (typeof body.location !== "object" || Array.isArray(body.location)) {
      return "Field location must be an object or null";
    }
    if (
      body.location.type !== undefined &&
      body.location.type !== "in-person" &&
      body.location.type !== "virtual"
    ) {
      return "Field location.type must be either in-person or virtual";
    }
    if (body.location.queryText !== undefined && typeof body.location.queryText !== "string") {
      return "Field location.queryText must be a string";
    }
    if (body.location.venueName !== undefined && typeof body.location.venueName !== "string") {
      return "Field location.venueName must be a string";
    }
    if (body.location.address !== undefined && typeof body.location.address !== "string") {
      return "Field location.address must be a string";
    }
    if (body.location.latitude !== undefined && !Number.isFinite(body.location.latitude)) {
      return "Field location.latitude must be a number";
    }
    if (body.location.longitude !== undefined && !Number.isFinite(body.location.longitude)) {
      return "Field location.longitude must be a number";
    }

    if ((body.location.type ?? "in-person") === "in-person") {
      const hasLookupText =
        typeof body.location.queryText === "string" && body.location.queryText.trim().length > 0;
      const hasFallbackAddress =
        typeof body.location.address === "string" && body.location.address.trim().length > 0;
      const hasFallbackVenue =
        typeof body.location.venueName === "string" && body.location.venueName.trim().length > 0;
      if (!hasLookupText && !hasFallbackAddress && !hasFallbackVenue) {
        return "Field location requires queryText, address, or venueName for in-person events";
      }
    }
  }

  if (body.startDateTime !== undefined) {
    const parsed = parseOptionalIsoDateTime(body.startDateTime);
    if (!parsed.ok) return parsed.error;
  }
  if (body.endDateTime !== undefined) {
    const parsed = parseOptionalIsoDateTime(body.endDateTime);
    if (!parsed.ok) return parsed.error;
  }

  return null;
}

export async function getEventForOrganizer(
  eventId: number,
  organizerId: string,
): Promise<{ ok: true; event: OrganizerEventDetail } | ServiceFail> {
  if (!Number.isFinite(eventId) || eventId <= 0) {
    return { ok: false, error: "Invalid event id", status: 400 };
  }
  if (!organizerId?.trim()) {
    return { ok: false, error: "Missing organizer id", status: 400 };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      `
        id,
        title,
        start_date_time,
        end_date_time,
        capacity,
        rsvp_count,
        approval_status,
        locations:locations ( id, type, venue_name, address, latitude, longitude )
      `,
    )
    .eq("id", eventId)
    .eq("organizer_id", organizerId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }
  if (!data) {
    return { ok: false, error: "Event not found", status: 404 };
  }

  const row = data as unknown as OrganizerEventDetail & { locations: OrganizerEventDetail["locations"] | OrganizerEventDetail["locations"][] | null };
  const loc = Array.isArray(row.locations) ? (row.locations[0] ?? null) : row.locations;

  return {
    ok: true,
    event: {
      ...row,
      locations: loc,
    },
  };
}

export async function getOrganizerEventAttendees(
  eventId: number,
  organizerId: string,
): Promise<
  | { ok: true; event: OrganizerEventDetail; attendees: OrganizerEventAttendee[] }
  | ServiceFail
> {
  const eventResult = await getEventForOrganizer(eventId, organizerId);
  if (!eventResult.ok) {
    return eventResult;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(
      `
        id,
        event_id,
        customer_id,
        created_at,
        rsvp_status,
        users ( id, display_name, email )
      `,
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  const rows = (data ?? []) as OrganizerAttendeeRow[];
  const attendees: OrganizerEventAttendee[] = rows.map((row) => {
    const user = normalizeOrganizerAttendeeUser(row.users);
    return {
      ticketId: String(row.id),
      customerId: row.customer_id,
      displayName: user?.display_name?.trim() || "Unknown attendee",
      email: user?.email?.trim() || "",
      createdAt: row.created_at,
      rsvpStatus: row.rsvp_status,
    };
  });

  return {
    ok: true,
    event: eventResult.event,
    attendees,
  };
}

export async function removeOrganizerEventAttendee(
  eventId: number,
  organizerId: string,
  ticketId: number,
): Promise<{ ok: true } | ServiceFail> {
  if (!Number.isFinite(ticketId) || ticketId <= 0) {
    return { ok: false, error: "Invalid ticket id", status: 400 };
  }

  const eventResult = await getEventForOrganizer(eventId, organizerId);
  if (!eventResult.ok) {
    return eventResult;
  }

  const supabase = getSupabaseClient();
  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("id, event_id, rsvp_status")
    .eq("id", ticketId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }
  if (!ticket) {
    return { ok: false, error: "Attendee not found", status: 404 };
  }
  if (ticket.rsvp_status === "canceled") {
    return { ok: true };
  }
  if (ticket.rsvp_status !== "pending" && ticket.rsvp_status !== "confirmed") {
    return {
      ok: false,
      error: "Only pending or confirmed attendees can be removed",
      status: 409,
    };
  }

  const nextCount = Math.max(0, (eventResult.event.rsvp_count ?? 0) - 1);

  const { error: ticketUpdateError } = await supabase
    .from("tickets")
    .update({ rsvp_status: "canceled" })
    .eq("id", ticketId)
    .eq("event_id", eventId);

  if (ticketUpdateError) {
    return { ok: false, error: ticketUpdateError.message, status: 500 };
  }

  const { error: eventUpdateError } = await supabase
    .from("events")
    .update({ rsvp_count: nextCount })
    .eq("id", eventId)
    .eq("organizer_id", organizerId);

  if (eventUpdateError) {
    return { ok: false, error: eventUpdateError.message, status: 500 };
  }

  return { ok: true };
}

export async function updateEventForOrganizer(
  eventId: number,
  organizerId: string,
  body: UpdateOrganizerEventRequestBody,
): Promise<{ ok: true; event: unknown } | ServiceFail> {
  const validationError = validateUpdateOrganizerEventBody(body);
  if (validationError) {
    return { ok: false, error: validationError, status: 400 };
  }

  const supabase = getSupabaseClient();

  const existingResult = await getEventForOrganizer(eventId, organizerId);
  if (!existingResult.ok) {
    return existingResult;
  }

  const existing = existingResult.event;
  const existingStart = existing.start_date_time;
  const existingEnd = existing.end_date_time;

  const startParsed = body.startDateTime !== undefined ? parseOptionalIsoDateTime(body.startDateTime) : { ok: true as const, value: undefined as string | undefined };
  if (!startParsed.ok) return { ok: false, error: startParsed.error, status: 400 };
  const endParsed = body.endDateTime !== undefined ? parseOptionalIsoDateTime(body.endDateTime) : { ok: true as const, value: undefined as string | undefined };
  if (!endParsed.ok) return { ok: false, error: endParsed.error, status: 400 };

  const nextStart = startParsed.value ?? (existingStart ? new Date(existingStart).toISOString() : undefined);
  const nextEnd = endParsed.value ?? (existingEnd ? new Date(existingEnd).toISOString() : undefined);
  if (nextStart && nextEnd) {
    if (new Date(nextEnd) <= new Date(nextStart)) {
      return { ok: false, error: "endDateTime must be later than startDateTime", status: 400 };
    }
  }

  if (body.capacity !== undefined) {
    const sold = existing.rsvp_count ?? 0;
    if (body.capacity < sold) {
      return { ok: false, error: `capacity cannot be less than current RSVPs (${sold})`, status: 400 };
    }
  }

  let nextLocationId: number | null | undefined = undefined;
  if (body.location !== undefined) {
    if (body.location === null) {
      nextLocationId = null;
    } else {
      try {
        const resolvedLocation = await resolveLocationForEvent(body.location);
        nextLocationId = await getOrCreateLocation(supabase, resolvedLocation);
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Location operation failed", status: 400 };
      }
    }
  }

  const updatePayload: Database["public"]["Tables"]["events"]["Update"] = {};
  if (nextStart) updatePayload.start_date_time = nextStart;
  if (nextEnd) updatePayload.end_date_time = nextEnd;
  if (body.capacity !== undefined) updatePayload.capacity = body.capacity;
  if (nextLocationId !== undefined) updatePayload.location_id = nextLocationId;

  const { data: updated, error } = await supabase
    .from("events")
    .update(updatePayload)
    .eq("id", eventId)
    .eq("organizer_id", organizerId)
    .select(
      `
        id,
        title,
        start_date_time,
        end_date_time,
        capacity,
        rsvp_count,
        approval_status,
        locations:locations ( id, type, venue_name, address, latitude, longitude )
      `,
    )
    .single();

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  return { ok: true, event: updated };
}
