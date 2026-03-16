Purpose:
This folder contains configuration code used across the application.

Configuration files initialize external services and store application
settings such as database connections.

Typical configurations include:
- Supabase client initialization
- Authentication settings
- Application constants

Example files:

supabase.ts
    Creates and exports a Supabase client for interacting with the database.

auth.ts
    Stores authentication-related configuration such as JWT settings.

Configuration files help centralize setup logic so it can be reused
throughout the application.