import { Request, Response } from "express";

/* SAMPLE CODE - NOT CORRECT*/
export const getEvents = async (req: Request, res: Response) => {
  res.json({ message: "List of events" });
};

export const getEventById = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  res.json({ message: `Event ${eventId}` });
};

export const createEvent = async (req: Request, res: Response) => {
  res.status(201).json({ message: "Event created" });
};
/* END SAMPLE CODE */