export type PlaceSearchResult = {
  placeId: string;
  name: string;
  formattedAddress: string;
  latitude: number | null;
  longitude: number | null;
  googleMapsUri: string | null;
};

export type PlacesSearchSuccess = {
  ok: true;
  locations: PlaceSearchResult[];
};

export type PlacesSearchFailure = {
  ok: false;
  error: string;
  statusCode: number;
};

export type PlacesSearchResponse = PlacesSearchSuccess | PlacesSearchFailure;

type GooglePlacesTextSearchResponse = {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: {
      latitude?: number;
      longitude?: number;
    };
    googleMapsUri?: string;
  }>;
  error?: {
    message?: string;
    status?: string;
  };
};

export async function searchLocationsByText(
  query: string,
): Promise<PlacesSearchResponse> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return {
      ok: false,
      error: "A location query string is required",
      statusCode: 400,
    };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "Server is missing GOOGLE_PLACES_API_KEY",
      statusCode: 500,
    };
  }

  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri",
        },
        body: JSON.stringify({
          textQuery: trimmedQuery,
        }),
      },
    );

    const payload =
      (await response.json()) as GooglePlacesTextSearchResponse;

    if (!response.ok) {
      const apiErrorMessage =
        payload.error?.message ??
        `Google Places request failed with status ${response.status}`;
      return {
        ok: false,
        error: apiErrorMessage,
        statusCode: response.status,
      };
    }

    const locations: PlaceSearchResult[] = (payload.places ?? [])
      .filter((place) => typeof place.id === "string" && Boolean(place.id))
      .map((place) => ({
        placeId: place.id as string,
        name: place.displayName?.text ?? "Unknown place",
        formattedAddress: place.formattedAddress ?? "Address unavailable",
        latitude: place.location?.latitude ?? null,
        longitude: place.location?.longitude ?? null,
        googleMapsUri: place.googleMapsUri ?? null,
      }));

    return { ok: true, locations };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? `Google Places request failed: ${error.message}`
          : "Google Places request failed",
      statusCode: 500,
    };
  }
}
