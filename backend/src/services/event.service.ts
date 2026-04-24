import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";
import type { Database } from "../types/database.types";
import type { CreateEventRequestBody } from "../types/event.types";
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
    latitutde: location.latitude ?? null,
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

export async function searchApprovedEvents(
  q: string,
  loc: string,
  category?: string,
): Promise<{ ok: true; events: EventSearchListItem[] } | { ok: false; error: string }> {
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
        locations ( venue_name, address )
      `,
    )
    .eq("approval_status", "approved");

  if (category) {
    listQuery = listQuery.eq("category", category as Database["public"]["Enums"]["event_category"]);
  }

  const { data, error } = await listQuery.order("start_date_time", { ascending: true, nullsFirst: false });

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
    rows = rows.filter((e) => {
      const l = normalizeLocationEmbed(e.locations);
      if (!l) {
        return false;
      }
      const vn = l.venue_name?.toLowerCase() ?? "";
      const ad = l.address?.toLowerCase() ?? "";
      return vn.includes(loc) || ad.includes(loc);
    });
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
): Promise<{ ok: true; events: EventSearchListItem[] } | { ok: false; error: string }> {
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
        const ta = a.start_date_time ? new Date(a.start_date_time).getTime() : 0;
        const tb = b.start_date_time ? new Date(b.start_date_time).getTime() : 0;
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
): Promise<
  | { ok: true; event: unknown }
  | { ok: false; error: string }
> {
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

  const eventRecord = {
    title: body.title as string,
    description: body.description ?? null,
    category: body.category as string,
    start_date_time: body.startDateTime as string,
    end_date_time: body.endDateTime as string,
    capacity: body.capacity as number,
    image_url: body.imageUrl ?? null,
    location_id: locationId,
    organizer_id: organizerId,
    approval_status: "pending",
    rsvp_count: 0,
  } as any;

  const { data: createdEvent, error: eventError } = await supabase
    .from("events")
    .insert(eventRecord)
    .select("*")
    .single();

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
        locations ( venue_name, address, latitutde, longitude ),
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
