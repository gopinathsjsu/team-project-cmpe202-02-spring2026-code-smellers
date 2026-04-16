import { getSupabaseClient } from "../lib/supabase";
import type { Database } from "../types/database.types";

export type OrganizerDashboardEvent = {
  id: string;
  name: string;
  dateLabel: string;
  venue: string;
  status: "approved" | "pending";
  ticketsSold: number;
};

export type OrganizerDashboardData = {
  currentEvents: OrganizerDashboardEvent[];
  pastEvents: OrganizerDashboardEvent[];
};

type Fail = { ok: false; error: string; status: 400 | 500 };

type LocationEmbed = {
  venue_name: string | null;
  address: string | null;
};

type OrganizerEventRow = {
  id: number;
  title: string;
  start_date_time: string | null;
  end_date_time: string | null;
  approval_status: Database["public"]["Enums"]["event_approval_status"] | null;
  rsvp_count: number | null;
  locations: LocationEmbed | LocationEmbed[] | null;
};

function normalizeLocationEmbed(loc: OrganizerEventRow["locations"]): LocationEmbed | null {
  if (loc == null) {
    return null;
  }
  return Array.isArray(loc) ? (loc[0] ?? null) : loc;
}

function formatVenue(loc: LocationEmbed | null): string {
  if (!loc) {
    return "Location TBA";
  }

  const parts = [loc.venue_name, loc.address].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(", ") : "Location TBA";
}

function formatDateLabel(iso: string | null): string {
  if (!iso) {
    return "Date TBA";
  }

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "Date TBA";
  }

  const datePart = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timePart = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${datePart} · ${timePart}`;
}

function isPastEvent(row: OrganizerEventRow, now: Date): boolean {
  const end = row.end_date_time ? new Date(row.end_date_time) : null;
  if (end && !Number.isNaN(end.getTime())) {
    return end.getTime() < now.getTime();
  }

  const start = row.start_date_time ? new Date(row.start_date_time) : null;
  if (start && !Number.isNaN(start.getTime())) {
    return start.getTime() < now.getTime();
  }

  return false;
}

function toDashboardEvent(row: OrganizerEventRow): OrganizerDashboardEvent {
  return {
    id: String(row.id),
    name: row.title,
    dateLabel: formatDateLabel(row.start_date_time),
    venue: formatVenue(normalizeLocationEmbed(row.locations)),
    // Frontend currently supports approved/pending only; non-approved statuses map to pending for now.
    status: row.approval_status === "approved" ? "approved" : "pending",
    ticketsSold: row.rsvp_count ?? 0,
  };
}

export async function getOrganizerDashboard(
  organizerId: string,
): Promise<{ ok: true; dashboard: OrganizerDashboardData } | Fail> {
  if (!organizerId?.trim()) {
    return { ok: false, error: "Missing organizerId", status: 400 };
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
        approval_status,
        rsvp_count,
        locations ( venue_name, address )
      `,
    )
    .eq("organizer_id", organizerId)
    .order("start_date_time", { ascending: true, nullsFirst: false });

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  const rows = (data ?? []) as OrganizerEventRow[];
  const now = new Date();

  const currentEvents = rows
    .filter((row) => !isPastEvent(row, now))
    .map(toDashboardEvent);

  const pastEvents = rows
    .filter((row) => isPastEvent(row, now))
    .map(toDashboardEvent)
    .reverse();

  return {
    ok: true,
    dashboard: {
      currentEvents,
      pastEvents,
    },
  };
}
