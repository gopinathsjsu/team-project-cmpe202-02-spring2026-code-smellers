import { Request, Response } from "express";
import { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CreateEventRequestBody } from "../types/event.types";
import { getSupabaseClient } from "../lib/supabase";
import { Constants, type Database } from "../types/database.types";

type RequestWithUser = Request & { user?: User };

//Helper function to get existing location or create a new one if it doesn't exist
async function getOrCreateLocation(
  supabase: SupabaseClient<Database>,
  location: {
    type?: "in-person" | "virtual";
    venueName?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  }
): Promise<number | null> {
  const locationType = location.type ?? "in-person";
  const venueName = location.venueName ?? null;
  const address = location.address ?? null;

  // Only query for existing location if venueName and address are provided
  if (venueName && address) {
    const { data: existingLocation, error: queryError } = await supabase
      .from("locations")
      .select("id")
      .eq("type", locationType)
      .eq("venue_name", venueName)
      .eq("address", address)
      .single();

    // If location found, return its id
    if (existingLocation) {
      return existingLocation.id;
    }

    // If not found (404 error), continue to insert
    if (queryError?.code !== "PGRST116") {
      // Other query errors
      if (queryError) {
        throw new Error(`Location query failed: ${queryError.message}`);
      }
    }
  }

  // Insert a new location (either venueName/address are missing or no match was found)
  const { data: createdLocation, error: insertError } = await supabase
    .from("locations")
    .insert({
      type: locationType,
      venue_name: venueName,
      address: address,
      latitutde: location.latitude ?? null,
      longitude: location.longitude ?? null,
    } as any)
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`Location insert failed: ${insertError.message}`);
  }

  return createdLocation?.id ?? null;
}

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

/** Active event categories from DB enum (`event_category`), excluding unused `charity`. */
export const getEventCategories = (_req: Request, res: Response) => {
  const categories = Constants.public.Enums.event_category.filter((c) => c !== "charity");
  res.json({ categories });
};

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

    //Get or create location if location details are provided
    if (body.location) {
      try {
        locationId = await getOrCreateLocation(supabase, body.location);
      } catch (error) {
        return res.status(400).json({ 
          error: error instanceof Error ? error.message : "Location operation failed" 
        });
      }
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