MANUAL API TESTS

This folder contains ready-to-run VS Code REST Client request files for testing the backend without the frontend.

REQUIREMENTS
- VS Code
- REST Client extension installed
- Backend running locally on port 3000
- Working Supabase project connected to the backend

FILES
- register-user.http: creates a new user
- login-user.http: logs in an existing user and returns an access token
- create-event.http: creates a new event

HOW TO USE
1. Open this folder in VS Code.
2. Open a .http file.
3. Click Send Request above the request block.
4. View the response in the split pane.

TEST FLOW
1. Start the backend so it is available at http://localhost:3000.
2. Open register-user.http and send the request.
3. Open login-user.http and send the request with the same email and password.
4. Copy the access_token from the login response.
5. Open create-event.http and replace REPLACE_WITH_ACCESS_TOKEN with that token.
6. Send the event request.

REQUEST DETAILS
- register-user.http
  - POST http://localhost:3000/api/auth/register
  - JSON body with email, password, displayName, and is_admin

- login-user.http
  - POST http://localhost:3000/api/auth/login
  - JSON body with email and password

- create-event.http
  - POST http://localhost:3000/api/events
  - Header: Authorization set to Bearer <access_token>
  - JSON body with title, category, startDateTime, endDateTime, and capacity

NOTES
- create-event.http now uses the logged-in Supabase session from the Authorization header.
- You can include a location object in the event request to test location creation too.
- REST Client works directly against the local backend, so the frontend does not need to be connected.

COMMON ERRORS
- Missing or invalid Authorization header: make sure the login request succeeded and the token is copied into create-event.http.
- Password must be at least 8 characters: use a longer password in register-user.http.
- Invalid event dates: make sure startDateTime and endDateTime are valid ISO strings and that endDateTime is later than startDateTime.
