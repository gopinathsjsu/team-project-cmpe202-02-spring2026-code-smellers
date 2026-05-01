import { Request, Response } from "express";
import { User } from "@supabase/supabase-js";
import * as organizerService from "../services/organizer.service";
import * as eventService from "../services/event.service";
import type { UpdateOrganizerEventRequestBody } from "../types/event.types";

type RequestWithUser = Request & { user?: User };

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

export const getOrganizerDashboard = async (req: Request, res: Response) => {
  try {
    const authUserId = (req as RequestWithUser).user?.id;

    if (!authUserId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const result = await organizerService.getOrganizerDashboard(authUserId);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json(result.dashboard);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};

export const getOrganizerEventById = async (req: Request, res: Response) => {
  try {
    const organizerId = (req as RequestWithUser).user?.id;
    if (!organizerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const eventId = parsePositiveIntegerParam(req.params.eventId);
    if (eventId === null) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const result = await eventService.getEventForOrganizer(eventId, organizerId);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json({ event: result.event });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};

export const updateOrganizerEvent = async (req: Request, res: Response) => {
  try {
    if (!req.is("application/json")) {
      return res.status(400).json({ error: "Request body must be JSON" });
    }

    const organizerId = (req as RequestWithUser).user?.id;
    if (!organizerId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const eventId = parsePositiveIntegerParam(req.params.eventId);
    if (eventId === null) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    if (req.body == null || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ error: "Request body must be a JSON object" });
    }

    const body = req.body as UpdateOrganizerEventRequestBody;
    const result = await eventService.updateEventForOrganizer(eventId, organizerId, body);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json({ event: result.event });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};
