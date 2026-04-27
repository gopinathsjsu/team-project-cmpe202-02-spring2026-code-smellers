import { getSupabaseClient } from "../lib/supabase";
import type { Database } from "../types/database.types";
import { registerUser } from "./auth.service";

export type AdminDashboardPendingEvent = {
  id: string;
  title: string;
  organizerId: string;
  startDateTime: string | null;
  createdAt: string | null;
  approvalStatus: "pending" | "approved" | "rejected";
};

export type AdminDashboardData = {
  summary: {
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    totalCount: number;
  };
  pendingEvents: AdminDashboardPendingEvent[];
};

export type AdminEventReviewData = {
  event: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    startDateTime: string | null;
    endDateTime: string | null;
    capacity: number | null;
    imageUrl: string | null;
    approvalStatus: "pending" | "approved" | "rejected";
    organizer: {
      id: string;
      displayName: string;
    } | null;
    location: {
      venueName: string | null;
      address: string | null;
      latitude: number | null;
      longitude: number | null;
    } | null;
  };
};

export type AdminModerationResult = {
  event: AdminEventReviewData["event"];
};

export type AdminBulkModerationItem = {
  eventId: number;
  approvalStatus: "approved" | "rejected";
};

export type AdminBulkModerationResult = {
  updatedEvents: AdminModerationResult["event"][];
};

export type CreateAdminUserInput = {
  email: string;
  password: string;
  name: string;
};

type Fail = { ok: false; error: string; status: 400 | 404 | 500 };

type AdminEventRow = {
  id: number;
  title: string;
  organizer_id: string;
  start_date_time: string | null;
  created_at: string | null;
  approval_status: Database["public"]["Enums"]["event_approval_status"] | null;
};

type AdminEventReviewRow = {
  id: number;
  title: string;
  description: string | null;
  category: Database["public"]["Enums"]["event_category"] | null;
  start_date_time: string | null;
  end_date_time: string | null;
  capacity: number | null;
  image_url: string | null;
  approval_status: Database["public"]["Enums"]["event_approval_status"] | null;
  locations: {
    venue_name: string | null;
    address: string | null;
    latitutde: number | null;
    longitude: number | null;
  } | null;
  organizer: {
    id: string;
    display_name: string;
  } | null;
};

function mapApprovalStatus(
  status: Database["public"]["Enums"]["event_approval_status"] | null,
): "pending" | "approved" | "rejected" {
  if (status === "approved") {
    return "approved";
  }

  if (status === "rejected") {
    return "rejected";
  }

  return "pending";
}

export async function getAdminDashboard(): Promise<{ ok: true; dashboard: AdminDashboardData } | Fail> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("events")
    .select("id, title, organizer_id, start_date_time, created_at, approval_status")
    .order("created_at", { ascending: false, nullsFirst: false });

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  const rows = (data ?? []) as AdminEventRow[];

  const normalized = rows.map((row) => {
    const approvalStatus = mapApprovalStatus(row.approval_status);
    return {
      id: String(row.id),
      title: row.title,
      organizerId: row.organizer_id,
      startDateTime: row.start_date_time,
      createdAt: row.created_at,
      approvalStatus,
    } satisfies AdminDashboardPendingEvent;
  });

  const summary = {
    pendingCount: normalized.filter((event) => event.approvalStatus === "pending").length,
    approvedCount: normalized.filter((event) => event.approvalStatus === "approved").length,
    rejectedCount: normalized.filter((event) => event.approvalStatus === "rejected").length,
    totalCount: normalized.length,
  };

  const pendingEvents = normalized.filter((event) => event.approvalStatus === "pending");

  return {
    ok: true,
    dashboard: {
      summary,
      pendingEvents,
    },
  };
}

export async function getAdminEventReview(eventId: number): Promise<{ ok: true; event: AdminEventReviewData["event"] } | Fail> {
  if (!Number.isFinite(eventId) || eventId <= 0) {
    return { ok: false, error: "Event not found", status: 404 };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      `
        id,
        title,
        description,
        category,
        start_date_time,
        end_date_time,
        capacity,
        image_url,
        approval_status,
        locations ( venue_name, address, latitutde, longitude ),
        organizer:users!events_organizer_id_fkey ( id, display_name )
      `,
    )
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  if (!data) {
    return { ok: false, error: "Event not found", status: 404 };
  }

  const row = data as AdminEventReviewRow;
  return {
    ok: true,
    event: {
      id: String(row.id),
      title: row.title,
      description: row.description,
      category: row.category,
      startDateTime: row.start_date_time,
      endDateTime: row.end_date_time,
      capacity: row.capacity,
      imageUrl: row.image_url,
      approvalStatus: mapApprovalStatus(row.approval_status),
      organizer: row.organizer
        ? { id: row.organizer.id, displayName: row.organizer.display_name }
        : null,
      location: row.locations
        ? {
            venueName: row.locations.venue_name,
            address: row.locations.address,
            latitude: row.locations.latitutde,
            longitude: row.locations.longitude,
          }
        : null,
    },
  };
}

export async function moderateEvent(
  eventId: number,
  approvalStatus: "approved" | "rejected",
): Promise<{ ok: true; event: AdminModerationResult["event"] } | Fail> {
  if (!Number.isFinite(eventId) || eventId <= 0) {
    return { ok: false, error: "Event not found", status: 404 };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .update({ approval_status: approvalStatus })
    .eq("id", eventId)
    .select(
      `
        id,
        title,
        description,
        category,
        start_date_time,
        end_date_time,
        capacity,
        image_url,
        approval_status,
        locations ( venue_name, address, latitutde, longitude ),
        organizer:users!events_organizer_id_fkey ( id, display_name )
      `,
    )
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  if (!data) {
    return { ok: false, error: "Event not found", status: 404 };
  }

  const row = data as AdminEventReviewRow;
  return {
    ok: true,
    event: {
      id: String(row.id),
      title: row.title,
      description: row.description,
      category: row.category,
      startDateTime: row.start_date_time,
      endDateTime: row.end_date_time,
      capacity: row.capacity,
      imageUrl: row.image_url,
      approvalStatus: mapApprovalStatus(row.approval_status),
      organizer: row.organizer
        ? { id: row.organizer.id, displayName: row.organizer.display_name }
        : null,
      location: row.locations
        ? {
            venueName: row.locations.venue_name,
            address: row.locations.address,
            latitude: row.locations.latitutde,
            longitude: row.locations.longitude,
          }
        : null,
    },
  };
}

export async function bulkModerateEvents(
  items: AdminBulkModerationItem[],
): Promise<{ ok: true; updatedEvents: AdminBulkModerationResult["updatedEvents"] } | Fail> {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Missing moderation items", status: 400 };
  }

  const eventIds = items.map((item) => item.eventId);
  const uniqueIds = [...new Set(eventIds)];
  if (uniqueIds.length !== eventIds.length) {
    return { ok: false, error: "Duplicate event ids are not allowed", status: 400 };
  }

  const supabase = getSupabaseClient();
  const { data: existingEvents, error: lookupError } = await supabase
    .from("events")
    .select("id")
    .in("id", uniqueIds);

  if (lookupError) {
    return { ok: false, error: lookupError.message, status: 500 };
  }

  const existingIds = new Set((existingEvents ?? []).map((event) => event.id));
  const missingId = uniqueIds.find((id) => !existingIds.has(id));
  if (missingId !== undefined) {
    return { ok: false, error: `Event not found: ${missingId}`, status: 404 };
  }

  const updatedEvents: AdminBulkModerationResult["updatedEvents"] = [];
  for (const item of items) {
    const result = await moderateEvent(item.eventId, item.approvalStatus);
    if (!result.ok) {
      return result;
    }

    updatedEvents.push(result.event);
  }

  return { ok: true, updatedEvents };
}

export async function createAdminUser(
  input: CreateAdminUserInput,
): Promise<{ ok: true; user: unknown; session: unknown } | Fail> {
  return registerUser({
    email: input.email,
    password: input.password,
    name: input.name,
    is_admin: true,
  });
}
