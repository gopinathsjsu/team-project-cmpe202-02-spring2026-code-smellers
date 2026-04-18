import { Request, Response } from "express";

export const getAdminDashboard = async (_req: Request, res: Response) => {
  return res.status(501).json({ error: "Admin dashboard not implemented yet" });
};

export const getAdminEventReview = async (_req: Request, res: Response) => {
  return res.status(501).json({ error: "Admin event review not implemented yet" });
};

export const moderateEvent = async (_req: Request, res: Response) => {
  return res.status(501).json({ error: "Event moderation not implemented yet" });
};

export const bulkModerateEvents = async (_req: Request, res: Response) => {
  return res.status(501).json({ error: "Bulk moderation not implemented yet" });
};
