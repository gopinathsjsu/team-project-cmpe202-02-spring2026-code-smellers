import type { Request, Response } from "express";
import type { User } from "@supabase/supabase-js";
import * as userSavedEventService from "../services/userSavedEvent.service";

type RequestWithUser = Request & { user?: User };

function bearerToken(req: Request): string {
  return (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
}

export const getMySavedEvents = async (req: Request, res: Response) => {
  const authUser = (req as RequestWithUser).user;
  if (!authUser?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = bearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Missing access token" });
  }

  const result = await userSavedEventService.listMySavedEvents(token, authUser.id);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(200).json({ events: result.events });
};

export const postMySavedEvent = async (req: Request, res: Response) => {
  const authUser = (req as RequestWithUser).user;
  if (!authUser?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = bearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Missing access token" });
  }

  const eventId = typeof req.params.eventId === "string" ? req.params.eventId : "";
  const result = await userSavedEventService.addMySavedEvent(token, authUser.id, eventId);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(201).json({ ok: true });
};

export const deleteMySavedEvent = async (req: Request, res: Response) => {
  const authUser = (req as RequestWithUser).user;
  if (!authUser?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = bearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Missing access token" });
  }

  const eventId = typeof req.params.eventId === "string" ? req.params.eventId : "";
  const result = await userSavedEventService.removeMySavedEvent(token, authUser.id, eventId);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(204).send();
};
