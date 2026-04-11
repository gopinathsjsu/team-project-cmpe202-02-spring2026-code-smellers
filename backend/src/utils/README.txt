Purpose:
This folder contains general utility/helper functions used across the project.

Utilities are small reusable functions that do not belong to controllers,
services, or middleware.

Examples include:

googlePlaces.ts
    Calls Google Places API v1 Text Search using a text query string
    and returns either normalized location details or a structured error.

Example:

export const formatDate = (date) => {
    return new Date(date).toISOString();
};

Utilities should remain generic and reusable.
They should not depend heavily on specific application logic.