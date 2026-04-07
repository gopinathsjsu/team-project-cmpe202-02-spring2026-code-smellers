import { Request, Response } from "express";
import { User } from "@supabase/supabase-js";
import { CreateEventRequestBody } from "../types/event.types";
import * as eventService from "../services/event.service";

type RequestWithUser = Request & { user?: User };

export const searchApprovedEvents = async (req: Request, res: Response) => {
  try {
    const qRaw = req.query.q;
    const locRaw = req.query.loc;
    const q = typeof qRaw === "string" ? qRaw.trim().toLowerCase() : "";
    const loc = typeof locRaw === "string" ? locRaw.trim().toLowerCase() : "";

    const result = await eventService.searchApprovedEvents(q, loc);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    return res.json(result.events);
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Unexpected error",
    });
  }
};

/* SAMPLE CODE - NOT CORRECT*/
export const getEvents = async (req: Request, res: Response) => {
  res.json({ message: "List of events" });
};
export const getEventById = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  res.json({ message: `Event ${eventId}` });
};
/* END SAMPLE CODE */

export const createEvent = async (req: Request, res: Response) => {
  try {
    const body = req.body as CreateEventRequestBody;

    const organizerId = (req as RequestWithUser).user?.id;
    if (!organizerId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const result = await eventService.createEventForOrganizer(body, organizerId);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json(result.event);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};
