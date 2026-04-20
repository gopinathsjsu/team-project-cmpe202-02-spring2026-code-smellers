import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";
import { getAuthToken } from "../lib/auth";

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

export default function DashboardAdmin() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Pending", data?.summary.pendingCount],
          ["Approved", data?.summary.approvedCount],
          ["Rejected", data?.summary.rejectedCount],
          ["Total", data?.summary.totalCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-neutral-900">{value ?? 0}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-soft">
        <h1 className="font-display text-2xl font-semibold text-neutral-900">Pending Events</h1>
        <div className="mt-4 space-y-3">
          {(data?.pendingEvents ?? []).map((event) => (
            <article key={event.id} className="rounded-lg border border-neutral-200 p-4">
              <p className="font-semibold text-neutral-900">{event.title}</p>
              <p className="text-sm text-neutral-600">Organizer: {event.organizerId}</p>
              <p className="text-sm text-neutral-500">Starts: {event.startDateTime ?? "TBA"}</p>
            </article>
          ))}
          {(data?.pendingEvents ?? []).length === 0 ? (
            <p className="text-sm text-neutral-600">No pending events.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
