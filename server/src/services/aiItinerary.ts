import OpenAI from "openai";
import { z } from "zod";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { PlaceResult } from "./googlePlaces";
import { DailyWeatherSummary } from "./weather";

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!env.OPENAI_API_KEY) {
    throw AppError.internal("OPENAI_API_KEY is not configured on the server");
  }
  if (!client) client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return client;
}

// --- סכימת הפלט שאנחנו דורשים מה-AI (ומאמתים בפועל עם zod) ---
const activitySchema = z.object({
  name: z.string(),
  description: z.string().optional().default(""),
  category: z.string().optional().default("general"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  durationMinutes: z.number().int().positive().optional(),
  estimatedCostUsd: z.number().nonnegative().optional(),
  placeId: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

const daySchema = z.object({
  dayIndex: z.number().int().nonnegative(),
  date: z.string(), // "YYYY-MM-DD"
  summary: z.string().optional().default(""),
  activities: z.array(activitySchema).min(1),
});

const itinerarySchema = z.object({
  days: z.array(daySchema).min(1),
});

export type GeneratedItinerary = z.infer<typeof itinerarySchema>;

export interface GenerateItineraryInput {
  destinationName: string;
  startDate: Date;
  endDate: Date;
  budgetLevel: "LOW" | "MEDIUM" | "HIGH";
  interests: string[];
  candidatePlaces: PlaceResult[];
  weather: DailyWeatherSummary[];
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildPrompt(input: GenerateItineraryInput): string {
  const numDays =
    Math.round(
      (input.endDate.getTime() - input.startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

  const placesList = input.candidatePlaces
    .slice(0, 40)
    .map(
      (p) =>
        `- ${p.name} | category: ${p.category} | placeId: ${p.placeId} | address: ${p.address} | lat/lng: ${p.lat},${p.lng}${p.rating ? ` | rating: ${p.rating}` : ""}`
    )
    .join("\n");

  const weatherList = input.weather.length
    ? input.weather
        .map((w) => `- ${w.date}: ${w.minTemp}–${w.maxTemp}°C, ${w.condition}`)
        .join("\n")
    : "(אין נתוני תחזית זמינים - התאריכים רחוקים מדי; תכנן מסלול גנרי המתאים לעונה)";

  return `אתה מתכנן טיולים מקצועי. בנה מסלול טיול מפורט ל-${numDays} ימים ליעד "${input.destinationName}".

תאריכים: ${toDateOnly(input.startDate)} עד ${toDateOnly(input.endDate)}
רמת תקציב: ${input.budgetLevel}
תחומי עניין: ${input.interests.length ? input.interests.join(", ") : "כללי / אטרקציות מובילות"}

תחזית מזג אוויר ידועה:
${weatherList}

רשימת מקומות אמיתיים שנמצאו בסביבת היעד (עדיף להשתמש בהם, כולל ה-placeId המדויק, כדי שנוכל להציג אותם על מפה):
${placesList || "(לא נמצאו מקומות - הצע מקומות ידועים ביעד לפי הידע הכללי שלך, והשאר placeId כ-null)"}

הנחיות:
1. צור בדיוק ${numDays} ימים (dayIndex מ-0 ועד ${numDays - 1}), עם תאריך בפורמט YYYY-MM-DD לכל יום.
2. לכל יום: 3-5 פעילויות, בסדר הגיוני לפי שעה (בוקר/צהריים/ערב), עם startTime משוער.
3. השתמש ככל האפשר במקומות מהרשימה שסופקה (כולל placeId, address, lat, lng). אם אתה מציע מקום שאינו ברשימה, השאר placeId כ-null.
4. התאם את העלות המשוערת (estimatedCostUsd) לרמת התקציב שצוינה.
5. אם יש תחזית גשם/חום קיצוני ביום מסוים - התחשב בכך בבחירת הפעילויות (למשל מוזיאון ביום גשום).
6. החזר אך ורק JSON תקין במבנה הבא, ללא טקסט נוסף:

{
  "days": [
    {
      "dayIndex": 0,
      "date": "YYYY-MM-DD",
      "summary": "משפט אחד שמתאר את היום",
      "activities": [
        {
          "name": "string",
          "description": "string",
          "category": "string",
          "startTime": "HH:MM",
          "durationMinutes": number,
          "estimatedCostUsd": number,
          "placeId": "string או null",
          "address": "string או null",
          "lat": number או null,
          "lng": number או null
        }
      ]
    }
  ]
}`;
}

export async function generateItinerary(
  input: GenerateItineraryInput
): Promise<GeneratedItinerary> {
  const openai = getClient();

  const completion = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a meticulous travel-planning assistant that always replies with valid JSON matching the schema the user describes, and nothing else.",
      },
      { role: "user", content: buildPrompt(input) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw AppError.internal("AI returned an empty response");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw AppError.internal("AI response was not valid JSON", { raw });
  }

  const result = itinerarySchema.safeParse(parsedJson);
  if (!result.success) {
    throw AppError.internal("AI response did not match expected schema", {
      issues: result.error.flatten(),
    });
  }

  return result.data;
}
