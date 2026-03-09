Purpose:
This folder defines data structures and TypeScript interfaces that represent
entities in the system.

These models typically correspond to database tables and OpenAPI schemas.

Models help ensure type safety when working with data in TypeScript.

Examples of models in this project include:
- User
- Event
- Ticket
- Category
- Location

Example model:

export interface Event {
    eventId: string;
    title: string;
    description?: string;
    organizerId: string;
    startDateTime: Date;
    endDateTime: Date;
    capacity: number;
}

Models should not contain logic or database queries.
They only define the structure of data used across the application.