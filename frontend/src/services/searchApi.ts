/**
 * API layer for event search. Keeps fetch details out of React components.
 * Point VITE_API_URL at your backend when the search endpoint exists.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "";

/** Shape returned by your API (adjust to match the real contract). */
export type SearchEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
  imageUrl?: string;
};

/** Dev-only sample rows when no API base is set; remove when the real endpoint is wired. */
const SAMPLE_EVENTS: SearchEvent[] = [
  {
    id: "sample-1",
    title: "Downtown Jazz Night",
    date: "Fri, Apr 4 · 7:30 PM",
    location: "San Jose, CA",
    imageUrl:
      "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "sample-2",
    title: "Weekend Farmers Market",
    date: "Sat, Apr 5 · 9:00 AM",
    location: "Santa Clara, CA",
    imageUrl:
      "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80",
  },
];

export type SearchEventsParams = {
  query: string;
  location: string;
};

export async function searchEvents(
  params: SearchEventsParams,
): Promise<SearchEvent[]> {
  const trimmedQuery = params.query.trim().toLowerCase();
  const trimmedLocation = params.location.trim().toLowerCase();

  if (!API_BASE) {
    await new Promise((r) => setTimeout(r, 200));
    return SAMPLE_EVENTS.filter((e) => {
      const matchQ =
        !trimmedQuery ||
        e.title.toLowerCase().includes(trimmedQuery) ||
        e.location.toLowerCase().includes(trimmedQuery);
      const matchLoc =
        !trimmedLocation ||
        e.location.toLowerCase().includes(trimmedLocation);
      return matchQ && matchLoc;
    });
  }

  const searchParams = new URLSearchParams();
  if (trimmedQuery) searchParams.set("q", trimmedQuery);
  if (trimmedLocation) searchParams.set("loc", trimmedLocation);

  const path = `/api/events/search?${searchParams.toString()}`;
  const url = `${API_BASE.replace(/\/$/, "")}${path}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Search failed (${response.status})`);
  }

  return response.json() as Promise<SearchEvent[]>;
}
