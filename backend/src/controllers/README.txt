Purpose:
Controllers handle HTTP requests and responses.

A controller receives data from the request object (req),
calls the appropriate service to perform business logic,
and sends a response back to the client.

Controllers should NOT contain complex business logic or direct database queries.

Responsibilities:
- Read request parameters (req.params, req.body, req.query)
- Call service functions
- Return formatted responses
- Set HTTP status codes

Example flow:

Client request
   ↓
Route
   ↓
Controller
   ↓
Service
   ↓
Database

Example:

export const createEvent = async (req, res) => {
    const event = await eventService.createEvent(req.body);
    res.status(201).json(event);
};

Controllers should remain lightweight and primarily coordinate between
the API layer and the service layer.