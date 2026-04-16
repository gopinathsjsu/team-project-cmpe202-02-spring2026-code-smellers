import { Request, Response } from "express";
import { User } from "@supabase/supabase-js";
import * as organizerService from "../services/organizer.service";

type RequestWithUser = Request & { user?: User };

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
