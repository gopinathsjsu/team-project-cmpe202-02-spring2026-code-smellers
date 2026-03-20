import { Request, Response } from "express";

//Functions like an class/interface for expected Event Create Request content
type CreateEventRequestBody = {
  title?: string;
  description?: string;
  categoryId?: string;
  organizerId?: string;
  startDateTime?: string;
  endDateTime?: string;
  location?: unknown;
  capacity?: number;
  imageUrl?: string;
};

function validateCreateEventBody(body: CreateEventRequestBody): string | null {
  //Check required fields
  if (!body.title) {
    return "Missing required field: title";
  }
  if (!body.startDateTime) {
    return "Missing required field: startDateTime";
  }
  if (!body.endDateTime) {
    return "Missing required field: endDateTime";
  }
  if (body.capacity === undefined || body.capacity === null) {
    return "Missing required field: capacity";
  }
  if (typeof body.capacity !== "number" || body.capacity <= 0) {
    return "Field capacity must be a positive number";
  }

  const startDate = new Date(body.startDateTime);
  const endDate = new Date(body.endDateTime);
  //Check valid date/time formats
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Fields startDateTime and endDateTime must be valid ISO date strings";
  }
  //Check endDateTime is after startDateTime
  if (endDate <= startDate) {
    return "Field endDateTime must be later than startDateTime";
  }

  return null;
}

/* SAMPLE CODE - NOT CORRECT*/
export const getEvents = async (req: Request, res: Response) => {
  res.json({ message: "List of events" });
};
export const getEventById = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  res.json({ message: `Event ${eventId}` });
};
/* END SAMPLE CODE */

/*
createEvent endpoint function has the following possible response codes:
201:  -Successful event creation (returns created event data as JSON)
400:  -Invalid event create content
[more]
*/
export const createEvent = async (req: Request, res: Response) => {
  try {
    //Process incoming request (event) data from req.body as CreateEventRequestBody type
    const body = req.body as CreateEventRequestBody;

    //Validate required fields
    const validationError = validateCreateEventBody(body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    //Enforce role authorization
    // -Verify user role permissions (i.e. only "organizer" role can create events)
    // -If unauthorized, return error 403

    //Insert the event into the database
    // -Use Supabase client
    // -Insert into "events" table
    // -Request inserted row back (select + single) for return

    //Handle database errors
    // -If Supabase returns an error, map it to an HTTP error code

    //Return success response
    // -Return 201 Created
    // -Include created event object in JSON body
    return res.status(201).json({message: "Event created successfully"});
  } catch (error) {
    //Catch-all for any unexpected errors
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};