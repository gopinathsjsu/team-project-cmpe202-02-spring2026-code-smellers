import type { Database } from "../types/database.types";
import { getSupabaseClientForUserAccessToken } from "../lib/supabase";
import { addressUpToCity } from "../utils/addressDisplay";

type LocationEmbed = {
  venue_name: string | null;
  address: string | null;
};

type EventEmbed = {
  id: number;
  title: string;
  start_date_time: string | null;
  image_url: string | null;
  approval_status: Database["public"]["Enums"]["event_approval_status"] | null;
  locations: LocationEmbed | LocationEmbed[] | null;
};

type SavedRowWithEvent = {
  created_at: string;
  event_id: number;
  events: EventEmbed | EventEmbed[] | null;
};

function eventFromRow(row: SavedRowWithEvent): EventEmbed | null {
  const ev = row.events;
  if (ev == null) {
    return null;
  }
  return Array.isArray(ev) ? (ev[0] ?? null) : ev;
}

export type MySavedListItem = {
  eventId: string;
  title: string;
  date: string;
  location: string;
  imageUrl?: string;
};

function normalizeLocationEmbed(
  loc: LocationEmbed | LocationEmbed[] | null | undefined,
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

export async function listMySavedEvents(
  accessToken: string,
  userId: string,
): Promise<{ ok: true; events: MySavedListItem[] } | { ok: false; error: string; status: 401 | 500 }> {
  if (!accessToken) {
    return { ok: false, error: "Missing access token", status: 401 };
  }

  try {
    const supabase = getSupabaseClientForUserAccessToken(accessToken);

    const { data, error } = await supabase
      .from("saved_events")
      .select(
        `
        created_at,
        event_id,
        events (
          id,
          title,
          start_date_time,
          image_url,
          approval_status,
          locations ( venue_name, address )
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return { ok: false, error: error.message, status: 500 };
    }

    const rows = (data ?? []) as SavedRowWithEvent[];
    const events: MySavedListItem[] = [];

    for (const row of rows) {
      const ev = eventFromRow(row);
      if (!ev || ev.approval_status !== "approved") {
        continue;
      }
      const loc = normalizeLocationEmbed(ev.locations ?? null);
      const item: MySavedListItem = {
        eventId: String(ev.id),
        title: ev.title,
        date: formatEventListDate(ev.start_date_time),
        location: formatEventListLocation(loc),
      };
      if (ev.image_url) {
        item.imageUrl = ev.image_url;
      }
      events.push(item);
    }

    return { ok: true, events };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error",
      status: 500,
    };
  }
}

function parseEventIdParam(raw: string): number | null {
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 1) {
    return null;
  }
  return n;
}

export async function addMySavedEvent(
  accessToken: string,
  userId: string,
  eventIdParam: string,
): Promise<{ ok: true } | { ok: false; error: string; status: 400 | 401 | 404 | 500 }> {
  if (!accessToken) {
    return { ok: false, error: "Missing access token", status: 401 };
  }

  const eventId = parseEventIdParam(eventIdParam);
  if (eventId == null) {
    return { ok: false, error: "Invalid event id", status: 400 };
  }

  try {
    const supabase = getSupabaseClientForUserAccessToken(accessToken);

    const { data: evRow, error: evErr } = await supabase
      .from("events")
      .select("id, approval_status")
      .eq("id", eventId)
      .maybeSingle();

    if (evErr) {
      return { ok: false, error: evErr.message, status: 500 };
    }
    if (!evRow || evRow.approval_status !== "approved") {
      return { ok: false, error: "Event not found", status: 404 };
    }

    const { error: insErr } = await supabase.from("saved_events").insert({
      user_id: userId,
      event_id: eventId,
    });

    if (insErr) {
      if (insErr.code === "23505") {
        return { ok: true };
      }
      return { ok: false, error: insErr.message, status: 500 };
    }

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error",
      status: 500,
    };
  }
}

export async function removeMySavedEvent(
  accessToken: string,
  userId: string,
  eventIdParam: string,
): Promise<{ ok: true } | { ok: false; error: string; status: 400 | 401 | 404 | 500 }> {
  if (!accessToken) {
    return { ok: false, error: "Missing access token", status: 401 };
  }

  const eventId = parseEventIdParam(eventIdParam);
  if (eventId == null) {
    return { ok: false, error: "Invalid event id", status: 400 };
  }

  try {
    const supabase = getSupabaseClientForUserAccessToken(accessToken);

    const { data, error } = await supabase
      .from("saved_events")
      .delete()
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .select("event_id");

    if (error) {
      return { ok: false, error: error.message, status: 500 };
    }
    if (!data?.length) {
      return { ok: false, error: "Saved event not found", status: 404 };
    }

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error",
      status: 500,
    };
  }
}
