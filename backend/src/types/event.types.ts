export interface CreateEventRequestBody {
  title?: string;
  description?: string;
  categoryId?: string;
  organizerId?: string;
  startDateTime?: string;
  endDateTime?: string;
  location?: unknown;
  capacity?: number;
  imageUrl?: string;
}
