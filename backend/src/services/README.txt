Purpose:
This folder contains the core business logic of the application.

Services implement the actual functionality of the system and interact
with the database (Supabase/PostgreSQL).

Controllers should call services instead of directly accessing the database.

Responsibilities:
- Implement application logic
- Perform validation related to business rules
- Interact with the database
- Coordinate multiple operations if necessary

Examples:
- Creating events
- Registering users for events
- Checking event capacity
- Managing RSVP status
- Fetching event lists with filters

Example:

export const createEvent = async (eventData) => {
    return await supabase.from("events").insert(eventData);
};

Keeping business logic in services allows controllers and routes
to stay simple and keeps the application modular.