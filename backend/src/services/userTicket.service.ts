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
        if (!ev?.start_date_time) {
          return false;
        }
        const t = new Date(ev.start_date_time).getTime();
        if (Number.isNaN(t) || t <= now) {
          return false;
        }
        return true;
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
