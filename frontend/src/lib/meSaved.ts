import { apiUrl } from "./api";
import { getAuthToken } from "./auth";

export type MySavedEventApi = {
  eventId: string;
  title: string;
  date: string;
  location: string;
  imageUrl?: string;
};

export async function fetchMySavedEvents(): Promise<MySavedEventApi[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not signed in");
  }

  const response = await fetch(apiUrl("/api/users/me/saved-events"), {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const err =
      typeof data === "object" && data !== null && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Request failed (${response.status})`;
    throw new Error(err);
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("events" in data) ||
    !Array.isArray((data as { events: unknown }).events)
  ) {
    throw new Error("Invalid response shape");
  }

  return (data as { events: MySavedEventApi[] }).events;
}

export async function addSavedEvent(eventId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not signed in");
  }

  const response = await fetch(apiUrl(`/api/users/me/saved-events/${encodeURIComponent(eventId)}`), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok) {
    return;
  }

  const data: unknown = await response.json().catch(() => null);
  const err =
    typeof data === "object" && data !== null && "error" in data && typeof (data as { error: unknown }).error === "string"
      ? (data as { error: string }).error
      : `Request failed (${response.status})`;
  throw new Error(err);
}

export async function removeSavedEvent(eventId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not signed in");
  }

  const response = await fetch(apiUrl(`/api/users/me/saved-events/${encodeURIComponent(eventId)}`), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok) {
    return;
  }

  const data: unknown = await response.json().catch(() => null);
  const err =
    typeof data === "object" && data !== null && "error" in data && typeof (data as { error: unknown }).error === "string"
      ? (data as { error: string }).error
      : `Request failed (${response.status})`;
  throw new Error(err);
}
