import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";
import type { Database } from "../types/database.types";
import type { CreateEventRequestBody } from "../types/event.types";
import { addressUpToCity } from "../utils/addressDisplay";
import { searchLocationsByText } from "../utils/googlePlaces";

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

  const { data: createdLocation, error: insertError } = await supabase
    .from("locations")
    .insert({
      type: locationType,
      venue_name: venueName,
      address: address,
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
    } as any)
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`Location insert failed: ${insertError.message}`);
  }

  return createdLocation?.id ?? null;
}

export function validateCreateEventBody(
  body: CreateEventRequestBody,
): string | null {
  if (!body.title) {
    return "Missing required field: title";
  }
  if (!body.category) {
    return "Missing required field: category";
  }
  if (!body.startDateTime) {
    return "Missing required field: startDateTime";
  }
  if (!body.endDateTime) {
    return "Missing required field: endDateTime";
  }
  if (body.capacity === undefined || body.capacity === null) {
    return "Missing required field: capacity";
  }
  if (typeof body.capacity !== "number" || body.capacity <= 0) {
    return "Field capacity must be a positive number";
  }

  const startDate = new Date(body.startDateTime);
  const endDate = new Date(body.endDateTime);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Fields startDateTime and endDateTime must be valid ISO date strings";
  }
  if (endDate <= startDate) {
    return "Field endDateTime must be later than startDateTime";
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
