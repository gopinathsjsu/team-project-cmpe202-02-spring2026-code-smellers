Purpose:
Middleware functions run before requests reach the controller.

Middleware is used to perform operations that should happen for many
routes such as authentication, authorization, validation, and logging.

Responsibilities:
- Verify authentication tokens (JWT)
- Enforce role-based access control
- Validate request input
- Handle errors
- Log requests

Example flow:

Client request
   ↓
Middleware
   ↓
Controller

Example middleware:

authMiddleware
    Checks if the request contains a valid JWT token

roleMiddleware
    Ensures the user has the required role (admin, organizer, attendee)

validationMiddleware
    Validates request body against schema

Middleware helps enforce security and keeps controllers cleaner.