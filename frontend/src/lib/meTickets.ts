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
