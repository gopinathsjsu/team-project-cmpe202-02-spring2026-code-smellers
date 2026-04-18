import type { Request, Response } from "express";
import type { User } from "@supabase/supabase-js";
import * as userTicketService from "../services/userTicket.service";

type RequestWithUser = Request & { user?: User };

export const getMyTickets = async (req: Request, res: Response) => {
  const scope = typeof req.query.scope === "string" ? req.query.scope : undefined;
  if (scope !== "upcoming" && scope !== "past") {
    return res.status(400).json({
      error: "Invalid or missing query parameter: scope. Supported values: upcoming, past",
    });
  }

  const authUser = (req as RequestWithUser).user;
  if (!authUser?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return res.status(401).json({ error: "Missing access token" });
  }

  const result =
    scope === "past"
      ? await userTicketService.listMyPastTickets(token, authUser.id)
      : await userTicketService.listMyUpcomingTickets(token, authUser.id);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(200).json({ tickets: result.tickets });
};
