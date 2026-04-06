export interface CreateEventRequestBody {
  title?: string;
  description?: string;
  category?: "music" | "nightlife" | "performing and visual arts" | "holidays" | "dating" | "hobbies" | "business" | "food and drink" | "charity";
  startDateTime?: string;
  endDateTime?: string;
  capacity?: number;
  imageUrl?: string;
  location?: {
    type?: "in-person" | "virtual";
    venueName?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
}
