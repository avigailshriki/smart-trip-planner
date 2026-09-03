import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { activities, trips } from "../db/schema";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import {
  generateTripItinerary,
  getOwnedTripOrThrow,
  getTripWithItinerary,
} from "../services/tripsService";

export const tripsRouter = Router();

tripsRouter.use(requireAuth);

// --- Validation schemas ---
const createTripSchema = z.object({
  destinationName: z.string().min(2).max(255),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  budgetLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  interests: z.array(z.string().min(1)).max(10).default([]),
}).refine((data) => data.endDate >= data.startDate, {
  message: "endDate must be on or after startDate",
  path: ["endDate"],
});

const updateTripSchema = z.object({
  destinationName: z.string().min(2).max(255).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  budgetLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  interests: z.array(z.string().min(1)).max(10).optional(),
});

const activityInputSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  durationMinutes: z.number().int().positive().optional(),
  estimatedCostUsd: z.number().nonnegative().optional(),
  placeId: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

// --- Trip CRUD ---

tripsRouter.post(
  "/",
  validate(createTripSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createTripSchema>;
    const [trip] = await db
      .insert(trips)
      .values({
        userId: req.auth!.userId,
        destinationName: body.destinationName,
        startDate: body.startDate,
        endDate: body.endDate,
        budgetLevel: body.budgetLevel,
        interests: body.interests,
      })
      .returning();
    res.status(201).json({ trip });
  })
);

tripsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userTrips = await db.query.trips.findMany({
      where: eq(trips.userId, req.auth!.userId),
    });
    userTrips.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    res.json({ trips: userTrips });
  })
);

tripsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const trip = await getTripWithItinerary(req.params.id, req.auth!.userId);
    res.json({ trip });
  })
);

tripsRouter.patch(
  "/:id",
  validate(updateTripSchema),
  asyncHandler(async (req, res) => {
    await getOwnedTripOrThrow(req.params.id, req.auth!.userId);
    const body = req.body as z.infer<typeof updateTripSchema>;

    const [updated] = await db
      .update(trips)
      .set(body)
      .where(eq(trips.id, req.params.id))
      .returning();

    res.json({ trip: updated });
  })
);

tripsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await getOwnedTripOrThrow(req.params.id, req.auth!.userId);
    await db.delete(trips).where(eq(trips.id, req.params.id));
    res.status(204).send();
  })
);

// --- AI itinerary generation ---

tripsRouter.post(
  "/:id/generate",
  asyncHandler(async (req, res) => {
    const trip = await generateTripItinerary(req.params.id, req.auth!.userId);
    res.json({ trip });
  })
);

// --- Manual activity editing ---

tripsRouter.post(
  "/:id/days/:dayId/activities",
  validate(activityInputSchema),
  asyncHandler(async (req, res) => {
    await getOwnedTripOrThrow(req.params.id, req.auth!.userId);
    const body = req.body as z.infer<typeof activityInputSchema>;

    const existing = await db.query.activities.findMany({
      where: eq(activities.tripDayId, req.params.dayId),
    });
    const nextOrderIndex = existing.length
      ? Math.max(...existing.map((a) => a.orderIndex)) + 1
      : 0;

    const [activity] = await db
      .insert(activities)
      .values({
        tripDayId: req.params.dayId,
        orderIndex: nextOrderIndex,
        source: "MANUAL",
        ...body,
      })
      .returning();

    res.status(201).json({ activity });
  })
);

tripsRouter.patch(
  "/:id/days/:dayId/activities/:activityId",
  validate(activityInputSchema.partial()),
  asyncHandler(async (req, res) => {
    await getOwnedTripOrThrow(req.params.id, req.auth!.userId);
    const body = req.body as Partial<z.infer<typeof activityInputSchema>>;

    const [updated] = await db
      .update(activities)
      .set({ ...body, source: "MANUAL" })
      .where(
        and(
          eq(activities.id, req.params.activityId),
          eq(activities.tripDayId, req.params.dayId)
        )
      )
      .returning();

    if (!updated) throw AppError.notFound("Activity not found");
    res.json({ activity: updated });
  })
);

tripsRouter.delete(
  "/:id/days/:dayId/activities/:activityId",
  asyncHandler(async (req, res) => {
    await getOwnedTripOrThrow(req.params.id, req.auth!.userId);
    await db
      .delete(activities)
      .where(
        and(
          eq(activities.id, req.params.activityId),
          eq(activities.tripDayId, req.params.dayId)
        )
      );
    res.status(204).send();
  })
);
