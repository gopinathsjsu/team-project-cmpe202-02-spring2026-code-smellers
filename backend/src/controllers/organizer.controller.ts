import { Request, Response } from "express";

export const getOrganizerDashboard = async (req: Request, res: Response) => {
  try {
    const { organizerId } = req.params;

    if (!organizerId) {
      return res.status(400).json({ error: "Missing organizerId path param" });
    }

    // TODO: delegate to organizer service once implemented.
    return res.status(501).json({
      error: "Organizer dashboard endpoint is not implemented yet",
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};
