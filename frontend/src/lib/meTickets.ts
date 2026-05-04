import { apiUrl } from "./api";
import { getAuthToken } from "./auth";

export type TicketRsvpStatus = "pending" | "confirmed" | "canceled" | "attended";

export type MyTicketApi = {
  ticketId: number;
  eventId: string;
  title: string;
  date: string;
  location: string;
  imageUrl?: string;
  rsvpStatus: TicketRsvpStatus;
};

export type MyTicketsScope = "upcoming" | "past";

export type MyTicketForEventApi = {
  ticketId: number;
  rsvpStatus: TicketRsvpStatus;
};

/** Latest ticket for this user on the event, or null if none. */
export async function fetchMyTicketForEvent(eventId: string): Promise<MyTicketForEventApi | null> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not signed in");
  }

  const response = await fetch(apiUrl(`/api/users/me/tickets/event/${encodeURIComponent(eventId)}`), {
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

  if (typeof data !== "object" || data === null || !("ticket" in data)) {
    throw new Error("Invalid response shape");
  }

  const ticket = (data as { ticket: unknown }).ticket;
  if (ticket === null) {
    return null;
  }
  if (
    typeof ticket !== "object" ||
    ticket === null ||
    !("ticketId" in ticket) ||
    !("rsvpStatus" in ticket) ||
    typeof (ticket as { ticketId: unknown }).ticketId !== "number" ||
    typeof (ticket as { rsvpStatus: unknown }).rsvpStatus !== "string"
  ) {
    throw new Error("Invalid response shape");
  }

  return {
    ticketId: (ticket as { ticketId: number }).ticketId,
    rsvpStatus: (ticket as { rsvpStatus: TicketRsvpStatus }).rsvpStatus,
  };
}

export async function fetchMyTickets(scope: MyTicketsScope): Promise<MyTicketApi[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not signed in");
  }

  const response = await fetch(apiUrl(`/api/users/me/tickets?scope=${encodeURIComponent(scope)}`), {
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
    !("tickets" in data) ||
    !Array.isArray((data as { tickets: unknown }).tickets)
  ) {
    throw new Error("Invalid response shape");
  }

  return (data as { tickets: MyTicketApi[] }).tickets;
}
