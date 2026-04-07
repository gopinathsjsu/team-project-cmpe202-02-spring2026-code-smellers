/**
 * Calls GET /api/events/search?q=&loc=
 * Empty q and loc → backend returns all approved events from Supabase.
 * With VITE_API_URL set, requests go to that origin; otherwise same-origin /api (Vite dev proxy → backend).
 */

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export type SearchEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
  imageUrl?: string;
};

export type SearchEventsParams = {
  query: string;
  location: string;
};

export async function searchEvents(
  params: SearchEventsParams,
): Promise<SearchEvent[]> {
  const q = params.query.trim();
  const loc = params.location.trim();

  const searchParams = new URLSearchParams();
  if (q) searchParams.set("q", q);
  if (loc) searchParams.set("loc", loc);

  const queryString = searchParams.toString();
  const path = `/api/events/search${queryString ? `?${queryString}` : ""}`;
  const url = API_BASE ? `${API_BASE}${path}` : path;

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      text || `Search failed (${response.status})`,
    );
  }

  return response.json() as Promise<SearchEvent[]>;
}
