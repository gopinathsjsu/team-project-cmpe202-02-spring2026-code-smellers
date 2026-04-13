import { Request, Response } from "express";
import { User } from "@supabase/supabase-js";
import { CreateEventRequestBody } from "../types/event.types";
import * as eventService from "../services/event.service";
import { Constants } from "../types/database.types";

type RequestWithUser = Request & { user?: User };

const EVENT_CATEGORY_SET = new Set<string>(Constants.public.Enums.event_category);

function parseSearchCategoryParam(raw: unknown): { ok: true; category?: string } | { ok: false; error: string } {
  if (raw === undefined || raw === "") {
    return { ok: true };
  }
  const first = Array.isArray(raw) ? raw[0] : raw;
  const s = typeof first === "string" ? first.trim() : "";
  if (!s) {
    return { ok: true };
  }
  if (!EVENT_CATEGORY_SET.has(s)) {
    return { ok: false, error: "Invalid category" };
  }
  return { ok: true, category: s };
}

const HOME_EVENTS_DEFAULT_LIMIT = 8;
const HOME_EVENTS_MAX_LIMIT = 50;

function parseHomeEventsLimit(raw: unknown): number | null {
  if (raw === undefined || raw === "") {
    return HOME_EVENTS_DEFAULT_LIMIT;
  }
  const first = Array.isArray(raw) ? raw[0] : raw;
  const n = typeof first === "string" ? parseInt(first, 10) : typeof first === "number" ? Math.floor(first) : NaN;
  if (!Number.isFinite(n) || n < 1) {
    return null;
  }
  return Math.min(n, HOME_EVENTS_MAX_LIMIT);
}

export const searchApprovedEvents = async (req: Request, res: Response) => {
  try {
    const qRaw = req.query.q;
    const locRaw = req.query.loc;
    const q = typeof qRaw === "string" ? qRaw.trim().toLowerCase() : "";
    const loc = typeof locRaw === "string" ? locRaw.trim().toLowerCase() : "";

    const catParsed = parseSearchCategoryParam(req.query.category);
    if (!catParsed.ok) {
      return res.status(400).json({ error: catParsed.error });
    }

    const result = await eventService.searchApprovedEvents(q, loc, catParsed.category);
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

/** Active event categories from DB enum (`event_category`), excluding unused `charity`. */
export const getEventCategories = (_req: Request, res: Response) => {
  const categories = Constants.public.Enums.event_category.filter((c) => c !== "charity");
  res.json({ categories });
};

/** Public list of approved events for home / discovery; same filters as `GET /search`, capped by `limit` (default 8, max 50). */
export const getEvents = async (req: Request, res: Response) => {
  try {
    const limit = parseHomeEventsLimit(req.query.limit);
    if (limit === null) {
      return res.status(400).json({ error: "Invalid limit; use an integer from 1 to 50" });
    }

    const qRaw = req.query.q;
    const locRaw = req.query.loc;
    const q = typeof qRaw === "string" ? qRaw.trim().toLowerCase() : "";
    const loc = typeof locRaw === "string" ? locRaw.trim().toLowerCase() : "";

    const catParsed = parseSearchCategoryParam(req.query.category);
    if (!catParsed.ok) {
      return res.status(400).json({ error: catParsed.error });
    }

    const result = await eventService.searchApprovedEvents(q, loc, catParsed.category);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    return res.json(result.events.slice(0, limit));
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Unexpected error",
    });
  }
};

//For the event details page, frontend can display formatted version of event details
export const getRelatedEvents = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const idNum = Number(eventId);
    if (!Number.isFinite(idNum)) {
      return res.status(400).json({ error: "Invalid event id" });
    }
    const catRaw = req.query.category;
    const category =
      typeof catRaw === "string" && catRaw.trim() ? catRaw.trim() : null;
    const result = await eventService.getRelatedApprovedEvents(idNum, category);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result.events);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const idNum = Number(eventId);
    if (!Number.isFinite(idNum)) {
      return res.status(400).json({ error: "Invalid event id" });
    }
    const result = await eventService.getEventById(idNum);
    if (!result.ok) {
      return res.status(404).json({ error: result.error });
    }
    return res.status(200).json(result.event);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });

  }
};

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
