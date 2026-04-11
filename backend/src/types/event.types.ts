export interface CreateEventRequestBody {
  title?: string;
  description?: string;
  category?: "music" | "nightlife" | "art" | "holidays" | "sports" | "hobbies" | "business" | "food" | "charity";
  startDateTime?: string;
  endDateTime?: string;
  capacity?: number;
  imageUrl?: string;
  location?: {
    type?: "in-person" | "virtual";
    queryText?: string;
    venueName?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
}
