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

function parseBulkModerationItems(body: unknown):
  | { ok: true; items: adminService.AdminBulkModerationItem[] }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const payload = body as { items?: unknown };
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return { ok: false, error: "Missing moderation items" };
  }

  const items: adminService.AdminBulkModerationItem[] = [];
  for (const item of payload.items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { ok: false, error: "Each moderation item must be an object" };
    }

    const entry = item as {
      eventId?: unknown;
      approvalStatus?: unknown;
      status?: unknown;
      action?: unknown;
    };

    const eventId = parsePositiveIntegerParam(entry.eventId);
    if (eventId === null) {
      return { ok: false, error: "Each moderation item requires a valid eventId" };
    }

    const approvalStatus =
      entry.approvalStatus === "approved" || entry.approvalStatus === "rejected"
        ? entry.approvalStatus
        : entry.status === "approved" || entry.status === "rejected"
          ? entry.status
          : entry.action === "approved" || entry.action === "rejected"
            ? entry.action
            : null;

    if (!approvalStatus) {
      return { ok: false, error: "Each moderation item requires a valid approval status" };
    }

    items.push({ eventId, approvalStatus });
  }

  return { ok: true, items };
}

function parseCreateAdminBody(body: unknown):
  | { ok: true; payload: adminService.CreateAdminUserInput }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const payload = body as {
    email?: unknown;
    password?: unknown;
    name?: unknown;
  };

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const name = typeof payload.name === "string" ? payload.name.trim() : "";

  if (!email) {
    return { ok: false, error: "Missing required field: email" };
  }
  if (!password) {
    return { ok: false, error: "Missing required field: password" };
  }
  if (!name) {
    return { ok: false, error: "Missing required field: name" };
  }

  return {
    ok: true,
    payload: { email, password, name },
  };
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

export const bulkModerateEvents = async (req: Request, res: Response) => {
  try {
    if (!req.is("application/json")) {
      return res.status(400).json({ error: "Request body must be JSON" });
    }

    const parsed = parseBulkModerationItems(req.body);
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }

    const result = await adminService.bulkModerateEvents(parsed.items);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json({ updatedEvents: result.updatedEvents });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};

export const createAdminUser = async (req: Request, res: Response) => {
  try {
    if (!req.is("application/json")) {
      return res.status(400).json({ error: "Request body must be JSON" });
    }

    const parsed = parseCreateAdminBody(req.body);
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }

    const result = await adminService.createAdminUser(parsed.payload);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(201).json({ user: result.user });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};
