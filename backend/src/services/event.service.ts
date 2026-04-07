import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase";
import type { Database } from "../types/database.types";
import type { CreateEventRequestBody } from "../types/event.types";

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

async function getOrCreateLocation(
  supabase: SupabaseClient<Database>,
  location: {
    type?: "in-person" | "virtual";
    venueName?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  },
): Promise<number | null> {
  const locationType = location.type ?? "in-person";
  const venueName = location.venueName ?? null;
  const address = location.address ?? null;

  if (venueName && address) {
    const { data: existingLocation, error: queryError } = await supabase
      .from("locations")
      .select("id")
      .eq("type", locationType)
      .eq("venue_name", venueName)
      .eq("address", address)
      .single();

    if (existingLocation) {
      return existingLocation.id;
    }

    if (queryError?.code !== "PGRST116") {
      if (queryError) {
        throw new Error(`Location query failed: ${queryError.message}`);
      }
    }
  }

  const { data: createdLocation, error: insertError } = await supabase
    .from("locations")
    .insert({
      type: locationType,
      venue_name: venueName,
      address: address,
      latitutde: location.latitude ?? null,
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
  const parts = [loc.venue_name, loc.address].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(", ") : "Location TBA";
}

export async function searchApprovedEvents(
  q: string,
  loc: string,
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
        locations ( venue_name, address )
      `,
    )
    .eq("approval_status", "approved")
    .order("start_date_time", { ascending: true, nullsFirst: false });

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
      locationId = await getOrCreateLocation(supabase, body.location);
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
        locations ( venue_name, address )
      `,
    )
    .eq("id", eventId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, event: data };
}
