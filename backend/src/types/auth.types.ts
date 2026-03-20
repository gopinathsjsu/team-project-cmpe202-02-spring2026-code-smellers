export interface RegisterRequestBody {
  email?: string;
  password?: string;
  displayName?: string;
  role?: "attendee" | "organizer" | "admin";
}
