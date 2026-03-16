Purpose:
This folder defines all REST API endpoints for the application.

Routes map HTTP requests (GET, POST, PATCH, DELETE) to controller functions.
They should only define the URL paths and which controller handles the request.

Routes should NOT contain business logic or database queries.

Example responsibilities:
- Define API endpoints (e.g., /auth/login, /events, /events/:eventId)
- Apply middleware such as authentication or validation
- Forward the request to the correct controller

Example:

router.get("/events", eventController.getEvents)
router.post("/events", authMiddleware, eventController.createEvent)

Routes correspond directly to endpoints defined in the OpenAPI specification
(eventbrite-clone.yaml).

Typical route files include:
- auth.routes.ts
- event.routes.ts
- ticket.routes.ts
- organizer.routes.ts
- admin.routes.ts