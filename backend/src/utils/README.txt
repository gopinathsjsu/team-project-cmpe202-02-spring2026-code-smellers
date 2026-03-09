Purpose:
This folder contains general utility/helper functions used across the project.

Utilities are small reusable functions that do not belong to controllers,
services, or middleware.

Examples include:
- Logging helpers
- Date formatting utilities
- Email helper functions
- String formatting
- ID generation

Example:

export const formatDate = (date) => {
    return new Date(date).toISOString();
};

Utilities should remain generic and reusable.
They should not depend heavily on specific application logic.