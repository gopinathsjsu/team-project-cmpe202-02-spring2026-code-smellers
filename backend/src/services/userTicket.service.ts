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
  locations: LocationEmbed | LocationEmbed[] | null;
};

type TicketWithEventRow = {
  id: number;
  event_id: number;
  rsvp_status: Database["public"]["Enums"]["ticket_rsvp_status"] | null;
  events: EventEmbed | EventEmbed[] | null;
};

function eventFromRow(row: TicketWithEventRow): EventEmbed | null {
  const ev = row.events;
  if (ev == null) {
    return null;
  }
  return Array.isArray(ev) ? (ev[0] ?? null) : ev;
}

export type MyTicketListItem = {
  ticketId: number;
  eventId: string;
  title: string;
  date: string;
  location: string;
  imageUrl?: string;
  rsvpStatus: Database["public"]["Enums"]["ticket_rsvp_status"];
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

/**
 * Tickets for the authenticated user: `pending` or `confirmed`, event start in the future.
 */
export async function listMyUpcomingTickets(
  accessToken: string,
  customerId: string,
): Promise<
  { ok: true; tickets: MyTicketListItem[] } | { ok: false; error: string; status: 401 | 500 }
> {
  if (!accessToken) {
    return { ok: false, error: "Missing access token", status: 401 };
  }

  try {
    const supabase = getSupabaseClientForUserAccessToken(accessToken);

    const { data, error } = await supabase
      .from("tickets")
      .select(
        `
        id,
        event_id,
        rsvp_status,
        events (
          id,
          title,
          start_date_time,
          image_url,
          locations ( venue_name, address )
        )
      `,
      )
      .eq("customer_id", customerId)
      .in("rsvp_status", ["pending", "confirmed"]);

    if (error) {
      return { ok: false, error: error.message, status: 500 };
    }

    const now = Date.now();
    const rows = (data ?? []) as TicketWithEventRow[];

    const upcoming = rows
      .filter((row) => {
        const ev = eventFromRow(row);
        if (!ev) {
          return false;
        }
        const iso = ev.start_date_time;
        if (!iso) {
          return true;
        }
        const t = new Date(iso).getTime();
        if (Number.isNaN(t)) {
          return true;
        }
        return t > now;
      })
      .sort((a, b) => {
        const evA = eventFromRow(a);
        const evB = eventFromRow(b);
        const ta = evA?.start_date_time ? new Date(evA.start_date_time).getTime() : 0;
        const tb = evB?.start_date_time ? new Date(evB.start_date_time).getTime() : 0;
        return ta - tb;
      });

    const tickets: MyTicketListItem[] = [];
    for (const row of upcoming) {
      const ev = eventFromRow(row);
      if (!ev) {
        continue;
      }
      const status = row.rsvp_status;
      if (status == null || (status !== "pending" && status !== "confirmed")) {
        continue;
      }
      const loc = normalizeLocationEmbed(ev.locations ?? null);
      const item: MyTicketListItem = {
        ticketId: row.id,
        eventId: String(ev.id),
        title: ev.title,
        date: formatEventListDate(ev.start_date_time),
        location: formatEventListLocation(loc),
        rsvpStatus: status,
      };
      if (ev.image_url) {
        item.imageUrl = ev.image_url;
      }
      tickets.push(item);
    }

    return { ok: true, tickets };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error",
      status: 500,
    };
  }
}

/**
 * Tickets for events that have already started (`start_date_time <= now`).
 * Includes `pending`, `confirmed`, `attended`, and `canceled` RSVPs (canceled still shows in history after the event time).
 */
export async function listMyPastTickets(
  accessToken: string,
  customerId: string,
): Promise<
  { ok: true; tickets: MyTicketListItem[] } | { ok: false; error: string; status: 401 | 500 }
> {
  if (!accessToken) {
    return { ok: false, error: "Missing access token", status: 401 };
  }

  try {
    const supabase = getSupabaseClientForUserAccessToken(accessToken);

    const { data, error } = await supabase
      .from("tickets")
      .select(
        `
        id,
        event_id,
        rsvp_status,
        events (
          id,
          title,
          start_date_time,
          image_url,
          locations ( venue_name, address )
        )
      `,
      )
      .eq("customer_id", customerId)
      .in("rsvp_status", ["pending", "confirmed", "attended", "canceled"]);

    if (error) {
      return { ok: false, error: error.message, status: 500 };
    }

    const now = Date.now();
    const rows = (data ?? []) as TicketWithEventRow[];

    const past = rows
      .filter((row) => {
        const ev = eventFromRow(row);
        if (!ev?.start_date_time) {
          return false;
        }
        const t = new Date(ev.start_date_time).getTime();
        if (Number.isNaN(t) || t > now) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const evA = eventFromRow(a);
        const evB = eventFromRow(b);
        const ta = evA?.start_date_time ? new Date(evA.start_date_time).getTime() : 0;
        const tb = evB?.start_date_time ? new Date(evB.start_date_time).getTime() : 0;
        return tb - ta;
      });

    const tickets: MyTicketListItem[] = [];
    for (const row of past) {
      const ev = eventFromRow(row);
      if (!ev) {
        continue;
      }
      const status = row.rsvp_status;
      if (
        status == null ||
        (status !== "pending" &&
          status !== "confirmed" &&
          status !== "attended" &&
          status !== "canceled")
      ) {
        continue;
      }
      const loc = normalizeLocationEmbed(ev.locations ?? null);
      const item: MyTicketListItem = {
        ticketId: row.id,
        eventId: String(ev.id),
        title: ev.title,
        date: formatEventListDate(ev.start_date_time),
        location: formatEventListLocation(loc),
        rsvpStatus: status,
      };
      if (ev.image_url) {
        item.imageUrl = ev.image_url;
      }
      tickets.push(item);
    }

    return { ok: true, tickets };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error",
      status: 500,
    };
  }
}

type RsvpResult =
  | { ok: true; ticket: Database["public"]["Tables"]["tickets"]["Row"] }
  | { ok: false; error: string; status: 400 | 401 | 403 | 404 | 409 | 500 };

type EventCapacityRow = {
  id: number;
  approval_status: Database["public"]["Enums"]["event_approval_status"] | null;
  capacity: number | null;
  rsvp_count: number | null;
};

async function getApprovedEventForRsvp(
  supabase: ReturnType<typeof getSupabaseClientForUserAccessToken>,
  eventId: number,
): Promise<{ ok: true; event: EventCapacityRow } | { ok: false; error: string; status: 404 | 500 }> {
  const { data, error } = await supabase
    .from("events")
    .select("id, approval_status, capacity, rsvp_count")
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }
  if (!data || data.approval_status !== "approved") {
    return { ok: false, error: "Event not found", status: 404 };
  }

  return { ok: true, event: data as EventCapacityRow };
}

async function getNextTicketId(
  supabase: ReturnType<typeof getSupabaseClientForUserAccessToken>,
): Promise<number> {
  const { data: latestTicket, error } = await supabase
    .from("tickets")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Ticket sequence recovery failed: ${error.message}`);
  }

  return (latestTicket?.id ?? 0) + 1;
}

function isTicketPrimaryKeyConflict(message: string, code?: string): boolean {
  if (code !== "23505") {
    return false;
  }
  return /tickets_pkey/i.test(message);
}

/**
 * Create an RSVP "ticket" for an approved event.
 * - Creates a `tickets` row with `rsvp_status = pending` if no active ticket exists.
 * - Enforces capacity based on `events.capacity` and `events.rsvp_count`.
 * - Best-effort increments `events.rsvp_count` using an optimistic concurrency update.
 */
export async function rsvpForEvent(
  accessToken: string,
  customerId: string,
  eventId: number,
): Promise<RsvpResult> {
  if (!accessToken) {
    return { ok: false, error: "Missing access token", status: 401 };
  }
  if (!customerId?.trim()) {
    return { ok: false, error: "Missing customer id", status: 400 };
  }
  if (!Number.isFinite(eventId) || eventId <= 0) {
    return { ok: false, error: "Invalid event id", status: 400 };
  }

  try {
    const supabase = getSupabaseClientForUserAccessToken(accessToken);

    const evRes = await getApprovedEventForRsvp(supabase, eventId);
    if (!evRes.ok) {
      return evRes;
    }

    const capacity = evRes.event.capacity ?? null;
    const existingCount = evRes.event.rsvp_count ?? 0;
    if (capacity !== null && existingCount >= capacity) {
      return { ok: false, error: "Event is at capacity", status: 409 };
    }

    // Prevent duplicate "active" RSVPs (pending/confirmed)
    const { data: existingTicket, error: existingErr } = await supabase
      .from("tickets")
      .select("*")
      .eq("customer_id", customerId)
      .eq("event_id", eventId)
      .in("rsvp_status", ["pending", "confirmed"])
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingErr) {
      return { ok: false, error: existingErr.message, status: 500 };
    }
    if (existingTicket) {
      return { ok: true, ticket: existingTicket as Database["public"]["Tables"]["tickets"]["Row"] };
    }

    const ticketInsert = {
      customer_id: customerId,
      event_id: eventId,
      rsvp_status: "pending" as const,
      is_email_sent: false,
    };

    let createdTicket: Database["public"]["Tables"]["tickets"]["Row"] | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const { data, error: insertErr } = await supabase
        .from("tickets")
        .insert(attempt === 0 ? ticketInsert : { ...ticketInsert, id: await getNextTicketId(supabase) })
        .select("*")
        .single();

      if (insertErr) {
        if (attempt === 0 && isTicketPrimaryKeyConflict(insertErr.message, insertErr.code)) {
          continue;
        }
        return { ok: false, error: insertErr.message, status: 500 };
      }

      createdTicket = data as Database["public"]["Tables"]["tickets"]["Row"];
      break;
    }

    if (!createdTicket) {
      return { ok: false, error: "Ticket creation failed: sequence recovery failed", status: 500 };
    }

    // Best-effort increment rsvp_count with optimistic concurrency (retry a few times)
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const evRetry = await getApprovedEventForRsvp(supabase, eventId);
      if (!evRetry.ok) {
        break;
      }
      const current = evRetry.event.rsvp_count ?? 0;
      const cap = evRetry.event.capacity ?? null;
      if (cap !== null && current >= cap) {
        break;
      }

      const { data: updated, error: updateErr } = await supabase
        .from("events")
        .update({ rsvp_count: current + 1 })
        .eq("id", eventId)
        .eq("rsvp_count", current)
        .select("id")
        .maybeSingle();

      if (updateErr) {
        break;
      }
      if (updated) {
        break;
      }
    }

    return { ok: true, ticket: createdTicket };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error",
      status: 500,
    };
  }
}

export type MyTicketForEvent = {
  ticketId: number;
  rsvpStatus: Database["public"]["Enums"]["ticket_rsvp_status"];
};

/**
 * Latest ticket row for this user and event (any RSVP status), by highest ticket id.
 */
export async function getMyTicketForEvent(
  accessToken: string,
  customerId: string,
  eventId: number,
): Promise<
  { ok: true; ticket: MyTicketForEvent | null } | { ok: false; error: string; status: 401 | 400 | 500 }
> {
  if (!accessToken) {
    return { ok: false, error: "Missing access token", status: 401 };
  }
  if (!customerId?.trim()) {
    return { ok: false, error: "Missing customer id", status: 400 };
  }
  if (!Number.isFinite(eventId) || eventId <= 0) {
    return { ok: false, error: "Invalid event id", status: 400 };
  }

  try {
    const supabase = getSupabaseClientForUserAccessToken(accessToken);

    const { data, error } = await supabase
      .from("tickets")
      .select("id, rsvp_status")
      .eq("customer_id", customerId)
      .eq("event_id", eventId)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { ok: false, error: error.message, status: 500 };
    }

    if (!data) {
      return { ok: true, ticket: null };
    }

    const status = data.rsvp_status;
    if (
      status == null ||
      (status !== "pending" &&
        status !== "confirmed" &&
        status !== "attended" &&
        status !== "canceled")
    ) {
      return { ok: true, ticket: null };
    }

    return {
      ok: true,
      ticket: {
        ticketId: data.id,
        rsvpStatus: status,
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error",
      status: 500,
    };
  }
}
