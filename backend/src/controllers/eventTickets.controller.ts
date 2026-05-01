import type { Request, Response } from "express";
import type { User } from "@supabase/supabase-js";
import * as userTicketService from "../services/userTicket.service";

type RequestWithUser = Request & { user?: User };

function bearerToken(req: Request): string {
  return (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
}

function parsePositiveIntegerParam(raw: unknown): number | null {
  const value = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  if (!/^\d+$/.test(value)) {
    return null;
  }
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n <= 0) {
    return null;
  }
  return n;
}

/**
 * RSVP / create a ticket for an approved event (free events).
 * Returns the ticket row (pending by default).
 */
export const rsvpForEvent = async (req: Request, res: Response) => {
  try {
    const authUser = (req as RequestWithUser).user;
    if (!authUser?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = bearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Missing access token" });
    }

    const eventId = parsePositiveIntegerParam(req.params.eventId);
    if (eventId === null) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const result = await userTicketService.rsvpForEvent(token, authUser.id, eventId);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(201).json({ ticket: result.ticket });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};

