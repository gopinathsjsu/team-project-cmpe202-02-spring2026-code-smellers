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

export default function DashboardAdmin() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  async function handleModerate(eventId: string, approvalStatus: "approved" | "rejected") {
    try {
      setError(null);
      setUpdatingId(eventId);
      await moderateEvent(eventId, approvalStatus);
      const dashboard = await fetchAdminDashboard();
      setData(dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setUpdatingId(null);
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
        <h1 className="font-display text-2xl font-semibold text-neutral-900">Pending Events</h1>
        <div className="mt-4 space-y-3">
          {(data?.pendingEvents ?? []).map((event) => (
            <article key={event.id} className="rounded-lg border border-neutral-200 p-4">
              <p className="font-semibold text-neutral-900">{event.title}</p>
              <p className="text-sm text-neutral-600">Organizer: {event.organizerId}</p>
              <p className="text-sm text-neutral-500">Starts: {event.startDateTime ?? "TBA"}</p>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={updatingId === event.id}
                  onClick={() => handleModerate(event.id, "approved")}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  disabled={updatingId === event.id}
                  onClick={() => handleModerate(event.id, "rejected")}
                >
                  Reject
                </Button>
              </div>
            </article>
          ))}
          {(data?.pendingEvents ?? []).length === 0 ? (
            <p className="text-sm text-neutral-600">No pending events.</p>
          ) : null}
        </div>
      </section>
      </div>
    </div>
  );
}
