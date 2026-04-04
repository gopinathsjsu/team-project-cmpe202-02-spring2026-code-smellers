import { Request, Response } from "express";
import { User } from "@supabase/supabase-js";
import { CreateEventRequestBody } from "../types/event.types";
import { getSupabaseClient } from "../lib/supabase";

type RequestWithUser = Request & { user?: User };

//Validation function for expected Event Create Request content
function validateCreateEventBody(body: CreateEventRequestBody): string | null {
  //Check required fields
  if (!body.title) {
    return "Missing required field: title";
  }
  if (!body.category) {
    return "Missing required field: category";
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
      -Location creation error
500:  -Missing organizer_id from auth context
      -Event insert database error
      -Catch-all for unexpected errors
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

    //Use the authenticated Supabase user as the organizer
    const organizerId = (req as RequestWithUser).user?.id;
    if (!organizerId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const supabase = getSupabaseClient();
    let locationId: number | null = null;

    //Create location if location details are provided
    if (body.location) {
      const locationType = body.location.type ?? "in-person";
      
      const { data: createdLocation, error: locationError } = await supabase
        .from("locations")
        .insert({
          type: locationType,
          venue_name: body.location.venueName ?? null,
          address: body.location.address ?? null,
          latitude: body.location.latitude ?? null,
          longitude: body.location.longitude ?? null,
        } as any)
        .select("id")
        .single();

      if (locationError) {
        return res.status(400).json({ error: `Location creation failed: ${locationError.message}` });
      }

      locationId = createdLocation?.id ?? null;
    }

    //Build event insert payload matching database schema
    const eventRecord = {
      title: body.title as string,
      description: body.description ?? null,
      category: body.category as string,
      start_date_time: body.startDateTime as string,
      end_date_time: body.endDateTime as string,
      capacity: body.capacity as number,
      image_url: body.imageUrl ?? null,
      location_id: locationId,
      organizer_id: organizerId,
      approval_status: "pending",
      rsvp_count: 0,
    } as any;

    //Insert event into database
    const { data: createdEvent, error: eventError } = await supabase
      .from("events")
      .insert(eventRecord)
      .select("*")
      .single();

    if (eventError) {
      return res.status(400).json({ error: `Event creation failed: ${eventError.message}` });
    }

    //Return success response with created event
    return res.status(201).json(createdEvent);
  } catch (error) {
    //Catch-all for any unexpected errors
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};