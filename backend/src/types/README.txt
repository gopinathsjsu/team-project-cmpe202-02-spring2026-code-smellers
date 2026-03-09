Purpose:
This folder contains custom TypeScript type definitions used across the project.

These types extend existing library types or define shared type utilities.

Example use cases:
- Extending the Express Request object to include authenticated user data
- Shared application types
- Global type declarations

Example:

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

Type definitions improve type safety and ensure consistent usage
of data structures across the application.