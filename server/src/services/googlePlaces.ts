import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  rating?: number;
  userRatingsTotal?: number;
}

function requireApiKey() {
  if (!env.GOOGLE_PLACES_API_KEY) {
    throw AppError.internal(
      "GOOGLE_PLACES_API_KEY is not configured on the server"
    );
  }
  return env.GOOGLE_PLACES_API_KEY;
}

/**
 * מפענח JSON מתשובת HTTP בצורה בטוחה. אם ה-API החיצוני מחזיר משהו שאינו JSON תקין
 * (שגיאת רשת, HTML של שגיאת שער, הודעת "quota exceeded" בטקסט חופשי וכו') -
 * נזרוק AppError ברור במקום לתת ל-SyntaxError הגולמי לבעבע ולהחזיר 500 עמום.
 */
async function safeJson(res: Response, serviceName: string): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw AppError.internal(
      `${serviceName} returned an unexpected (non-JSON) response (HTTP ${res.status})`,
      { bodyPreview: text.slice(0, 200) }
    );
  }
}

/** ממיר שם יעד (למשל "רומא, איטליה") לקואורדינטות באמצעות Google Geocoding API */
export async function geocodeDestination(
  destinationName: string
): Promise<GeocodeResult> {
  const apiKey = requireApiKey();
  const url = `${GEOCODE_URL}?address=${encodeURIComponent(destinationName)}&key=${apiKey}`;

  const res = await fetchWithTimeout(url);
  const data = await safeJson(res, "Google Geocoding API");

  if (data.status !== "OK" || !data.results?.length) {
    throw AppError.badRequest(
      `Could not resolve destination "${destinationName}" (Google status: ${data.status})`
    );
  }

  const result = data.results[0];
  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
  };
}

/**
 * מחפש נקודות עניין (POIs) בסביבת היעד, לפי רשימת תחומי עניין.
 * לכל interest מבצעים Text Search נפרד (למשל "museums in Rome") ומאחדים תוצאות.
 */
export async function searchPlacesForInterests(
  destinationName: string,
  interests: string[],
  maxPerInterest = 6
): Promise<PlaceResult[]> {
  const apiKey = requireApiKey();
  const effectiveInterests = interests.length > 0 ? interests : ["tourist attractions"];

  const results: PlaceResult[] = [];
  const seenPlaceIds = new Set<string>();

  for (const interest of effectiveInterests) {
    const query = `${interest} in ${destinationName}`;
    const url = `${TEXT_SEARCH_URL}?query=${encodeURIComponent(query)}&key=${apiKey}`;

    try {
      const res = await fetchWithTimeout(url);
      const data = await safeJson(res, "Google Places API");

      if (data.status !== "OK") {
        // לא זורקים שגיאה קשה - תחום עניין אחד שנכשל לא צריך להפיל את כל היצירה
        console.warn(`Places search failed for "${query}": ${data.status}`);
        continue;
      }

      for (const place of (data.results ?? []).slice(0, maxPerInterest)) {
        if (seenPlaceIds.has(place.place_id)) continue;
        seenPlaceIds.add(place.place_id);
        results.push({
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          lat: place.geometry?.location?.lat,
          lng: place.geometry?.location?.lng,
          category: interest,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
        });
      }
    } catch (err) {
      console.warn(`Places search error for "${query}":`, err);
    }
  }

  return results;
}
