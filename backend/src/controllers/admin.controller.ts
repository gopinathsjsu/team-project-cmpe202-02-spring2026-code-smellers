import { Request, Response } from "express";
import * as adminService from "../services/admin.service";

function parsePositiveIntegerParam(raw: unknown): number | null {
  const value = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseModerationStatus(body: unknown): "approved" | "rejected" | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const payload = body as {
    approvalStatus?: unknown;
    status?: unknown;
    action?: unknown;
  };

  const raw = payload.approvalStatus ?? payload.status ?? payload.action;
  if (raw === "approved" || raw === "rejected") {
    return raw;
  }

  return null;
}

export const getAdminDashboard = async (_req: Request, res: Response) => {
  try {
    const result = await adminService.getAdminDashboard();
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

export const getAdminEventReview = async (req: Request, res: Response) => {
  try {
    const eventId = parsePositiveIntegerParam(req.params.eventId);
    if (eventId === null) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const result = await adminService.getAdminEventReview(eventId);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json(result.event);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};

export const moderateEvent = async (req: Request, res: Response) => {
  try {
    if (!req.is("application/json")) {
      return res.status(400).json({ error: "Request body must be JSON" });
    }

    const eventId = parsePositiveIntegerParam(req.params.eventId);
    if (eventId === null) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const moderationStatus = parseModerationStatus(req.body);
    if (!moderationStatus) {
      return res.status(400).json({ error: "Missing or invalid approval status" });
    }

    const result = await adminService.moderateEvent(eventId, moderationStatus);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json(result.event);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};

export const bulkModerateEvents = async (_req: Request, res: Response) => {
  return res.status(501).json({ error: "Bulk moderation not implemented yet" });
};
