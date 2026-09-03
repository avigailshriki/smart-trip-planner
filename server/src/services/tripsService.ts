import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { activities, tripDays, trips } from "../db/schema";
import { AppError } from "../utils/AppError";
import { geocodeDestination, searchPlacesForInterests } from "./googlePlaces";
import { getForecastSummary } from "./weather";
import { generateItinerary } from "./aiItinerary";

/** מוודא שהטיול קיים ושייך למשתמש המחובר, ומחזיר אותו. */
export async function getOwnedTripOrThrow(tripId: string, userId: string) {
  const trip = await db.query.trips.findFirst({
    where: and(eq(trips.id, tripId), eq(trips.userId, userId)),
  });
  if (!trip) throw AppError.notFound("Trip not found");
  return trip;
}

/** מחזיר טיול מלא כולל ימים ופעילויות, ממוינים לפי סדר. */
export async function getTripWithItinerary(tripId: string, userId: string) {
  const trip = await getOwnedTripOrThrow(tripId, userId);

  const days = await db.query.tripDays.findMany({
    where: eq(tripDays.tripId, trip.id),
  });
  const daysSorted = [...days].sort((a, b) => a.dayIndex - b.dayIndex);

  const daysWithActivities = await Promise.all(
    daysSorted.map(async (day) => {
      const dayActivities = await db.query.activities.findMany({
        where: eq(activities.tripDayId, day.id),
      });
      return {
        ...day,
        activities: [...dayActivities].sort((a, b) => a.orderIndex - b.orderIndex),
      };
    })
  );

  return { ...trip, days: daysWithActivities };
}

function dayCount(startDate: Date, endDate: Date): number {
  return (
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
}

/**
 * התהליך המרכזי: geocoding -> חיפוש מקומות -> תחזית מזג אוויר -> יצירת מסלול ב-AI -> שמירה במסד הנתונים.
 * מעדכן את status של הטיול לאורך הדרך כך שהלקוח יכול לבצע polling אם ירצה.
 */
export async function generateTripItinerary(tripId: string, userId: string) {
  const trip = await getOwnedTripOrThrow(tripId, userId);

  await db.update(trips).set({ status: "GENERATING", generationError: null }).where(eq(trips.id, trip.id));

  try {
    const geo = await geocodeDestination(trip.destinationName);
    const places = await searchPlacesForInterests(trip.destinationName, trip.interests);
    const weather = await getForecastSummary(
      geo.lat,
      geo.lng,
      trip.startDate,
      trip.endDate
    );

    const itinerary = await generateItinerary({
      destinationName: trip.destinationName,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budgetLevel: trip.budgetLevel,
      interests: trip.interests,
      candidatePlaces: places,
      weather,
    });

    // מוחקים ימים/פעילויות קודמים (אם זו יצירה חוזרת) ושומרים את החדשים בטרנזקציה אחת
    await db.transaction(async (tx) => {
      await tx.delete(tripDays).where(eq(tripDays.tripId, trip.id));

      for (const day of itinerary.days) {
        const [insertedDay] = await tx
          .insert(tripDays)
          .values({
            tripId: trip.id,
            dayIndex: day.dayIndex,
            date: new Date(day.date),
            summary: day.summary,
          })
          .returning();

        if (day.activities.length > 0) {
          await tx.insert(activities).values(
            day.activities.map((activity, index) => ({
              tripDayId: insertedDay.id,
              orderIndex: index,
              name: activity.name,
              description: activity.description,
              category: activity.category,
              placeId: activity.placeId ?? null,
              address: activity.address ?? null,
              lat: activity.lat ?? null,
              lng: activity.lng ?? null,
              startTime: activity.startTime ?? null,
              durationMinutes: activity.durationMinutes ?? null,
              estimatedCostUsd: activity.estimatedCostUsd ?? null,
              source: "AI" as const,
            }))
          );
        }
      }

      await tx
        .update(trips)
        .set({
          status: "READY",
          destinationLat: geo.lat,
          destinationLng: geo.lng,
          weatherSnapshot: weather,
        })
        .where(eq(trips.id, trip.id));
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during generation";
    await db
      .update(trips)
      .set({ status: "FAILED", generationError: message })
      .where(eq(trips.id, trip.id));
    throw err;
  }

  return getTripWithItinerary(tripId, userId);
}

export { dayCount };
