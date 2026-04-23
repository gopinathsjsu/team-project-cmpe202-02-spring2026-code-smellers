import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";
import { getAuthToken } from "../lib/auth";
import { Button } from "../components/ui/button";

type AdminEvent = {
  id: string;
  title: string;
  organizerId: string;
  startDateTime: string | null;
  createdAt: string | null;
  approvalStatus: "pending" | "approved" | "rejected";
};

type AdminDashboardData = {
  summary: { pendingCount: number; approvedCount: number; rejectedCount: number; totalCount: number };
  pendingEvents: AdminEvent[];
};

type AdminReviewEvent = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  startDateTime: string | null;
  endDateTime: string | null;
  capacity: number | null;
  approvalStatus: "pending" | "approved" | "rejected";
  organizer: { id: string; displayName: string } | null;
};

async function fetchAdminDashboard(signal?: AbortSignal): Promise<AdminDashboardData> {
  const token = getAuthToken();
  if (!token) throw new Error("Missing auth token in localStorage");

  const response = await fetch(apiUrl("/api/admin/dashboard"), {
    signal,
    headers: { Authorization: `Bearer ${token}` },
  });

  const text = await response.text();
  if (!response.ok) throw new Error(text || `Failed to fetch admin dashboard (${response.status})`);

  return JSON.parse(text) as AdminDashboardData;
}

async function moderateEvent(eventId: string, approvalStatus: "approved" | "rejected"): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("Missing auth token in localStorage");

  const response = await fetch(apiUrl(`/api/admin/events/${eventId}/moderation`), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ approvalStatus }),
  });

  if (!response.ok) {
    throw new Error((await response.text()) || `Failed to update event (${response.status})`);
  }
}

async function fetchAdminEventReview(eventId: string): Promise<AdminReviewEvent> {
  const token = getAuthToken();
  if (!token) throw new Error("Missing auth token in localStorage");

  const response = await fetch(apiUrl(`/api/admin/events/${eventId}/review`), {
    headers: { Authorization: `Bearer ${token}` },
  });

  const text = await response.text();
  if (!response.ok) throw new Error(text || `Failed to fetch event review (${response.status})`);

  return JSON.parse(text) as AdminReviewEvent;
}

async function bulkModerateEvents(
  items: Array<{ eventId: number; approvalStatus: "approved" | "rejected" }>,
): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("Missing auth token in localStorage");

  const response = await fetch(apiUrl("/api/admin/events/moderation/bulk"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    throw new Error((await response.text()) || `Failed bulk moderation (${response.status})`);
  }
}

export default function DashboardAdmin() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [review, setReview] = useState<AdminReviewEvent | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const dashboard = await fetchAdminDashboard(controller.signal);
        setData(dashboard);
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  if (loading) return <div className="p-6 text-sm text-neutral-600">Loading admin dashboard...</div>;
  if (error) return <div className="p-6 text-sm text-error-700">{error}</div>;

  const pendingEvents = data?.pendingEvents ?? [];

  function toggleSelect(eventId: string) {
    setSelectedIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId],
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === pendingEvents.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(pendingEvents.map((event) => event.id));
  }

  async function handleModerate(eventId: string, approvalStatus: "approved" | "rejected") {
    try {
      setError(null);
      setUpdatingId(eventId);
      await moderateEvent(eventId, approvalStatus);
      const dashboard = await fetchAdminDashboard();
      setData(dashboard);
      setSelectedIds((prev) => prev.filter((id) => id !== eventId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleReview(eventId: string) {
    if (reviewingId === eventId && review) {
      setReviewingId(null);
      setReview(null);
      return;
    }

    try {
      setError(null);
      setReviewLoading(true);
      setReviewingId(eventId);
      const detail = await fetchAdminEventReview(eventId);
      setReview(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load review details");
      setReview(null);
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleBulkModerate(approvalStatus: "approved" | "rejected") {
    try {
      setError(null);
      setBulkLoading(true);

      const items = selectedIds.map((id) => ({ eventId: Number(id), approvalStatus }));
      await bulkModerateEvents(items);

      const dashboard = await fetchAdminDashboard();
      setData(dashboard);
      setSelectedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed bulk moderation");
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="bg-surface-base">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Admin Workspace</p>
          <h1 className="mt-1 font-display text-4xl font-bold text-neutral-900">Moderation Dashboard</h1>
          <p className="mt-2 text-sm text-neutral-600">Review pending organizer events and moderate approvals.</p>
        </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Pending", data?.summary.pendingCount],
          ["Approved", data?.summary.approvedCount],
          ["Rejected", data?.summary.rejectedCount],
          ["Total", data?.summary.totalCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-surface-raised p-4 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-neutral-900">{value ?? 0}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-surface-raised p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold text-neutral-900">Pending Events</h1>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={toggleSelectAll}>
              {selectedIds.length === pendingEvents.length && pendingEvents.length > 0 ? "Clear all" : "Select all"}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={selectedIds.length === 0 || bulkLoading}
              isLoading={bulkLoading}
              onClick={() => handleBulkModerate("approved")}
            >
              Approve selected ({selectedIds.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={selectedIds.length === 0 || bulkLoading}
              isLoading={bulkLoading}
              onClick={() => handleBulkModerate("rejected")}
            >
              Reject selected ({selectedIds.length})
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {pendingEvents.map((event) => (
            <article key={event.id} className="rounded-lg border border-neutral-200 p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(event.id)}
                  onChange={() => toggleSelect(event.id)}
                  className="mt-1 h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-neutral-900">{event.title}</p>
                  <p className="text-sm text-neutral-600">Organizer: {event.organizerId}</p>
                  <p className="text-sm text-neutral-500">Starts: {event.startDateTime ?? "TBA"}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  isLoading={reviewLoading && reviewingId === event.id}
                  onClick={() => handleReview(event.id)}
                >
                  {reviewingId === event.id && review ? "Hide details" : "Review details"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={updatingId === event.id || bulkLoading}
                  onClick={() => handleModerate(event.id, "approved")}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  disabled={updatingId === event.id || bulkLoading}
                  onClick={() => handleModerate(event.id, "rejected")}
                >
                  Reject
                </Button>
              </div>

              {reviewingId === event.id && review ? (
                <div className="mt-4 rounded-lg bg-neutral-50 p-4 text-sm text-neutral-700">
                  <p><span className="font-semibold text-neutral-900">Title:</span> {review.title}</p>
                  <p><span className="font-semibold text-neutral-900">Organizer:</span> {review.organizer?.displayName ?? "Unknown"}</p>
                  <p><span className="font-semibold text-neutral-900">Status:</span> {review.approvalStatus}</p>
                  <p><span className="font-semibold text-neutral-900">Category:</span> {review.category ?? "N/A"}</p>
                  <p><span className="font-semibold text-neutral-900">Capacity:</span> {review.capacity ?? "N/A"}</p>
                  <p><span className="font-semibold text-neutral-900">Starts:</span> {review.startDateTime ?? "TBA"}</p>
                  <p><span className="font-semibold text-neutral-900">Ends:</span> {review.endDateTime ?? "TBA"}</p>
                  {review.description ? (
                    <p className="mt-1"><span className="font-semibold text-neutral-900">Description:</span> {review.description}</p>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
          {pendingEvents.length === 0 ? (
            <p className="text-sm text-neutral-600">No pending events.</p>
          ) : null}
        </div>
      </section>
      </div>
    </div>
  );
}
